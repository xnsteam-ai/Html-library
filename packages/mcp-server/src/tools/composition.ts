import { z } from 'zod'

import type { RegistryData } from '../data.js'
import recipes from '../vendor/recipes.json' with { type: 'json' }
import { fail, json, type ToolDef } from './shared.js'

type DecisionRow = { when: string[]; components: string[]; note?: string }
type RecipeStep = { component: string; role: string; contains?: string[] }
type NamedRecipe = { title: string; fastPath?: string[]; note?: string; composed: RecipeStep[] }

const decisionTable = recipes.decisionTable as DecisionRow[]
const namedRecipes = recipes.namedRecipes as Record<string, NamedRecipe>
const patterns = recipes.interactivityPatterns as Record<
  string,
  { need: string; mechanism: string; exampleComponents: string[]; note?: string }
>

const RECIPE_KEYS = Object.keys(namedRecipes) as [string, ...string[]]
const PATTERN_KEYS = Object.keys(patterns) as [string, ...string[]]

/** Word-overlap score between a free-text need and a decision row's triggers. */
function scoreRow(row: DecisionRow, need: string): { score: number; matchedOn?: string } {
  const q = need.trim().toLowerCase()
  if (!q) return { score: 0 }
  let best = 0
  let matchedOn: string | undefined

  for (const trigger of row.when) {
    const t = trigger.toLowerCase()
    let score = 0
    if (q === t) score = 1
    else if (q.includes(t) || t.includes(q)) score = 0.8
    else {
      const words = t.split(/\s+/).filter(Boolean)
      const hits = words.filter((w) => q.includes(w)).length
      if (hits > 0) score = (hits / words.length) * 0.6
    }
    if (score > best) {
      best = score
      matchedOn = trigger
    }
  }
  return { score: best, matchedOn }
}

export function compositionTools(data: RegistryData): ToolDef[] {
  /** Attach live descriptions so a recipe answer needs no follow-up lookups. */
  const describe = async (names: string[]) => {
    const out = []
    for (const name of names) {
      const component = await data.get(name)
      if (component) {
        out.push({
          name,
          title: component.title,
          description: component.description,
          portable: component.portable,
        })
      } else {
        out.push({ name, missing: true })
      }
    }
    return out
  }

  return [
    {
      name: 'recommend_components',
      config: {
        title: 'Recommend components',
        description:
          'Describe what you are building in plain language and get the components to reach for. Use this before search_components when you know the goal but not the vocabulary.',
        inputSchema: {
          need: z
            .string()
            .min(1)
            .describe('e.g. "a pricing page", "chat UI", "somewhere to show a loading state"'),
        },
      },
      handler: async ({ need }) => {
        const ranked = decisionTable
          .map((row) => ({ row, ...scoreRow(row, need) }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)

        if (ranked.length === 0) {
          return json({
            need,
            matches: [],
            hint: 'Nothing in the decision table matched. Try search_components with a keyword, or list_components to browse a category.',
          })
        }

        const matches = []
        for (const entry of ranked) {
          matches.push({
            matchedOn: entry.matchedOn,
            confidence: Number(entry.score.toFixed(2)),
            ...(entry.row.note ? { note: entry.row.note } : {}),
            components: await describe(entry.row.components),
          })
        }
        return json({
          need,
          matches,
          hint: 'Call get_component_markup with the names you want. If a recipe exists for this pattern, get_recipe gives the nesting order.',
        })
      },
    },

    {
      name: 'get_recipe',
      config: {
        title: 'Get recipe',
        description:
          'Get the composition order for a known pattern — which components nest inside which, and which single component already contains the rest.',
        inputSchema: {
          recipe: z.enum(RECIPE_KEYS).describe(`One of: ${RECIPE_KEYS.join(', ')}`),
        },
      },
      handler: async ({ recipe }) => {
        const found = namedRecipes[recipe as string]
        if (!found) {
          return fail(`No recipe named "${recipe}".`, { available: RECIPE_KEYS })
        }
        const steps = []
        for (const step of found.composed) {
          const component = await data.get(step.component)
          steps.push({
            component: step.component,
            role: step.role,
            ...(step.contains ? { contains: step.contains } : {}),
            ...(component
              ? { title: component.title, portable: component.portable }
              : { missing: true }),
          })
        }
        return json({
          recipe,
          title: found.title,
          ...(found.fastPath ? { fastPath: await describe(found.fastPath) } : {}),
          ...(found.note ? { note: found.note } : {}),
          composed: steps,
          warning:
            'Bigger components already contain the smaller ones. If you used the fastPath component, do not also paste its parts.',
        })
      },
    },

    {
      name: 'get_interactivity_pattern',
      config: {
        title: 'Get interactivity pattern',
        description:
          'Get the CSS-only mechanism for an interaction. This registry ships no JavaScript — if something looks like it needs JS, it does not.',
        inputSchema: {
          need: z.enum(PATTERN_KEYS).describe(`One of: ${PATTERN_KEYS.join(', ')}`),
        },
      },
      handler: async ({ need }) => {
        const pattern = patterns[need as string]
        if (!pattern) return fail(`No pattern named "${need}".`, { available: PATTERN_KEYS })
        return json({
          need,
          describes: pattern.need,
          mechanism: pattern.mechanism,
          ...(pattern.note ? { note: pattern.note } : {}),
          exampleComponents: await describe(pattern.exampleComponents),
          rule: 'The hidden input is the state. Delete it and the behaviour goes with it — never replace it with a JavaScript handler.',
        })
      },
    },
  ]
}

/** Every component name referenced by the recipe data — used by the CI guard. */
export function referencedComponentNames(): string[] {
  const names = new Set<string>()
  for (const row of decisionTable) for (const name of row.components) names.add(name)
  for (const recipe of Object.values(namedRecipes)) {
    for (const name of recipe.fastPath ?? []) names.add(name)
    for (const step of recipe.composed) {
      names.add(step.component)
      for (const name of step.contains ?? []) names.add(name)
    }
  }
  for (const pattern of Object.values(patterns)) {
    for (const name of pattern.exampleComponents) names.add(name)
  }
  return [...names].sort()
}

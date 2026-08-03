import { z } from 'zod'

import { closestNames, type RegistryData } from '../data.js'
import { SUBSTITUTIONS, scanPortability, validateHtml } from '../vendor/registry-data.mjs'
import { fail, json, type ToolDef } from './shared.js'

/**
 * Which prefixed utilities can carry each bare token. `scanPortability` reports
 * the token (`muted-foreground`); the substitution table is keyed by the full
 * utility (`text-muted-foreground`), so a token maps to one or more entries.
 */
function substitutionsFor(token: string): { from: string; to: string }[] {
  return Object.entries(SUBSTITUTIONS)
    .filter(([utility]) => utility.endsWith(`-${token}`))
    .map(([from, to]) => ({ from, to }))
}

/**
 * Rewrite every app-only utility to its literal-Tailwind equivalent. Matches
 * on a word boundary so `bg-muted` inside `bg-muted-foreground` is left alone,
 * and preserves any variant prefix (`hover:`, `md:`, `dark:`).
 */
function applySubstitutions(html: string): { fixed: string; applied: { from: string; to: string; count: number }[] } {
  let fixed = html
  const applied: { from: string; to: string; count: number }[] = []

  // Longest utility first, so `text-primary-foreground` is replaced before
  // `text-primary` can claim its prefix.
  const ordered = Object.entries(SUBSTITUTIONS).sort((a, b) => b[0].length - a[0].length)

  for (const [from, to] of ordered) {
    const pattern = new RegExp(`(?<![a-z0-9-])${from}(?![a-z0-9-])`, 'g')
    const count = (fixed.match(pattern) ?? []).length
    if (count > 0) {
      fixed = fixed.replace(pattern, to)
      applied.push({ from, to, count })
    }
  }
  return { fixed, applied }
}

export function portabilityTools(data: RegistryData): ToolDef[] {
  return [
    {
      name: 'check_portability',
      config: {
        title: 'Check portability',
        description:
          'Scan HTML for app-only Tailwind tokens that render invisible outside the html-library docs app, and return the corrected markup. Run this on any component markup before pasting it into another project.',
        inputSchema: {
          html: z.string().min(1).describe('The markup or class list to check.'),
        },
      },
      handler: async ({ html }) => {
        const { portable, appTokens } = scanPortability(html)
        if (portable) {
          return json({
            portable: true,
            appTokens: [],
            message: 'No app-only tokens. This markup is safe to paste anywhere Tailwind runs.',
          })
        }

        const { fixed, applied } = applySubstitutions(html)
        const after = scanPortability(fixed)
        return json({
          portable: false,
          appTokens,
          substitutions: applied,
          fixedHtml: fixed,
          fixedIsPortable: after.portable,
          ...(after.portable
            ? {}
            : {
                residual: after.appTokens,
                note: 'Some tokens had no automatic replacement — substitute them by hand.',
              }),
          note: 'Each replacement carries its own dark: variant, so the result works in both themes.',
        })
      },
    },

    {
      name: 'get_component_portability',
      config: {
        title: 'Get component portability',
        description:
          'Check whether a registry component is safe to paste outside this repo, without fetching its markup first.',
        inputSchema: {
          name: z.string().min(1).describe('Exact component name.'),
        },
      },
      handler: async ({ name }) => {
        const component = await data.get(name)
        if (!component) {
          return fail(`No component named "${name}".`, {
            didYouMean: closestNames(await data.names(), name),
          })
        }
        return json({
          name: component.name,
          portable: component.portable,
          appTokens: component.appTokens,
          hasScopedStyle: component.hasStyle,
          ...(component.portable
            ? { message: 'Literal Tailwind only — paste anywhere.' }
            : {
                substitutions: component.appTokens.flatMap(substitutionsFor),
                hint: 'Call get_component_markup then check_portability to get corrected markup in one step.',
              }),
          ...(component.hasStyle
            ? {
                styleNote:
                  'Ships a scoped <style> block carrying keyframes or a component theme. Copy it along with the markup — Tailwind utilities cannot express it.',
              }
            : {}),
        })
      },
    },

    {
      name: 'lint_html',
      config: {
        title: 'Lint HTML',
        description:
          'Validate a fragment against html-library registry conventions — no JavaScript, no className, no external documents, unique ids, matching label/for. These are the exact rules CI enforces on the registry.',
        inputSchema: {
          html: z.string().min(1).describe('The markup to validate.'),
          id: z.string().optional().describe('Label for the messages, e.g. the intended component name.'),
        },
      },
      handler: async ({ html, id }) => {
        const errors: string[] = []
        const warnings: string[] = []
        const label = id || 'fragment'
        validateHtml(label, html, {
          fail: (_id, message) => errors.push(message),
          warn: (_id, message) => warnings.push(message),
        })

        const { portable, appTokens } = scanPortability(html)
        if (!portable) {
          warnings.push(
            `uses app-only tokens (${appTokens.join(', ')}) — fine inside the docs app, broken outside it. Run check_portability.`,
          )
        }

        return json({
          valid: errors.length === 0,
          errors,
          warnings,
          ...(errors.length === 0 && warnings.length === 0
            ? { message: 'Clean — this fragment satisfies every registry convention.' }
            : {}),
        })
      },
    },
  ]
}

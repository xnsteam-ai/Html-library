import { z } from 'zod'

import { scoreMatch, type RegistryData } from '../data.js'
import { CATEGORIES } from '../vendor/registry-data.mjs'
import { json, type ToolDef } from './shared.js'

const categoryEnum = z.enum(['images', 'apps', 'sites', 'agent', 'ui'])

export function discoveryTools(data: RegistryData): ToolDef[] {
  return [
    {
      name: 'list_components',
      config: {
        title: 'List components',
        description:
          'List registry components, optionally filtered by category, surface or tag. Returns names and descriptions, not markup — use get_component_markup for that.',
        inputSchema: {
          category: categoryEnum.optional().describe('images | apps | sites | agent | ui'),
          surface: z
            .enum(['app', 'site', 'section'])
            .optional()
            .describe('Whole-screen items only. Omit for parts.'),
          tag: z.string().optional().describe('Exact tag match, e.g. "chat".'),
          limit: z.number().int().min(1).max(200).default(50),
          offset: z.number().int().min(0).default(0),
        },
      },
      handler: async ({ category, surface, tag, limit = 50, offset = 0 }) => {
        let items = await data.summaries()
        if (category) items = items.filter((c) => c.category === category)
        if (surface) items = items.filter((c) => c.surface === surface)
        if (tag) {
          const needle = tag.toLowerCase()
          items = items.filter((c) => c.tags.some((t) => t.toLowerCase() === needle))
        }
        const page = items.slice(offset, offset + limit)
        return json({
          total: items.length,
          offset,
          returned: page.length,
          items: page.map((c) => ({
            name: c.name,
            title: c.title,
            description: c.description,
            category: c.category,
            ...(c.surface ? { surface: c.surface } : {}),
            tags: c.tags,
          })),
        })
      },
    },

    {
      name: 'search_components',
      config: {
        title: 'Search components',
        description:
          'Search components by name, title, description and tags. Use when you know what you want but not what it is called.',
        inputSchema: {
          query: z.string().min(1).describe('e.g. "chat", "pricing", "loading spinner"'),
          category: categoryEnum.optional(),
          limit: z.number().int().min(1).max(100).default(20),
        },
      },
      handler: async ({ query, category, limit = 20 }) => {
        let items = await data.summaries()
        if (category) items = items.filter((c) => c.category === category)
        const matches = items
          .map((c) => ({ c, score: scoreMatch({ ...c, tags: c.tags }, query) }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))
          .slice(0, limit)

        if (matches.length === 0) {
          return json({
            query,
            matches: [],
            hint: 'No match. Try a broader term, or call list_components to browse a category, or recommend_components to describe the need in plain language.',
          })
        }
        return json({
          query,
          matches: matches.map(({ c, score }) => ({
            name: c.name,
            title: c.title,
            description: c.description,
            category: c.category,
            ...(c.surface ? { surface: c.surface } : {}),
            tags: c.tags,
            score: Number(score.toFixed(2)),
          })),
        })
      },
    },

    {
      name: 'get_categories',
      config: {
        title: 'Get categories',
        description:
          'List the registry categories with counts, what each is for, and the canvas each surface is drawn at.',
        inputSchema: {},
      },
      handler: async () => {
        const counts = await data.categoryCounts()
        return json({
          total: counts.reduce((sum, c) => sum + c.count, 0),
          categories: counts,
          surfaces: [
            { surface: 'app', canvas: '390x844', note: 'phone frame; apps only' },
            { surface: 'site', canvas: '1280x800', note: 'full pages' },
            { surface: 'section', canvas: '1280xauto', note: 'page sections' },
            {
              surface: null,
              canvas: '640xauto',
              note: 'element — no chrome. Agent and UI elements omit surface entirely.',
            },
          ],
          note: `Only ${CATEGORIES.apps.title} and ${CATEGORIES.sites.title} items declare a surface.`,
        })
      },
    },
  ]
}

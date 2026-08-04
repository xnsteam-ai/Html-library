import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { z } from 'zod'

import { fail, json, type ToolDef } from './shared.js'

/**
 * The skill, served from inside the package.
 *
 * MCP cannot compel a client to read anything — the spec makes the server's
 * `instructions` a hint clients *MAY* put in the system prompt. So guidance
 * reaches an agent three ways, weakest to strongest: `instructions` (loaded
 * automatically where supported), tool descriptions (always sent with
 * tools/list, so guaranteed to be in context), and these tools, which serve
 * the depth on request.
 *
 * The docs are vendored rather than fetched so an offline or firewalled agent
 * gets the same guide as one with network access.
 */

const require = createRequire(import.meta.url)
/**
 * Resolved off an existing vendored file rather than assembled from
 * `import.meta.url`, so it lands correctly whether this runs from `src/` under
 * tsx or from `dist/` in the published package. Exported because server.ts
 * needs the same directory and two hand-written relative paths would disagree
 * the moment either file moves.
 */
export const VENDOR_DIR = path.dirname(require.resolve('../vendor/recipes.json'))
const SKILL_DIR = path.join(VENDOR_DIR, 'skill')

const TOPICS = {
  'design-system': {
    file: 'references/design-system.md',
    blurb: 'How the library looks: palette, type scale, radius rhythm, per-category signature, button anatomy, state vocabulary, the three shipped design systems.',
  },
  conventions: {
    file: 'references/conventions.md',
    blurb: 'The class contract: portable vs app-only vocabularies, dark-mode pairing, id uniqueness, CSS-only state, accessibility floor.',
  },
  recipes: {
    file: 'references/recipes.md',
    blurb: 'Composition: which component for which need, nesting order, surface-to-canvas mapping, porting to a framework.',
  },
  troubleshooting: {
    file: 'references/troubleshooting.md',
    blurb: 'Symptom to cause to fix for the failures that actually happen.',
  },
  'registry-api': {
    file: 'references/registry-api.md',
    blurb: 'Fetching over HTTP: endpoints, JSON shapes, adding a component.',
  },
  components: {
    file: 'references/components.md',
    blurb: 'Every non-image component with its surface, tags and class vocabulary.',
  },
  images: { file: 'references/images.md', blurb: 'The image catalogue and the recreation-prompt schema.' },
  overview: { file: 'SKILL.md', blurb: 'The whole skill entry point, including the full component index.' },
} as const

type Topic = keyof typeof TOPICS
const TOPIC_NAMES = Object.keys(TOPICS) as [Topic, ...Topic[]]

/**
 * Whether the guide has been read, held per server rather than per module.
 *
 * A stdio server is one process per session, so a module-level flag would be
 * correct in production — but it silently couples two servers built in the
 * same process, which is exactly what tests do. Threading it makes the
 * lifetime explicit and the behaviour deterministic.
 */
export interface GuideSession {
  read: boolean
  nudged: boolean
}

export const newGuideSession = (): GuideSession => ({ read: false, nudged: false })

export async function readSkillDoc(file: string): Promise<string> {
  return readFile(path.join(SKILL_DIR, file), 'utf8')
}

/** Category guides are assembled from the sections the design reference already measures. */
const CATEGORY_GUIDE: Record<string, { canvas: string; summary: string; rules: string[] }> = {
  apps: {
    canvas: '390×844, fixed — `flex h-[844px] w-[390px] flex-col`',
    summary: 'Complete mobile screens. The only category that is 100% literal Tailwind, so the safest to copy from.',
    rules: [
      'Radii skew a step larger: cards and full-width buttons are `rounded-2xl`/`rounded-3xl`.',
      'Cards are borderless. Separation is elevation (`bg-white` on `bg-gray-50`) plus `divide-y divide-gray-100 dark:divide-white/5` — not `border`.',
      'Full-width actions: `rounded-2xl py-4 text-[15px] font-medium`.',
      'Decorative devices unique here: overflow blobs, gradient hero rings, paging dots (`h-1.5 w-6` active vs `h-1.5 w-1.5` inactive), coloured transaction avatars.',
      'Surface `app` is required in meta.json.',
    ],
  },
  sites: {
    canvas: '1280×800 for pages (`site`), 1280×auto for sections (`section`)',
    summary: 'Whole marketing pages and the sections they are built from. Sections stack in one column to make a page.',
    rules: [
      'Section frame: `w-full bg-white px-6 py-24 dark:bg-neutral-950`, inner `mx-auto max-w-4xl` or `max-w-6xl`.',
      'Display type runs large: `text-[56px] font-semibold leading-[1.05] tracking-[-0.02em]` for a hero h1.',
      'Cards and tiers are `rounded-2xl border border-gray-200 p-6 dark:border-white/10`.',
      'CTAs are bigger than a UI button: `rounded-xl px-5 py-3 text-[14.5px] font-medium`.',
      'Surface `site` or `section` is required in meta.json — never `app`.',
    ],
  },
  agent: {
    canvas: '640×auto (`element`); two whole-page items set `site`',
    summary: 'Chat surfaces, composers and tool-call cards.',
    rules: [
      'Always wrapped `mx-auto w-full max-w-2xl`.',
      'Composer shell: `rounded-xl border border-gray-200 bg-white shadow-sm focus-within:border-gray-300 dark:border-white/10 dark:bg-neutral-950 dark:shadow-none`.',
      'Shadows are a light-mode device — pair every `shadow-*` with `dark:shadow-none`.',
      'The user bubble tail `rounded-2xl rounded-br-md` is unique to this category.',
      'Body copy `text-[14px] leading-relaxed`; metadata `text-[11px]`.',
      'Bigger items already contain smaller ones — if you used `agent-chat`, do not also paste `input-bar`.',
    ],
  },
  ui: {
    canvas: '640×auto (`element`) — no surface set',
    summary: 'General-purpose primitives that pair with the agent set.',
    rules: [
      'Radius rhythm: control `rounded-lg`, container `rounded-xl`, pill/avatar `rounded-full`.',
      'Bordered surface: `rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-950`.',
      'Button sizes are fixed: sm `px-2.5 py-1 text-[12px]`, md `px-3.5 py-2 text-[13px]`, lg `px-5 py-2.5 text-[15px]`.',
      'Copy the focus ring from `ui/button` — it is the reference implementation and most components lack one.',
      'Disabled is the HTML `disabled` attribute plus `cursor-not-allowed bg-gray-200 dark:bg-white/10`. The `disabled:` variant is never used here.',
    ],
  },
  images: {
    canvas: 'n/a — a figure, not a screen',
    summary: 'Ready-to-paste photography served from a CDN, each with a structured recreation prompt.',
    rules: [
      'The `<img>` points at a deployed CDN URL and is portable as-is — do not rewrite it to a relative path.',
      'Call `get_image_prompt` for the seven-block recreation brief, including exact framing geometry.',
      'Facets (`style`, `palette`, `subject`, `lighting`) group images by aesthetic.',
    ],
  },
}

export function guideTools(session: GuideSession): ToolDef[] {
  return [
    {
      name: 'get_design_guide',
      config: {
        title: 'Get design guide',
        description:
          'Read the html-library design guide. Call this once before writing or editing component markup — it carries the measured design language (palette, type scale, radius rhythm, dark-mode strategy, state vocabulary) that the server instructions only summarise. Defaults to the design system.',
        inputSchema: {
          topic: z
            .enum(TOPIC_NAMES)
            .default('design-system')
            .describe(`One of: ${TOPIC_NAMES.join(', ')}`),
        },
      },
      handler: async ({ topic }) => {
        const key = (topic ?? 'design-system') as Topic
        const entry = TOPICS[key]
        if (!entry) return fail(`No guide topic "${topic}".`, { available: TOPIC_NAMES })
        try {
          const content = await readSkillDoc(entry.file)
          session.read = true
          return {
            content: [{ type: 'text' as const, text: content }],
          }
        } catch (error) {
          return fail(
            `Could not read the ${key} guide: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      },
    },

    {
      name: 'get_category_guide',
      config: {
        title: 'Get category guide',
        description:
          'How one category behaves and looks — canvas size, radius rhythm, type scale, dark-mode strategy and the conventions specific to it. Call this when you are building inside apps, sites, agent or ui.',
        inputSchema: {
          category: z
            .enum(['apps', 'sites', 'agent', 'ui', 'images'])
            .describe('apps | sites | agent | ui | images'),
        },
      },
      handler: async ({ category }) => {
        const guide = CATEGORY_GUIDE[category as string]
        if (!guide) {
          return fail(`No guide for "${category}".`, { available: Object.keys(CATEGORY_GUIDE) })
        }
        session.read = true
        return json({
          category,
          canvas: guide.canvas,
          summary: guide.summary,
          rules: guide.rules,
          sharedContract: [
            'class, never className — these are HTML files.',
            'No JavaScript. Interactivity is CSS-only.',
            'Every colour utility needs its dark: partner.',
            'Light side uses named grays; dark side uses alpha-on-white (white/5, /10, /15).',
            'Keep any <style> block — it carries keyframes or a scoped palette.',
          ],
          seeAlso: 'get_design_guide for the full measured design system, including the button anatomy and the three shipped palettes.',
        })
      },
    },
  ]
}

export const GUIDE_TOPICS = TOPICS

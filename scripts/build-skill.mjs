#!/usr/bin/env node
/**
 * Builds the agent skill from the registry, so it can never drift.
 *
 * Hand-authored (never overwritten):
 *   skills/html-library/references/{conventions,recipes,registry-api,troubleshooting}.md
 *
 * Generated:
 *   skills/html-library/SKILL.md              entry point, always loaded
 *   skills/html-library/references/components.md
 *   skills/html-library/references/images.md
 *   public/skill.md                           single-file bundle (one fetch)
 *   public/llms.txt                           llms.txt convention
 *   public/skill.json                         machine-readable manifest
 *
 * Note: nothing here writes into public/r — `build-registry.mjs` owns that
 * directory outright (it wipes it on every run and treats unknown files there
 * as orphans), so the two generators never collide and can run in either order.
 *
 *   node scripts/build-skill.mjs           write the output
 *   node scripts/build-skill.mjs --check   fail if the output is stale
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CATEGORIES,
  PAGES_URL,
  RAW_URL,
  REPO_URL,
  SUBSTITUTIONS,
  readRegistryItems,
} from './lib/registry-data.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY_DIR = path.join(root, 'registry')
const SKILL_DIR = path.join(root, 'skills', 'html-library')
const REF_DIR = path.join(SKILL_DIR, 'references')
const PUBLIC_DIR = path.join(root, 'public')

// Hand-authored reference files, in the order they are bundled.
const STATIC_REFS = ['conventions', 'recipes', 'registry-api', 'troubleshooting']

const checkOnly = process.argv.includes('--check')

/** The shared reader returns `{ meta, … }`; the templates below want it flat. */
async function readComponents() {
  const { items } = await readRegistryItems(REGISTRY_DIR)
  return items.map(({ meta, html, appTokens, portable, hasStyle }) => ({
    ...meta,
    // Kept so the design reference can measure real class usage rather than
    // restate what someone believed the conventions were.
    html,
    appTokens,
    portable,
    hasStyle,
  }))
}

const inCategory = (items, id) => items.filter((item) => item.category === id)

/** The portability substitution table, rendered from the shared map. */
function substitutionRows() {
  return Object.entries(SUBSTITUTIONS)
    .map(([token, replacement]) => `| \`${token}\` | \`${replacement}\` |`)
    .join('\n')
}

/** `- \`name\` — description` lines, for a category. */
function indexLines(items) {
  return items
    .map((item) => {
      const surface = item.surface ? ` \`[${item.surface}]\`` : ''
      const flag = item.portable ? '' : ' ⚠'
      return `- \`${item.name}\`${surface}${flag} — ${item.description}`
    })
    .join('\n')
}

// ---------------------------------------------------------------------------
// SKILL.md — the entry point. Everything a model needs without a second fetch.
// ---------------------------------------------------------------------------
function buildSkillMd(items) {
  const counts = Object.fromEntries(
    Object.keys(CATEGORIES).map((id) => [id, inCategory(items, id).length]),
  )
  const total = items.length
  const impure = items.filter((item) => !item.portable)
  const impureByCat = Object.keys(CATEGORIES)
    .map((id) => [id, impure.filter((item) => item.category === id).length])
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${CATEGORIES[id].title.toLowerCase()} ${n}`)
    .join(', ')

  const images = inCategory(items, 'images')
  const imageNames = images.map((item) => item.name.replace(/^image-/, '')).join(', ')

  return `---
name: html-library
description: >-
  Use when building UI with the HTML Library registry (${total} copy-paste
  components: mobile app screens, marketing pages, agent chat surfaces, UI
  primitives and photography). Plain HTML + Tailwind — no React, no JavaScript,
  no dependencies. Covers fetching components, the class-portability contract,
  CSS-only interactivity, dark mode, and composing whole screens.
license: MIT
homepage: ${PAGES_URL}
repository: ${REPO_URL}
version: 1
---

# HTML Library

A registry of **${total} copy-paste UI components written in plain HTML +
Tailwind CSS**. Not React. Not a framework. No JavaScript, no build step, no
dependency to install. Every component is a self-contained fragment of markup
that works anywhere Tailwind runs — React, Vue, Svelte, Astro, Rails, Django,
Laravel, PHP, or a bare \`.html\` file.

## Quick start

\`\`\`bash
BASE=${PAGES_URL}/r

curl -s $BASE/index.json | jq -r '.items[].name'          # list everything
curl -s $BASE/button.json | jq -r '.files[0].content'     # get the markup
\`\`\`

\`.files[0].content\` is the complete component. Paste it. That is the whole
workflow — there is no CLI and no install command.

Working in this repo instead of over the network? The same string lives at
\`registry/<category>/<name>/component.html\`. Read it directly.

## The 6 rules

Follow these and you will not produce broken output.

1. **It is \`class\`, never \`className\`.** These are HTML files.
2. **Never add JavaScript.** Interactivity is CSS-only. If a component seems to
   need JS, it does not — see the pattern table below.
3. **Always pair a \`dark:\` variant** with every color utility. A bare
   \`bg-white\` is invisible in dark mode.
4. **Check the class vocabulary before pasting.** ${impure.length} of ${total}
   components use app-only theme tokens that render invisible outside this repo.
   See *Class portability* below — this is the single most common failure.
5. **Re-namespace \`id\` / \`for\` / \`name\`** if you paste a component twice.
   CSS-only state is keyed on them and two copies will cross-talk.
6. **Keep any \`<style>\` block.** It carries \`@keyframes\` or a scoped color
   theme that Tailwind utilities cannot express.

## Class portability — read before pasting

Two vocabularies exist in this registry.

| Vocabulary | Looks like | Portable? |
|---|---|---|
| Literal Tailwind | \`bg-gray-900\`, \`text-gray-500\` | Yes — paste anywhere |
| App-only tokens | \`text-muted-foreground\`, \`bg-muted\` | **No** — only inside this docs app |

**${total - impure.length} of ${total} components are fully portable.**
**${impure.length} contain app-only tokens** (${impureByCat}) and are marked ⚠ in
the index below.

Detect:

\`\`\`bash
grep -oE '(text|bg|border)-(muted-foreground|foreground|muted|background|border)\\b' file.html
\`\`\`

Fix — exact 1:1 replacements:

| Replace | With |
|---|---|
${substitutionRows()}

Shortcut: the **Copy HTML** button on any component page emits a standalone
document with the Tailwind CDN and theme attached — correct anywhere, zero setup.

## CSS-only interactivity

| Need | Mechanism |
|---|---|
| Tabs, segmented control, nav | hidden \`<input type="radio">\` + \`group-has-[#id:checked]/name:\` |
| Toggle, switch | hidden \`<input type="checkbox" class="peer">\` + \`peer-checked:\` |
| Dismiss a banner | checkbox + \`peer-checked:hidden\` |
| Dropdown, disclosure | native \`<details>\`/\`<summary>\` + \`group-open/name:\` |
| Row selection | \`:has()\` — \`has-checked:\`, \`has-[tbody_:checked]:\` |

Deleting the hidden \`<input>\` deletes the behavior — it *is* the state.

## Categories

| Category | Count | What it is | Canvas |
|---|---|---|---|
| \`images\` | ${counts.images} | ${CATEGORIES.images.blurb} | — |
| \`apps\` | ${counts.apps} | ${CATEGORIES.apps.blurb} | 390x844 |
| \`sites\` | ${counts.sites} | ${CATEGORIES.sites.blurb} | 1280x800 / 1280xauto |
| \`agent\` | ${counts.agent} | ${CATEGORIES.agent.blurb} | 640xauto |
| \`ui\` | ${counts.ui} | ${CATEGORIES.ui.blurb} | 640xauto |

\`surface\` decides the canvas: \`app\` (390x844), \`site\` (1280x800),
\`section\` (1280xauto), or omitted → \`element\` (640xauto, no chrome).
Only \`apps\` and \`sites\` require it.

## Component index

\`[surface]\` is shown where set. ⚠ = contains app-only tokens, needs the
substitution table above.

### Apps — ${counts.apps}

${indexLines(inCategory(items, 'apps'))}

### Sites — ${counts.sites}

${indexLines(inCategory(items, 'sites'))}

### Agent Elements — ${counts.agent}

${indexLines(inCategory(items, 'agent'))}

### UI Elements — ${counts.ui}

${indexLines(inCategory(items, 'ui'))}

### Images — ${counts.images}

All are \`image-*\`. Every one carries a structured \`prompt\` object (subject,
composition, **framing geometry**, environment, lighting, camera, atmosphere)
for handing to an image model:

\`\`\`bash
curl -s $BASE/image-sunlit-portrait.json | jq '.prompt'
\`\`\`

Available (drop the \`image-\` prefix here for brevity — the real name keeps it):

${imageNames}

## Reference files

Load these only when the task calls for them.

| File | Read it when |
|---|---|
| \`references/conventions.md\` | Writing or editing a component; full class contract, a11y, dark mode |
| \`references/recipes.md\` | Composing a screen; decision tables, nesting order, framework porting |
| \`references/registry-api.md\` | Fetching over the network; JSON shapes, jq recipes, adding a component |
| \`references/troubleshooting.md\` | Something renders wrong; symptom → cause → fix |
| \`references/components.md\` | Full detail on every component — tags, surface, portability |
| \`references/images.md\` | Full image catalogue with tags |

## Do not

- Do not add React, JSX, \`className\`, or any JavaScript.
- Do not invent component names — every valid name is in the index above.
- Do not strip a \`<style>\` block or a hidden \`<input>\`.
- Do not emit a color utility without its \`dark:\` partner.
- Do not use \`text-gray-500\` on a dark surface (3.9:1 — below the 4.5:1 floor).
`
}

// ---------------------------------------------------------------------------
// references/design-system.md — what the library actually looks like.
//
// Measured, not asserted. Every count below is read off the markup at build
// time, so the guide describes the library as it is rather than as someone
// remembered it — the same reason SKILL.md is generated.
// ---------------------------------------------------------------------------

/** Every class token used across a set of components, with occurrence counts. */
function tallyClasses(items, test) {
  const counts = new Map()
  for (const item of items) {
    for (const [, attr] of item.html.matchAll(/class="([^"]*)"/g)) {
      for (const token of attr.split(/\s+/)) {
        if (!token || !test(token)) continue
        counts.set(token, (counts.get(token) ?? 0) + 1)
      }
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

const top = (rows, n) => rows.slice(0, n).map(([name, count]) => `\`${name}\` ×${count}`).join(' · ')

/** How often a raw pattern appears, and in how many files — practice, not theory. */
function usage(items, pattern) {
  let total = 0
  let files = 0
  for (const item of items) {
    const hits = item.html.match(pattern)
    if (hits) {
      total += hits.length
      files++
    }
  }
  return { total, files }
}

function buildDesignSystemMd(items) {
  const parts = items.filter((item) => item.category !== 'images')
  const byCat = (id) => parts.filter((item) => item.category === id)

  const isSize = (t) => /^text-\[[\d.]+px\]$/.test(t)
  const isRadius = (t) => /^rounded(-|$)/.test(t)

  const sizes = tallyClasses(parts, isSize)
  const radii = tallyClasses(parts, isRadius)
  const scoped = parts.filter((item) => item.hasStyle)

  const state = (label, pattern) => {
    const { total, files } = usage(parts, pattern)
    return `| ${label} | ${total} | ${files} of ${parts.length} |`
  }

  /** Per-category signature, measured the same way for each. */
  const signature = (id) => {
    const group = byCat(id)
    return {
      count: group.length,
      radii: top(tallyClasses(group, isRadius), 4),
      sizes: top(tallyClasses(group, isSize), 4),
    }
  }
  const sig = Object.fromEntries(['ui', 'agent', 'sites', 'apps'].map((id) => [id, signature(id)]))

  return `# Design system — what the library looks like

Every number here is counted from the markup when this file is generated, so it
describes the library as it is rather than as anyone remembers it. ${parts.length}
non-image components.

## The rule that explains most of the palette

Light side uses named grays; **dark side switches to alpha-on-white** for
surfaces and borders. This is the most consistent convention in the library.

\`\`\`
light                       dark
bg-white                    dark:bg-neutral-950
bg-gray-50                  dark:bg-white/5      (recessed rows)
bg-gray-100                 dark:bg-white/10     (raised chips)
border-gray-200             dark:border-white/10
text-gray-900               dark:text-gray-100   (primary)
text-gray-600               dark:text-gray-400   (secondary)
bg-gray-900 text-white      dark:bg-white dark:text-neutral-900  (primary action)
\`\`\`

Status colours keep their hue in both themes and only shift weight:
\`bg-emerald-50 text-emerald-700\` → \`dark:bg-emerald-500/10 dark:text-emerald-400\`.
The same shape holds for amber, red, violet and rose.

Rebranding is one substitution: \`bg-gray-900\` → your brand, \`dark:bg-white\` →
its dark counterpart.

## Type scale

Sizes are **arbitrary values, not Tailwind's named scale** — \`text-sm\`/\`text-base\`
are effectively unused. The half-pixel steps are the library's signature.

${top(sizes, 12)}

Display sizes appear only in \`sites\` and \`apps\`. Body copy carries
\`leading-relaxed\`; everything else inherits.

## Radius

${top(radii, 8)}

Rhythm: **control \`rounded-lg\` · container \`rounded-xl\` · pill/avatar \`rounded-full\`**,
with \`apps\` sitting one step larger throughout.

## Per category

| Category | Items | Canvas | Radius | Type |
|---|---|---|---|---|
| \`ui\` | ${sig.ui.count} | 640×auto | ${sig.ui.radii} | ${sig.ui.sizes} |
| \`agent\` | ${sig.agent.count} | 640×auto | ${sig.agent.radii} | ${sig.agent.sizes} |
| \`sites\` | ${sig.sites.count} | 1280×800 / auto | ${sig.sites.radii} | ${sig.sites.sizes} |
| \`apps\` | ${sig.apps.count} | 390×844 | ${sig.apps.radii} | ${sig.apps.sizes} |

**UI Elements** — controls \`rounded-lg\`, containers \`rounded-xl\`. Bordered
surfaces: \`rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-950\`.

**Agent Elements** — always \`mx-auto w-full max-w-2xl\`. Composers are
\`rounded-xl … focus-within:border-gray-300\`. The chat bubble tail
\`rounded-2xl rounded-br-md\` is unique to this category. Shadows are a
light-mode device only — \`shadow-sm dark:shadow-none\`.

**Sites** — section frame \`w-full bg-white px-6 py-24 dark:bg-neutral-950\`, inner
\`mx-auto max-w-4xl\` or \`max-w-6xl\`. Full pages are hard-sized \`h-[800px] w-[1280px]\`.
Display type runs to \`text-[56px] font-semibold leading-[1.05] tracking-[-0.02em]\`.
Cards are \`rounded-2xl\`. CTAs are larger than a UI button: \`px-5 py-3 text-[14.5px]\`.

**Apps** — fixed \`flex h-[844px] w-[390px] flex-col\`. Radii skew a step larger:
cards and full-width buttons are \`rounded-2xl\`/\`rounded-3xl\` where another
category would use \`rounded-lg\`. **Cards are borderless** —
separation is elevation (\`bg-white\` on \`bg-gray-50\`) plus
\`divide-y divide-gray-100 dark:divide-white/5\`, not \`border\`. The only category
that is 100% literal Tailwind, so it is the safest source to copy from.

## Button — the canonical control

\`\`\`
small   rounded-md px-2.5 py-1   text-[12px] font-medium
medium  rounded-lg px-3.5 py-2   text-[13px] font-medium
large   rounded-xl px-5 py-2.5   text-[15px] font-medium
icon    flex h-9 w-9 items-center justify-center rounded-lg
\`\`\`

| Variant | Classes |
|---|---|
| primary | \`bg-gray-900 text-white hover:bg-gray-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-gray-200\` |
| secondary | \`border border-gray-200 bg-white hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:hover:bg-white/10\` |
| ghost | \`hover:bg-gray-100 dark:hover:bg-white/10\` |
| destructive | \`bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600\` |
| link | \`underline underline-offset-4\` |

Focus ring, from \`ui/button\` — the reference implementation:

\`\`\`
focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900
focus-visible:ring-offset-2 dark:focus-visible:ring-white
dark:focus-visible:ring-offset-neutral-950
\`\`\`

## State vocabulary, as practised

| Pattern | Occurrences | Files |
|---|---|---|
${[
  state('`hover:`', /hover:/g),
  state('`transition`', /\btransition\b/g),
  state('`peer-checked:`', /peer-checked:/g),
  state('`has-[` / `has-checked`', /has-(\[|checked)/g),
  state('`group-has-`', /group-has-/g),
  state('`aria-`', /aria-[a-z]+=/g),
  state('`focus-visible:`', /focus-visible:/g),
  state('`<details>`', /<details/g),
  state('`active:`', /\bactive:/g),
  state('`motion-reduce`', /motion-reduce/g),
].join('\n')}

Three things this table is telling you, which matter more than the totals:

- **The \`disabled:\` variant is never used.** Disabled is the HTML \`disabled\`
  attribute plus explicit classes: \`cursor-not-allowed bg-gray-200 dark:bg-white/10\`.
- **\`hover:\` is near-universal, \`focus-visible:\` is rare.** Only \`ui/button\`
  implements the full ring-offset pattern. If you are writing new markup, copy it
  — do not copy the majority.
- **\`transition\` is used bare**, so everything animates at Tailwind's default
  150ms. \`transition-all\` appears only alongside the \`active:scale-95\` press idiom.

Named groups (\`group/name\`) are used; named peers never are, so a
\`peer-checked:\` rule always depends on the hidden input being the immediate
previous sibling. Moving it breaks the component silently.

## Three design systems ship, not one

${scoped.length} components carry a scoped \`<style>\` block. Keep it — it holds
either \`@keyframes\` or a palette that utilities cannot express.

**Tailwind-literal** — everything above. The default.

**Fluent** (Microsoft) — \`nav-horizontal\`, \`nav-vertical\`, \`switch\`, \`switch-list\`,
\`table\`, \`table-interactive\`, the skeletons and spinners:

\`\`\`css
--fluent-brand: #0f6cbd;  --text-primary: #242424;  --border-color: #e0e0e0;
/* dark */
--fluent-brand: #479ef5;  --text-primary: #ffffff;  --border-color: #424242;
\`\`\`

**Astryx** (softer editorial) — \`chat-landing\`, \`chat-conversation\`,
\`site-component-docs\`, \`site-ide-shell\`, \`site-product-gallery\`,
\`site-setup-guide\`, \`site-storefront\`:

\`\`\`css
--bg-app: #f4f4f6;  --bg-surface-raised: #ffffff;  --border-color: rgba(0,0,0,.08);
--text-primary: #171717;  --text-secondary: #555555;  --text-muted: #999999;
/* dark */
--bg-app: #141414;  --bg-surface-raised: #222222;  --border-color: rgba(255,255,255,.07);
--text-primary: #e8e8e8;  --text-secondary: #999999;  --text-muted: #555555;
\`\`\`

Do not mix the three in one screen. If you paste a Fluent component next to a
Tailwind-literal one, restyle one of them.

## Motion

Every animation wraps in \`@media (prefers-reduced-motion: reduce) { animation: none }\`.

| Effect | Timing |
|---|---|
| shimmer | \`2.4s linear infinite\` over \`background-size: 200% auto\` |
| skeleton pulse | \`2s cubic-bezier(0.4,0,0.2,1)\`, opacity 1 → 0.3 → 1 |
| spinner | \`1.3s cubic-bezier(0.53,0.21,0.29,0.67)\` |
`
}

// ---------------------------------------------------------------------------
// references/components.md — full detail, non-image
// ---------------------------------------------------------------------------
function buildComponentsMd(items) {
  const sections = ['apps', 'sites', 'agent', 'ui'].map((id) => {
    const rows = inCategory(items, id)
      .map((item) => {
        const tags = (item.tags ?? []).join(', ') || '—'
        const surface = item.surface ?? 'element'
        const port = item.portable ? 'portable' : `⚠ ${item.appTokens.join(', ')}`
        const style = item.hasStyle ? ' · scoped `<style>`' : ''
        return `| \`${item.name}\` | ${item.title} | ${surface} | ${tags} | ${port}${style} |`
      })
      .join('\n')
    return `## ${CATEGORIES[id].title} — ${inCategory(items, id).length}

${CATEGORIES[id].blurb}

| Name | Title | Surface | Tags | Classes |
|---|---|---|---|---|
${rows}`
  })

  return `# Component reference

Every non-image component with its surface, tags and class vocabulary.
"⚠" lists the app-only tokens it uses — substitute them per \`conventions.md\`
before pasting into a project that is not this repo.

${sections.join('\n\n')}
`
}

// ---------------------------------------------------------------------------
// references/images.md
// ---------------------------------------------------------------------------
function buildImagesMd(items) {
  const images = inCategory(items, 'images')
  const rows = images
    .map((item) => `| \`${item.name}\` | ${item.title} | ${(item.tags ?? []).join(', ') || '—'} |`)
    .join('\n')

  return `# Images — ${images.length}

Ready-to-paste photography. The \`<img>\` points at a deployed CDN URL and is
portable as-is; do not rewrite it to a relative path.

\`\`\`bash
BASE=${PAGES_URL}/r
curl -s $BASE/image-sunlit-portrait.json | jq -r '.files[0].content'   # markup
curl -s $BASE/image-sunlit-portrait.json | jq '.prompt'                # brief
\`\`\`

## The \`prompt\` object

Every image carries a structured recreation brief. All fields are optional —
anything not observable in the file is omitted rather than guessed.

| Block | Fields |
|---|---|
| \`subject\` | age, descent, physical, expression, clothing |
| \`composition\` | shotType, angle, placement, distance, depthOfField, focus |
| \`framing\` | subjectScale, subjectBox, anchors, edges, negativeSpace |
| \`environment\` | setting, background, depth |
| \`lighting\` | quality, direction, temperature, shadows |
| \`camera\` | lens, quality, artifacts, aesthetic |
| \`atmosphere\` | mood, story, micro |

\`framing\` is the block most prompts omit. It pins subject scale, bounding box,
anchor lines, edge crops and negative space as percentages of the frame, so a
recreation lands at the same size and position instead of being re-centred.

## Catalogue

| Name | Title | Tags |
|---|---|---|
${rows}
`
}

// ---------------------------------------------------------------------------
// INSTRUCTIONS.md — the MCP server's `instructions` field.
//
// This is the only thing an MCP client loads automatically, so it is the one
// place guaranteed to reach an agent before it writes any markup. It is
// generated rather than typed because the hand-written version had already
// drifted — it claimed 55 tokenised components when the real figure was 54.
//
// Kept deliberately compact. Clients inject this into the system prompt every
// session, so depth belongs behind get_design_guide, not here.
// ---------------------------------------------------------------------------
function buildInstructions(items) {
  const total = items.length
  const impure = items.filter((item) => !item.portable).length
  const counts = Object.fromEntries(
    Object.keys(CATEGORIES).map((id) => [id, inCategory(items, id).length]),
  )

  return `The HTML Library registry: ${total} copy-paste UI components written in plain HTML + Tailwind CSS.

Not React. No package to install, no CLI, no build step. A component is a self-contained fragment of markup; "installing" it means pasting files[0].content into anything that accepts a class attribute — HTML, Vue, Svelte, Astro, Blade, ERB, Jinja, or JSX after renaming class to className.

READ THIS BEFORE GENERATING MARKUP
Call get_design_guide once at the start of any task that writes or edits component markup, and get_category_guide when you are working inside one category. They carry the measured design language — type scale, radius rhythm, dark-mode strategy, state vocabulary — that these few lines can only summarise. Everything below is the short version.

THE RULES
1. It is class, never className. These are HTML files.
2. Never add JavaScript. Interactivity is CSS-only — hidden radios and checkboxes driving peer-checked:, group-has-[...]: and :has(). Call get_interactivity_pattern instead of reaching for a script.
3. ${impure} of the ${total} components use theme tokens that resolve only inside the docs app and render invisible anywhere else. Run check_portability on markup before pasting it into another project.
4. Every colour utility needs its dark: partner.
5. Re-namespace id / for / name if you paste a component twice — CSS-only state is keyed on them, and named peers are never used, so a hidden input must stay the immediate previous sibling.
6. Keep any <style> block; it carries keyframes or a scoped palette that utilities cannot express.

THE LOOK, IN ONE PARAGRAPH
Light side uses named grays, dark side switches to alpha-on-white: bg-white/dark:bg-neutral-950, border-gray-200/dark:border-white/10, text-gray-900/dark:text-gray-100. Primary action is bg-gray-900 text-white / dark:bg-white dark:text-neutral-900. Sizes are arbitrary values (text-[13px], text-[13.5px]), not text-sm. Radius rhythm is control rounded-lg, container rounded-xl, pill rounded-full. Three palettes ship — Tailwind-literal, Fluent (--fluent-brand #0f6cbd/#479ef5) and Astryx (--bg-app #f4f4f6/#141414) — and must not be mixed in one screen.

THE CATEGORIES
- apps (${counts.apps}) — mobile screens, fixed 390×844. Radii one step larger (rounded-2xl/3xl), cards borderless, separated by elevation and divide-y. 100% literal Tailwind, so the safest to copy.
- sites (${counts.sites}) — pages at 1280×800 and sections at 1280×auto. Section frame px-6 py-24, display type to text-[56px], cards rounded-2xl.
- agent (${counts.agent}) — chat surfaces on a 640×auto canvas, always mx-auto w-full max-w-2xl. Bubble tail rounded-2xl rounded-br-md. shadow-sm dark:shadow-none.
- ui (${counts.ui}) — primitives on 640×auto. Controls rounded-lg, containers rounded-xl.
- images (${counts.images}) — photography; each carries a structured recreation prompt.

WHERE TO START
recommend_components when you know the goal, search_components when you know the keyword, get_categories to browse. Then get_component_markup to take the HTML.`
}

// ---------------------------------------------------------------------------
// public/llms.txt
// ---------------------------------------------------------------------------
function buildLlmsTxt(items) {
  const counts = Object.fromEntries(
    Object.keys(CATEGORIES).map((id) => [id, inCategory(items, id).length]),
  )
  const list = (id) =>
    inCategory(items, id)
      .map((item) => `- [${item.name}](${PAGES_URL}/r/${item.name}.json): ${item.description}`)
      .join('\n')

  return `# HTML Library

> ${items.length} copy-paste UI components written in plain HTML + Tailwind CSS.
> No React, no JavaScript, no dependencies. Every component is a self-contained
> fragment that works anywhere Tailwind runs.

Fetch any component with \`curl -s ${PAGES_URL}/r/<name>.json | jq -r '.files[0].content'\`.

## Agent skill

- [Full skill (single file)](${PAGES_URL}/skill.md): everything below plus the
  class-portability contract, CSS-only interactivity patterns and composition recipes.
- [Registry index](${PAGES_URL}/r/index.json): machine-readable list of every component.
- [Item schema](${PAGES_URL}/r/schema.json)

## Docs

- [Introduction](${PAGES_URL}/#/introduction)
- [Installation](${PAGES_URL}/#/installation)
- [Registry](${PAGES_URL}/#/registry)
- [Theming](${PAGES_URL}/#/theming)
- [Skills](${PAGES_URL}/#/skills)
- [Use cases](${PAGES_URL}/#/use-cases)

## Apps (${counts.apps})

${list('apps')}

## Sites (${counts.sites})

${list('sites')}

## Agent Elements (${counts.agent})

${list('agent')}

## UI Elements (${counts.ui})

${list('ui')}

## Optional

- [Images (${counts.images})](${PAGES_URL}/#/images): photography, each with a
  structured recreation prompt including exact framing geometry.
`
}

// ---------------------------------------------------------------------------
// public/r/skill.json
// ---------------------------------------------------------------------------
function buildSkillJson(items, version) {
  const impure = items.filter((item) => !item.portable)
  return {
    $schema: `${PAGES_URL}/r/schema.json`,
    name: 'html-library',
    version,
    kind: 'agent-skill',
    homepage: PAGES_URL,
    repository: REPO_URL,
    description:
      'Agent skill for the HTML Library registry — plain HTML + Tailwind components, no React, no JavaScript.',
    entry: `${PAGES_URL}/skill.md`,
    llmsTxt: `${PAGES_URL}/llms.txt`,
    registry: { index: `${PAGES_URL}/r/index.json`, raw: `${RAW_URL}/index.json` },
    files: [
      { path: 'SKILL.md', url: `${PAGES_URL}/skill.md` },
      ...['components', 'images', 'design-system', ...STATIC_REFS].map((name) => ({
        path: `references/${name}.md`,
        url: `${REPO_URL}/blob/main/skills/html-library/references/${name}.md`,
      })),
    ],
    stats: {
      components: items.length,
      byCategory: Object.fromEntries(
        Object.keys(CATEGORIES).map((id) => [id, inCategory(items, id).length]),
      ),
      portable: items.length - impure.length,
      needsTokenSubstitution: impure.length,
    },
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  const items = await readComponents()

  for (const name of STATIC_REFS) {
    if (!existsSync(path.join(REF_DIR, `${name}.md`))) {
      console.error(`Missing hand-authored reference: skills/html-library/references/${name}.md`)
      process.exit(1)
    }
  }

  const skillMd = buildSkillMd(items)
  const componentsMd = buildComponentsMd(items)
  const imagesMd = buildImagesMd(items)
  const designSystemMd = buildDesignSystemMd(items)
  const instructions = buildInstructions(items)

  const generated = { components: componentsMd, images: imagesMd, 'design-system': designSystemMd }

  // Bundle: SKILL.md + every reference, so one fetch gets the whole skill.
  const parts = [skillMd]
  for (const name of [...STATIC_REFS, 'design-system', 'components', 'images']) {
    const body = generated[name] ?? (await readFile(path.join(REF_DIR, `${name}.md`), 'utf8'))
    parts.push(`\n\n---\n\n<!-- references/${name}.md -->\n\n${body.trim()}\n`)
  }
  const bundle = parts.join('')

  const files = new Map([
    [path.join(SKILL_DIR, 'SKILL.md'), skillMd],
    [path.join(SKILL_DIR, 'INSTRUCTIONS.md'), instructions],
    [path.join(REF_DIR, 'components.md'), componentsMd],
    [path.join(REF_DIR, 'images.md'), imagesMd],
    [path.join(REF_DIR, 'design-system.md'), designSystemMd],
    [path.join(PUBLIC_DIR, 'skill.md'), bundle],
    [path.join(PUBLIC_DIR, 'llms.txt'), buildLlmsTxt(items)],
    [
      path.join(PUBLIC_DIR, 'skill.json'),
      JSON.stringify(buildSkillJson(items, pkg.version), null, 2) + '\n',
    ],
  ])

  if (checkOnly) {
    const stale = []
    for (const [target, content] of files) {
      const actual = existsSync(target) ? await readFile(target, 'utf8') : null
      if (actual !== content) stale.push(path.relative(root, target).replace(/\\/g, '/'))
    }
    if (stale.length > 0) {
      console.error('Skill output is stale. Run `npm run build:skill` and commit:\n')
      for (const name of stale) console.error(`  x ${name}`)
      process.exit(1)
    }
    console.log(`Skill is up to date — ${items.length} components.`)
    return
  }

  for (const [target, content] of files) {
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, content)
  }

  const impure = items.filter((item) => !item.portable).length
  console.log(
    `Wrote skill — ${items.length} components indexed, ` +
      `${items.length - impure} portable, ${impure} need token substitution.`,
  )
  console.log(`  skills/html-library/SKILL.md  (${(skillMd.length / 1024).toFixed(1)} kB)`)
  console.log(`  public/skill.md               (${(bundle.length / 1024).toFixed(1)} kB bundle)`)
  console.log('  public/llms.txt, public/skill.json')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

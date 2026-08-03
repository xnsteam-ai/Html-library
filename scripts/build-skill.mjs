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
  return items.map(({ meta, appTokens, portable, hasStyle }) => ({
    ...meta,
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
      ...['components', 'images', ...STATIC_REFS].map((name) => ({
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

  // Bundle: SKILL.md + every reference, so one fetch gets the whole skill.
  const parts = [skillMd]
  for (const name of [...STATIC_REFS, 'components', 'images']) {
    const body =
      name === 'components' ? componentsMd
      : name === 'images' ? imagesMd
      : await readFile(path.join(REF_DIR, `${name}.md`), 'utf8')
    parts.push(`\n\n---\n\n<!-- references/${name}.md -->\n\n${body.trim()}\n`)
  }
  const bundle = parts.join('')

  const files = new Map([
    [path.join(SKILL_DIR, 'SKILL.md'), skillMd],
    [path.join(REF_DIR, 'components.md'), componentsMd],
    [path.join(REF_DIR, 'images.md'), imagesMd],
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

#!/usr/bin/env node
/**
 * Vendors the shared registry logic and recipe data into src/vendor/.
 *
 * The server needs both in each of its modes, including remote mode where
 * there is no repo checkout to read them from — so they have to ship inside
 * the package. They cannot be imported across the workspace boundary either,
 * because TypeScript refuses to emit files from outside `rootDir`.
 *
 * Copying keeps one source of truth (the copies are never hand-edited) and the
 * --check mode makes divergence a build failure rather than a silent bug, the
 * same way build-registry.mjs and build-skill.mjs guard their own output.
 *
 *   node scripts/sync-core.mjs           copy
 *   node scripts/sync-core.mjs --check   fail if a copy is stale
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(here, '../../..')
const LIB = path.join(REPO, 'scripts/lib')
const SKILL = path.join(REPO, 'skills/html-library')
const VENDOR = path.resolve(here, '../src/vendor')
// tsc does not emit these (allowJs is off so the .d.mts wins for typing), so
// the runtime copies are placed here directly.
const DIST_VENDOR = path.resolve(here, '../dist/vendor')

const BANNER =
  '// GENERATED — do not edit. Copied from scripts/lib/registry-data.mjs by\n' +
  '// packages/mcp-server/scripts/sync-core.mjs. Edit the original and re-run\n' +
  '// `npm run build:mcp`.\n\n'

// JSON has no comment syntax, so it is copied byte-for-byte; its own
// `_comment` field carries the same warning.
//
// The skill markdown is vendored too, so an agent that installed the package
// over npx gets the whole guide offline rather than only what the website
// serves. Markdown takes an HTML-comment banner; note the banner is part of
// what --check compares, so it must be applied identically in both branches.
const MD_BANNER =
  '<!-- GENERATED — do not edit. Copied from skills/html-library/ by\n' +
  '     packages/mcp-server/scripts/sync-core.mjs. Edit the original and\n' +
  '     re-run `npm run build:mcp`. -->\n\n'

const SKILL_DOCS = [
  'INSTRUCTIONS.md',
  'SKILL.md',
  'references/design-system.md',
  'references/conventions.md',
  'references/recipes.md',
  'references/troubleshooting.md',
  'references/registry-api.md',
  'references/components.md',
  'references/images.md',
]

const FILES = [
  { root: LIB, from: 'registry-data.mjs', to: 'registry-data.mjs', banner: BANNER },
  { root: LIB, from: 'recipes.json', to: 'recipes.json', banner: '' },
  ...SKILL_DOCS.map((name) => ({
    root: SKILL,
    from: name,
    to: `skill/${name}`,
    banner: MD_BANNER,
  })),
]

const checkOnly = process.argv.includes('--check')
const stale = []

if (!checkOnly) {
  await mkdir(VENDOR, { recursive: true })
  await mkdir(DIST_VENDOR, { recursive: true })
}

for (const file of FILES) {
  const source = path.join(file.root, file.from)
  const target = path.join(VENDOR, file.to)

  if (!existsSync(source)) {
    console.error(`sync-core: cannot find ${source}`)
    if (file.root === SKILL) {
      console.error('Run `npm run build:skill` first — the skill docs are generated.')
    }
    process.exit(1)
  }

  const expected = file.banner + (await readFile(source, 'utf8'))

  if (checkOnly) {
    // Only the committed copy is checked; dist/ is build output.
    const actual = existsSync(target) ? await readFile(target, 'utf8') : null
    if (actual !== expected) stale.push(`src/vendor/${file.to}`)
  } else {
    const distTarget = path.join(DIST_VENDOR, file.to)
    // `to` may be nested (skill/references/…), which the top-level mkdir above
    // does not cover.
    await mkdir(path.dirname(target), { recursive: true })
    await mkdir(path.dirname(distTarget), { recursive: true })
    await writeFile(target, expected)
    await writeFile(distTarget, expected)
  }
}

if (checkOnly) {
  if (stale.length > 0) {
    console.error('Vendored core is stale. Run `npm run build:mcp` and commit:\n')
    for (const name of stale) console.error(`  x packages/mcp-server/${name}`)
    process.exit(1)
  }
  console.log(`Vendored core is up to date — ${FILES.length} files.`)
} else {
  console.log(`Synced ${FILES.length} files into src/vendor/ from scripts/lib/.`)
}

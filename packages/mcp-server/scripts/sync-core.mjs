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
const LIB = path.resolve(here, '../../../scripts/lib')
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
const FILES = [
  { from: 'registry-data.mjs', to: 'registry-data.mjs', banner: BANNER },
  { from: 'recipes.json', to: 'recipes.json', banner: '' },
]

const checkOnly = process.argv.includes('--check')
const stale = []

if (!checkOnly) {
  await mkdir(VENDOR, { recursive: true })
  await mkdir(DIST_VENDOR, { recursive: true })
}

for (const file of FILES) {
  const source = path.join(LIB, file.from)
  const target = path.join(VENDOR, file.to)

  if (!existsSync(source)) {
    console.error(`sync-core: cannot find ${source}`)
    process.exit(1)
  }

  const expected = file.banner + (await readFile(source, 'utf8'))

  if (checkOnly) {
    // Only the committed copy is checked; dist/ is build output.
    const actual = existsSync(target) ? await readFile(target, 'utf8') : null
    if (actual !== expected) stale.push(`src/vendor/${file.to}`)
  } else {
    await writeFile(target, expected)
    await writeFile(path.join(DIST_VENDOR, file.to), expected)
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

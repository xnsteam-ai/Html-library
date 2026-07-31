#!/usr/bin/env node
/**
 * Builds the GitHub-hosted registry.
 *
 * Source of truth:  registry/<category>/<name>/{component.html,meta.json}
 * Generated output: public/r/<name>.json  and  public/r/index.json
 *
 * The generated files are committed so that raw.githubusercontent.com works as
 * a zero-setup registry host alongside GitHub Pages.
 *
 *   node scripts/build-registry.mjs           write the output
 *   node scripts/build-registry.mjs --check    fail if the output is stale
 */

import { readFile, readdir, writeFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY_DIR = path.join(root, 'registry')
const OUT_DIR = path.join(root, 'public', 'r')

const REPO = 'xnsteam-ai/Html-library'
const BRANCH = 'main'
const PAGES_URL = 'https://xnsteam-ai.github.io/Html-library'
const RAW_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/public/r`

const CATEGORIES = {
  apps: { title: 'Apps & Sites', order: 1 },
  agent: { title: 'Agent Elements', order: 2 },
  ui: { title: 'UI Elements', order: 3 },
}

const SURFACES = ['app', 'site']

const checkOnly = process.argv.includes('--check')
const errors = []
const warnings = []

function fail(item, message) {
  errors.push(`${item}: ${message}`)
}

/** Registry files must be self-contained HTML + Tailwind. */
function validateHtml(id, html) {
  if (/<script[\s>]/i.test(html)) {
    fail(id, 'contains a <script> tag — registry components must not ship JavaScript')
  }
  if (/\bclassName=/.test(html)) {
    fail(id, 'uses className — registry components are plain HTML, not JSX')
  }
  if (/<(link|iframe)[\s>]/i.test(html)) {
    fail(id, 'references an external document (<link>/<iframe>)')
  }
  if (/@import\s/i.test(html)) {
    fail(id, 'uses @import — styles must be self-contained')
  }
  const external = html.match(/\b(?:src|href)\s*=\s*"(https?:)?\/\/[^"]*"/gi) ?? []
  const remoteImages = external.filter((ref) => !/^href="#/.test(ref))
  if (remoteImages.length > 0) {
    warnings.push(`${id}: references remote assets (${remoteImages.length}) — prefer inline SVG`)
  }
  if (/<style[\s>]/i.test(html)) {
    warnings.push(`${id}: ships a scoped <style> block (allowed for keyframes only)`)
  }
}

function validateMeta(id, meta) {
  for (const field of ['name', 'title', 'description', 'category']) {
    if (typeof meta[field] !== 'string' || meta[field].length === 0) {
      fail(id, `meta.json is missing "${field}"`)
    }
  }
  if (!CATEGORIES[meta.category]) {
    fail(id, `unknown category "${meta.category}" (expected: ${Object.keys(CATEGORIES).join(', ')})`)
  }
  if (meta.tags && !Array.isArray(meta.tags)) {
    fail(id, '"tags" must be an array')
  }
  // Screens drive the gallery's Apps/Sites tabs, so the surface is required there.
  if (meta.category === 'apps' && !SURFACES.includes(meta.surface)) {
    fail(id, `"surface" must be one of ${SURFACES.join(', ')} for Apps & Sites items`)
  }
  if (meta.surface && !SURFACES.includes(meta.surface)) {
    fail(id, `unknown surface "${meta.surface}"`)
  }
}

async function readComponents() {
  const items = []
  const seen = new Map()

  for (const category of await readdir(REGISTRY_DIR)) {
    const categoryDir = path.join(REGISTRY_DIR, category)
    const entries = await readdir(categoryDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const dir = path.join(categoryDir, entry.name)
      const id = `registry/${category}/${entry.name}`
      const htmlPath = path.join(dir, 'component.html')
      const metaPath = path.join(dir, 'meta.json')

      if (!existsSync(htmlPath)) {
        fail(id, 'missing component.html')
        continue
      }
      if (!existsSync(metaPath)) {
        fail(id, 'missing meta.json')
        continue
      }

      const html = await readFile(htmlPath, 'utf8')
      let meta
      try {
        meta = JSON.parse(await readFile(metaPath, 'utf8'))
      } catch (error) {
        fail(id, `meta.json is not valid JSON — ${error.message}`)
        continue
      }

      validateMeta(id, meta)
      validateHtml(id, html)

      if (meta.name !== entry.name) {
        fail(id, `meta.json name "${meta.name}" does not match the folder name "${entry.name}"`)
      }
      if (meta.category !== category) {
        fail(id, `meta.json category "${meta.category}" does not match the folder "${category}"`)
      }
      if (seen.has(meta.name)) {
        fail(id, `duplicate component name — also defined in ${seen.get(meta.name)}`)
      }
      seen.set(meta.name, id)

      items.push({ meta, html: html.trimEnd() + '\n' })
    }
  }

  items.sort((a, b) => {
    const byCategory =
      (CATEGORIES[a.meta.category]?.order ?? 99) - (CATEGORIES[b.meta.category]?.order ?? 99)
    if (byCategory !== 0) return byCategory
    const byOrder = (a.meta.order ?? 99) - (b.meta.order ?? 99)
    return byOrder !== 0 ? byOrder : a.meta.name.localeCompare(b.meta.name)
  })

  return items
}

function toRegistryItem({ meta, html }, version) {
  return {
    $schema: `${PAGES_URL}/r/schema.json`,
    name: meta.name,
    title: meta.title,
    description: meta.description,
    category: meta.category,
    type: 'html',
    version,
    tailwind: '^4.0.0',
    tags: meta.tags ?? [],
    // Only whole-screen items carry a surface; parts omit it entirely.
    ...(meta.surface ? { surface: meta.surface } : {}),
    files: [{ path: `${meta.name}.html`, type: 'html', content: html }],
  }
}

/** Published alongside the items so the registry is self-describing. */
function schema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${PAGES_URL}/r/schema.json`,
    title: 'html-library registry item',
    type: 'object',
    required: ['name', 'title', 'description', 'category', 'type', 'files'],
    properties: {
      name: { type: 'string', description: 'Unique component id, matches the file name.' },
      title: { type: 'string' },
      description: { type: 'string' },
      category: { type: 'string', enum: Object.keys(CATEGORIES) },
      surface: {
        type: 'string',
        enum: SURFACES,
        description: 'Whole-screen items only: the device the screen was drawn for.',
      },
      type: { const: 'html' },
      version: { type: 'string' },
      tailwind: { type: 'string', description: 'Tailwind version range the markup targets.' },
      tags: { type: 'array', items: { type: 'string' } },
      files: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['path', 'content'],
          properties: {
            path: { type: 'string' },
            type: { const: 'html' },
            content: { type: 'string', description: 'The complete markup — this is what you copy.' },
          },
        },
      },
    },
  }
}

async function main() {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
  const items = await readComponents()

  if (errors.length > 0) {
    console.error('Registry validation failed:\n')
    for (const error of errors) console.error(`  ✗ ${error}`)
    process.exit(1)
  }

  const files = new Map()
  files.set('schema.json', schema())

  for (const item of items) {
    files.set(`${item.meta.name}.json`, toRegistryItem(item, pkg.version))
  }

  files.set('index.json', {
    $schema: `${PAGES_URL}/r/schema.json`,
    name: 'html-library',
    version: pkg.version,
    homepage: PAGES_URL,
    repository: `https://github.com/${REPO}`,
    baseUrl: `${PAGES_URL}/r`,
    rawBaseUrl: RAW_URL,
    generatedFrom: 'registry/',
    categories: Object.entries(CATEGORIES).map(([name, value]) => ({
      name,
      title: value.title,
      count: items.filter((item) => item.meta.category === name).length,
    })),
    items: items.map(({ meta }) => ({
      name: meta.name,
      title: meta.title,
      description: meta.description,
      category: meta.category,
      tags: meta.tags ?? [],
      url: `${PAGES_URL}/r/${meta.name}.json`,
      rawUrl: `${RAW_URL}/${meta.name}.json`,
    })),
  })

  if (checkOnly) {
    const stale = []
    for (const [name, content] of files) {
      const target = path.join(OUT_DIR, name)
      const expected = JSON.stringify(content, null, 2) + '\n'
      const actual = existsSync(target) ? await readFile(target, 'utf8') : null
      if (actual !== expected) stale.push(name)
    }
    const onDisk = existsSync(OUT_DIR) ? await readdir(OUT_DIR) : []
    for (const name of onDisk) {
      if (name.endsWith('.json') && !files.has(name)) stale.push(`${name} (orphaned)`)
    }
    if (stale.length > 0) {
      console.error('Registry output is stale. Run `npm run build:registry` and commit:\n')
      for (const name of stale) console.error(`  ✗ public/r/${name}`)
      process.exit(1)
    }
    console.log(`Registry is up to date — ${items.length} components.`)
    return
  }

  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })
  for (const [name, content] of files) {
    await writeFile(path.join(OUT_DIR, name), JSON.stringify(content, null, 2) + '\n')
  }

  for (const warning of warnings) console.log(`  ! ${warning}`)
  const byCategory = Object.keys(CATEGORIES)
    .map((name) => `${items.filter((i) => i.meta.category === name).length} ${name}`)
    .join(', ')
  console.log(`Wrote ${files.size} files to public/r — ${items.length} components (${byCategory}).`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

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
 * Reading and validating the registry lives in ./lib/registry-data.mjs, shared
 * with build-skill.mjs and the MCP server. Only the output shapes are local.
 *
 *   node scripts/build-registry.mjs           write the output
 *   node scripts/build-registry.mjs --check    fail if the output is stale
 */

import { readFile, readdir, writeFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CATEGORIES,
  PAGES_URL,
  RAW_URL,
  REPO,
  SURFACES,
  readRegistryItems,
} from './lib/registry-data.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY_DIR = path.join(root, 'registry')
const OUT_DIR = path.join(root, 'public', 'r')

const checkOnly = process.argv.includes('--check')

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
    // Images ship their recreation brief so the JSON is as useful as the page.
    ...(meta.prompt ? { prompt: meta.prompt } : {}),
    // …and the derived facets, so a consumer can group or filter images the
    // same way the gallery's recommendations do.
    ...(meta.facets ? { facets: meta.facets } : {}),
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
  const { items, errors, warnings } = await readRegistryItems(REGISTRY_DIR, { validate: true })

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

/**
 * The registry, read once and shared.
 *
 * Three consumers depend on this module, and the reason it exists is that two
 * of them used to carry their own copy of the same logic:
 *
 *   scripts/build-registry.mjs   validation + public/r/*.json
 *   scripts/build-skill.mjs      SKILL.md, llms.txt, skill.json
 *   packages/mcp-server          the MCP tools
 *
 * The portability rules in particular (APP_TOKEN_RE, SUBSTITUTIONS) are the
 * kind of thing that drifts silently: if the MCP server's idea of an app-only
 * token ever disagreed with the skill's, `check_portability` would hand out
 * confidently wrong replacements with nothing in CI to catch it. One
 * definition, imported everywhere, makes that impossible.
 */

import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

export const REPO = 'xnsteam-ai/Html-library'
export const BRANCH = 'main'
export const PAGES_URL = 'https://xnsteam-ai.github.io/Html-library'
export const REPO_URL = `https://github.com/${REPO}`
export const RAW_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/public/r`

export const CATEGORIES = {
  images: { title: 'Images', order: 1, blurb: 'Ready-to-paste photography served from a CDN.' },
  apps: { title: 'Apps', order: 2, blurb: 'Complete mobile app screens, drawn at 390x844.' },
  sites: { title: 'Sites', order: 3, blurb: 'Website pages and the marketing sections they are built from.' },
  agent: { title: 'Agent Elements', order: 4, blurb: 'Chat surfaces, composers and tool-call cards.' },
  ui: { title: 'UI Elements', order: 5, blurb: 'General-purpose primitives that pair with the agent set.' },
}

// Categories whose items are whole screens or page sections, and so must
// declare how they are drawn.
export const FRAMED_CATEGORIES = ['apps', 'sites']
export const SURFACES = ['app', 'site', 'section']

// Classes that only resolve inside the docs app's own @theme block. Anything
// using one of these renders invisible (or unstyled) in another project.
export const APP_TOKENS = [
  'foreground',
  'muted-foreground',
  'accent-foreground',
  'background',
  'muted',
  'subtle',
  'border',
  'primary',
  'primary-foreground',
]

export const APP_TOKEN_RE = new RegExp(
  `(?:^|[\\s"'])(?:[a-z-]+:)*(?:text|bg|border|ring|fill|stroke|divide|placeholder|from|to|via|shadow|outline|accent|caret|decoration)-(${APP_TOKENS.join('|')})(?![a-z0-9-])`,
  'g',
)

/**
 * Exact 1:1 replacements for the app-only tokens, taken from the real values
 * in src/styles/theme.css. Order matters — build-skill.mjs renders this map
 * straight into the substitution table in SKILL.md.
 */
export const SUBSTITUTIONS = {
  'text-muted-foreground': 'text-neutral-500 dark:text-neutral-400',
  'text-foreground': 'text-neutral-900 dark:text-neutral-100',
  'text-accent-foreground': 'text-neutral-700 dark:text-neutral-300',
  'bg-background': 'bg-white dark:bg-neutral-950',
  'bg-muted': 'bg-neutral-100 dark:bg-neutral-900',
  'bg-subtle': 'bg-neutral-200 dark:bg-neutral-800',
  'bg-primary': 'bg-neutral-900 dark:bg-neutral-100',
  'text-primary-foreground': 'text-white dark:text-neutral-900',
  'border-border': 'border-neutral-200 dark:border-white/10',
}

/**
 * Find the app-only tokens in a fragment of markup. Pure — takes a string, so
 * it serves both a file on disk and a snippet an agent pasted into a tool.
 */
export function scanPortability(html) {
  const tokens = new Set()
  APP_TOKEN_RE.lastIndex = 0
  let match
  while ((match = APP_TOKEN_RE.exec(html))) tokens.add(match[1])
  return { portable: tokens.size === 0, appTokens: [...tokens].sort() }
}

/** Registry files must be self-contained HTML + Tailwind. */
export function validateHtml(id, html, { fail, warn }) {
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
    warn(id, `references remote assets (${remoteImages.length}) — prefer inline SVG`)
  }
  if (/<style[\s>]/i.test(html)) {
    warn(id, 'ships a scoped <style> block (allowed for keyframes only)')
  }

  // Interactivity is CSS-driven, which only works when ids are unique on the
  // page — several screens render side by side in the gallery.
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
  const duplicates = ids.filter((value, index) => ids.indexOf(value) !== index)
  if (duplicates.length > 0) {
    fail(id, `duplicate id attribute(s): ${[...new Set(duplicates)].join(', ')}`)
  }

  // A `for`/`id` mismatch silently breaks a control that looks fine.
  for (const [, target] of html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)) {
    if (!ids.includes(target)) {
      fail(id, `<label for="${target}"> has no matching id in the same file`)
    }
  }
}

export function validateMeta(id, meta, { fail }) {
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
  // Framed items decide their own chrome, so the surface is required there.
  if (FRAMED_CATEGORIES.includes(meta.category) && !SURFACES.includes(meta.surface)) {
    fail(id, `"surface" must be one of ${SURFACES.join(', ')} for ${meta.category} items`)
  }
  // A phone frame in the Sites gallery (or vice versa) is always a mistake.
  if (meta.category === 'apps' && meta.surface && meta.surface !== 'app') {
    fail(id, `apps items must use surface "app", not "${meta.surface}"`)
  }
  if (meta.category === 'sites' && meta.surface === 'app') {
    fail(id, 'sites items must use surface "site" or "section", not "app"')
  }
  if (meta.surface && !SURFACES.includes(meta.surface)) {
    fail(id, `unknown surface "${meta.surface}"`)
  }
}

/**
 * Read every component from `registry/`, sorted the way both generators and the
 * docs app expect: category order, then the item's own `order`, then name.
 *
 * `html` is normalised the way the published JSON stores it, so
 * `items[n].html` is byte-identical to `files[0].content` downstream.
 *
 * @param {string} registryDir  absolute path to `registry/`
 * @param {{ validate?: boolean }} [options]  `validate` turns a malformed item
 *   into a recorded error instead of a silent skip — the build wants that, a
 *   read-only consumer like the MCP server does not.
 * @returns {Promise<{
 *   items: { meta: object, html: string, appTokens: string[], portable: boolean, hasStyle: boolean }[],
 *   errors: string[],
 *   warnings: string[],
 * }>}
 */
export async function readRegistryItems(registryDir, { validate = false } = {}) {
  const items = []
  const errors = []
  const warnings = []
  const seen = new Map()

  const fail = (id, message) => errors.push(`${id}: ${message}`)
  const warn = (id, message) => warnings.push(`${id}: ${message}`)

  for (const category of await readdir(registryDir)) {
    const categoryDir = path.join(registryDir, category)
    const entries = await readdir(categoryDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const dir = path.join(categoryDir, entry.name)
      const id = `registry/${category}/${entry.name}`
      const htmlPath = path.join(dir, 'component.html')
      const metaPath = path.join(dir, 'meta.json')

      if (!existsSync(htmlPath)) {
        if (validate) fail(id, 'missing component.html')
        continue
      }
      if (!existsSync(metaPath)) {
        if (validate) fail(id, 'missing meta.json')
        continue
      }

      const raw = await readFile(htmlPath, 'utf8')
      let meta
      try {
        meta = JSON.parse(await readFile(metaPath, 'utf8'))
      } catch (error) {
        if (validate) fail(id, `meta.json is not valid JSON — ${error.message}`)
        continue
      }

      if (validate) {
        validateMeta(id, meta, { fail })
        validateHtml(id, raw, { fail, warn })

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
      }

      const html = raw.trimEnd() + '\n'
      const { portable, appTokens } = scanPortability(html)
      items.push({ meta, html, appTokens, portable, hasStyle: /<style[\s>]/i.test(html) })
    }
  }

  items.sort((a, b) => {
    const byCategory =
      (CATEGORIES[a.meta.category]?.order ?? 99) - (CATEGORIES[b.meta.category]?.order ?? 99)
    if (byCategory !== 0) return byCategory
    const byOrder = (a.meta.order ?? 99) - (b.meta.order ?? 99)
    return byOrder !== 0 ? byOrder : a.meta.name.localeCompare(b.meta.name)
  })

  return { items, errors, warnings }
}

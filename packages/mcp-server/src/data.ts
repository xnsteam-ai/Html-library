import {
  CATEGORIES,
  readRegistryItems,
  scanPortability,
  type CategoryId,
  type ComponentMeta,
  type Surface,
} from './vendor/registry-data.mjs'
import type { Source } from './source.js'

/**
 * One component, normalised so every tool handler sees the same shape whether
 * it came off disk or off the CDN.
 */
export interface Component {
  name: string
  title: string
  description: string
  category: CategoryId
  surface?: Surface
  tags: string[]
  html: string
  portable: boolean
  appTokens: string[]
  hasStyle: boolean
  prompt?: Record<string, Record<string, string>>
}

/** The published registry item shape, reproduced for `get_component`. */
export interface RegistryItemJson {
  name: string
  title: string
  description: string
  category: string
  type: 'html'
  tailwind: string
  tags: string[]
  surface?: string
  prompt?: Record<string, Record<string, string>>
  files: { path: string; type: 'html'; content: string }[]
}

interface RemoteIndexItem {
  name: string
  title: string
  description: string
  category: CategoryId
  tags?: string[]
}

function toComponent(meta: ComponentMeta, html: string, extra?: Partial<Component>): Component {
  const { portable, appTokens } = scanPortability(html)
  return {
    name: meta.name,
    title: meta.title,
    description: meta.description,
    category: meta.category,
    ...(meta.surface ? { surface: meta.surface } : {}),
    tags: meta.tags ?? [],
    html,
    portable,
    appTokens,
    hasStyle: /<style[\s>]/i.test(html),
    ...(meta.prompt ? { prompt: meta.prompt } : {}),
    ...extra,
  }
}

/**
 * Source-agnostic access to the registry. Local mode loads everything once;
 * remote mode loads the index once and fetches item markup lazily, since the
 * index alone answers every discovery query.
 */
export class RegistryData {
  private loaded: Promise<Map<string, Component>> | null = null
  private readonly partial = new Map<string, RemoteIndexItem>()
  private readonly fetched = new Map<string, Component>()

  constructor(private readonly source: Source) {}

  /** Retry the CDN through raw.githubusercontent before giving up. */
  private async fetchJson(pathname: string): Promise<unknown> {
    if (this.source.mode !== 'remote') throw new Error('fetchJson called in local mode')
    const urls = [`${this.source.baseUrl}/${pathname}`, `${this.source.rawBaseUrl}/${pathname}`]
    let lastError: unknown
    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          lastError = new Error(`${response.status} ${response.statusText} for ${url}`)
          continue
        }
        return await response.json()
      } catch (error) {
        lastError = error
      }
    }
    throw new Error(
      `Could not fetch ${pathname} from the registry. Tried ${urls.join(' and ')}. ` +
        `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    )
  }

  private async load(): Promise<Map<string, Component>> {
    if (!this.loaded) {
      this.loaded = (async () => {
        const map = new Map<string, Component>()
        if (this.source.mode === 'local') {
          const { items } = await readRegistryItems(this.source.registryDir)
          for (const item of items) {
            map.set(
              item.meta.name,
              toComponent(item.meta, item.html, {
                portable: item.portable,
                appTokens: item.appTokens,
                hasStyle: item.hasStyle,
              }),
            )
          }
        } else {
          const index = (await this.fetchJson('index.json')) as { items?: RemoteIndexItem[] }
          for (const item of index.items ?? []) this.partial.set(item.name, item)
        }
        return map
      })()
    }
    return this.loaded
  }

  /** True when full markup for every component is already in memory. */
  private get isLocal(): boolean {
    return this.source.mode === 'local'
  }

  /**
   * Every component's metadata. In remote mode this is index data only, so
   * `html` is empty — callers that need markup must go through `get()`.
   */
  async summaries(): Promise<Omit<Component, 'html' | 'appTokens' | 'hasStyle' | 'portable'>[]> {
    const full = await this.load()
    if (this.isLocal) {
      return [...full.values()].map((c) => ({
        name: c.name,
        title: c.title,
        description: c.description,
        category: c.category,
        ...(c.surface ? { surface: c.surface } : {}),
        tags: c.tags,
        ...(c.prompt ? { prompt: c.prompt } : {}),
      }))
    }
    return [...this.partial.values()].map((c) => ({
      name: c.name,
      title: c.title,
      description: c.description,
      category: c.category,
      tags: c.tags ?? [],
    }))
  }

  /** Full record for one component, fetching markup on demand in remote mode. */
  async get(name: string): Promise<Component | null> {
    const full = await this.load()
    if (this.isLocal) return full.get(name) ?? null

    const cached = this.fetched.get(name)
    if (cached) return cached
    if (!this.partial.has(name)) return null

    const item = (await this.fetchJson(`${name}.json`)) as RegistryItemJson
    const html = item.files?.[0]?.content ?? ''
    const component = toComponent(
      {
        name: item.name,
        title: item.title,
        description: item.description,
        category: item.category as CategoryId,
        ...(item.surface ? { surface: item.surface as Surface } : {}),
        tags: item.tags ?? [],
        ...(item.prompt ? { prompt: item.prompt } : {}),
      },
      html,
    )
    this.fetched.set(name, component)
    return component
  }

  async has(name: string): Promise<boolean> {
    const full = await this.load()
    return this.isLocal ? full.has(name) : this.partial.has(name)
  }

  async names(): Promise<string[]> {
    return (await this.summaries()).map((c) => c.name)
  }

  async categoryCounts(): Promise<{ name: CategoryId; title: string; blurb: string; count: number }[]> {
    const all = await this.summaries()
    return (Object.keys(CATEGORIES) as CategoryId[]).map((id) => ({
      name: id,
      title: CATEGORIES[id].title,
      blurb: CATEGORIES[id].blurb,
      count: all.filter((c) => c.category === id).length,
    }))
  }
}

/** The published item shape, rebuilt from a Component for `get_component`. */
export function toRegistryItemJson(component: Component): RegistryItemJson {
  return {
    name: component.name,
    title: component.title,
    description: component.description,
    category: component.category,
    type: 'html',
    tailwind: '^4.0.0',
    tags: component.tags,
    ...(component.surface ? { surface: component.surface } : {}),
    ...(component.prompt ? { prompt: component.prompt } : {}),
    files: [{ path: `${component.name}.html`, type: 'html', content: component.html }],
  }
}

/** Cheap ranked match over name/title/description/tags — 191 items needs no index. */
export function scoreMatch(haystack: Component | { name: string; title: string; description: string; tags: string[] }, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const name = haystack.name.toLowerCase()
  const title = haystack.title.toLowerCase()
  const description = haystack.description.toLowerCase()
  const tags = haystack.tags.map((t) => t.toLowerCase())

  if (name === q) return 1
  let score = 0
  if (name.includes(q)) score = Math.max(score, 0.9)
  if (tags.includes(q)) score = Math.max(score, 0.85)
  if (title.toLowerCase().includes(q)) score = Math.max(score, 0.7)
  if (tags.some((t) => t.includes(q))) score = Math.max(score, 0.6)
  if (description.includes(q)) score = Math.max(score, 0.5)

  // Fall back to per-word overlap so "chat input" still finds "input-bar".
  if (score === 0) {
    const words = q.split(/\s+/).filter(Boolean)
    const hay = `${name} ${title} ${description} ${tags.join(' ')}`
    const hits = words.filter((w) => hay.includes(w)).length
    if (hits > 0) score = (hits / words.length) * 0.4
  }
  return score
}

/** Levenshtein distance, bounded so a wildly different name exits early. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost)
      if (row[j] < best) best = row[j]
    }
    if (best > max) return max + 1
    prev = row
  }
  return prev[b.length]
}

/**
 * Suggestions for an unknown name, so a typo is recoverable in one step.
 * Substring matches rank first, then near-misses by edit distance — "swtich"
 * has to find "switch", which a substring check alone never will.
 */
export function closestNames(names: string[], query: string, limit = 5): string[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const tolerance = q.length <= 4 ? 1 : q.length <= 8 ? 2 : 3

  return names
    .map((name) => {
      const n = name.toLowerCase()
      if (n === q) return { name, score: 100 }
      if (n.includes(q) || q.includes(n)) return { name, score: 90 - Math.abs(n.length - q.length) }

      const distance = editDistance(q, n, tolerance)
      if (distance <= tolerance) return { name, score: 80 - distance * 10 }

      // Last resort: shared hyphen-separated parts, for "chat" → "agent-chat".
      const parts = [...new Set(q.split('-'))].filter(Boolean)
      const shared = parts.filter((part) => n.includes(part)).length
      return { name, score: shared > 0 ? shared * 10 : 0 }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((entry) => entry.name)
}

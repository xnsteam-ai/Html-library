export type CategoryId = 'agent' | 'ui'

export interface ComponentMeta {
  name: string
  title: string
  description: string
  category: CategoryId
  order?: number
  tags?: string[]
  previewBg?: 'plain' | 'muted' | 'app'
  previewHeight?: number
}

export interface RegistryItem extends ComponentMeta {
  html: string
}

export interface Category {
  id: CategoryId
  title: string
  blurb: string
  items: RegistryItem[]
}

export const CATEGORY_META: Record<CategoryId, { title: string; blurb: string; order: number }> = {
  agent: {
    title: 'Agent Elements',
    blurb: 'Chat surfaces, composers and tool-call cards for agent interfaces.',
    order: 1,
  },
  ui: {
    title: 'UI Elements',
    blurb: 'General-purpose primitives that pair with the agent set.',
    order: 2,
  },
}

// The docs app reads the registry sources directly, so the site can never drift
// from what `npm run build:registry` publishes to public/r.
const htmlFiles = import.meta.glob('/registry/**/component.html', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const metaFiles = import.meta.glob('/registry/**/meta.json', {
  eager: true,
  import: 'default',
}) as Record<string, ComponentMeta>

function dirOf(filePath: string) {
  return filePath.slice(0, filePath.lastIndexOf('/'))
}

export const components: RegistryItem[] = Object.entries(metaFiles)
  .map(([metaPath, meta]) => {
    const html = htmlFiles[`${dirOf(metaPath)}/component.html`]
    if (!html) throw new Error(`Missing component.html next to ${metaPath}`)
    return { ...meta, html: html.trimEnd() }
  })
  .sort((a, b) => {
    const byCategory = CATEGORY_META[a.category].order - CATEGORY_META[b.category].order
    if (byCategory !== 0) return byCategory
    const byOrder = (a.order ?? 99) - (b.order ?? 99)
    return byOrder !== 0 ? byOrder : a.title.localeCompare(b.title)
  })

export const categories: Category[] = (Object.keys(CATEGORY_META) as CategoryId[])
  .sort((a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order)
  .map((id) => ({
    id,
    title: CATEGORY_META[id].title,
    blurb: CATEGORY_META[id].blurb,
    items: components.filter((item) => item.category === id),
  }))

export function getComponent(name: string): RegistryItem | undefined {
  return components.find((item) => item.name === name)
}

export const REPO = 'xnsteam-ai/html-library'
export const REPO_URL = `https://github.com/${REPO}`
export const PAGES_URL = 'https://xnsteam-ai.github.io/html-library'
export const RAW_URL = `https://raw.githubusercontent.com/${REPO}/main/public/r`

export function registryUrl(name: string) {
  return `${PAGES_URL}/r/${name}.json`
}

export function rawRegistryUrl(name: string) {
  return `${RAW_URL}/${name}.json`
}

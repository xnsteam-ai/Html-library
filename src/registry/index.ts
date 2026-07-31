export type CategoryId = 'apps' | 'agent' | 'ui'

/** Whole-screen items declare which device they were drawn for. */
export type Surface = 'app' | 'site'

export interface ComponentMeta {
  name: string
  title: string
  description: string
  category: CategoryId
  order?: number
  tags?: string[]
  previewBg?: 'plain' | 'muted' | 'app'
  previewHeight?: number
  /** Screens only — drives the Apps/Sites tabs and which frame is drawn. */
  surface?: Surface
  /** Short line under the name in the gallery; falls back to `description`. */
  tagline?: string
  status?: 'new' | 'updated'
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
  apps: {
    title: 'Apps & Sites',
    blurb: 'Complete app screens and website pages, browsable as a gallery.',
    order: 1,
  },
  agent: {
    title: 'Agent Elements',
    blurb: 'Chat surfaces, composers and tool-call cards for agent interfaces.',
    order: 2,
  },
  ui: {
    title: 'UI Elements',
    blurb: 'General-purpose primitives that pair with the agent set.',
    order: 3,
  },
}

/** Pixel size each screen is authored at, before the gallery scales it down. */
export const FRAME_SIZE: Record<Surface, { width: number; height: number }> = {
  app: { width: 390, height: 844 },
  site: { width: 1280, height: 800 },
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

/** Screens in the Apps & Sites gallery, optionally narrowed to one surface. */
export function getScreens(surface?: Surface): RegistryItem[] {
  return components.filter(
    (item) => item.category === 'apps' && (!surface || item.surface === surface),
  )
}

export const REPO = 'xnsteam-ai/Html-library'
export const REPO_URL = `https://github.com/${REPO}`
export const PAGES_URL = 'https://xnsteam-ai.github.io/Html-library'
export const RAW_URL = `https://raw.githubusercontent.com/${REPO}/main/public/r`

export function registryUrl(name: string) {
  return `${PAGES_URL}/r/${name}.json`
}

export function rawRegistryUrl(name: string) {
  return `${RAW_URL}/${name}.json`
}

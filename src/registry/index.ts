export type CategoryId = 'images' | 'apps' | 'sites' | 'agent' | 'ui'

/**
 * Category decides where an item lives; surface decides how it draws. Keeping
 * them separate is what lets Apps and Sites be independent sections while a
 * site page and a page section still share the same browser chrome.
 */
export type Surface = 'app' | 'site' | 'section'

export interface ComponentMeta {
  name: string
  title: string
  description: string
  category: CategoryId
  order?: number
  tags?: string[]
  previewBg?: 'plain' | 'muted' | 'app'
  previewHeight?: number
  /** Apps & Sites only — which chrome is drawn and at what size. */
  surface?: Surface
  /** Short line under the name in the gallery; falls back to `description`. */
  tagline?: string
  status?: 'new' | 'updated'
  /** How to align the component in standalone preview (e.g. new tab). Defaults to center. */
  previewAlign?: 'top' | 'bottom' | 'center' | 'left' | 'right' | 'fit'
  /**
   * Images only — the structured recreation brief rendered by the Prompt tab.
   * Every field is optional: a still life has no `subject.age`, and anything
   * we cannot actually determine from the file (EXIF dates, a person's
   * descent) is left out rather than guessed at.
   */
  prompt?: ImagePromptSpec
}

/**
 * A per-image analysis, split along the axes an image model actually needs to
 * reproduce a shot. Deliberately all-optional — the renderer omits empty
 * fields instead of emitting "N/A" noise, so a prompt only ever claims what
 * was really observed.
 */
export interface ImagePromptSpec {
  subject?: {
    age?: string
    descent?: string
    physical?: string
    expression?: string
    clothing?: string
  }
  composition?: {
    shotType?: string
    angle?: string
    placement?: string
    distance?: string
    depthOfField?: string
    focus?: string
  }
  environment?: { setting?: string; background?: string; depth?: string }
  lighting?: { quality?: string; direction?: string; temperature?: string; shadows?: string }
  camera?: { lens?: string; quality?: string; artifacts?: string; aesthetic?: string }
  atmosphere?: { mood?: string; story?: string; micro?: string }
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

/** Categories with a `gallery` get a browsable grid of their own. */
export const CATEGORY_META: Record<
  CategoryId,
  { title: string; blurb: string; order: number; gallery?: boolean }
> = {
  images: {
    title: 'Images',
    blurb: 'Ready-to-paste photography, served from a CDN that resizes on the fly.',
    order: 1,
    gallery: true,
  },
  apps: {
    title: 'Apps',
    blurb: 'Complete mobile app screens, drawn at 390×844.',
    order: 2,
    gallery: true,
  },
  sites: {
    title: 'Sites',
    blurb: 'Website pages and the marketing sections they are built from.',
    order: 3,
    gallery: true,
  },
  agent: {
    title: 'Agent Elements',
    blurb: 'Chat surfaces, composers and tool-call cards for agent interfaces.',
    order: 4,
  },
  ui: {
    title: 'UI Elements',
    blurb: 'General-purpose primitives that pair with the agent set.',
    order: 5,
  },
}

/**
 * Authored width per surface, plus a fixed height where there is one. Sections
 * are authored at a fixed width but grow with their content, so their height is
 * measured at render time instead.
 */
export const FRAME_SIZE: Record<Surface, { width: number; height: number | 'auto' }> = {
  app: { width: 390, height: 844 },
  site: { width: 1280, height: 800 },
  section: { width: 1280, height: 'auto' },
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

/** Everything in one category, in sidebar order. */
export function getByCategory(category: CategoryId): RegistryItem[] {
  return components.filter((item) => item.category === category)
}

/** Categories that browse as a gallery rather than a flat list. */
export const GALLERY_CATEGORIES = (Object.keys(CATEGORY_META) as CategoryId[]).filter(
  (id) => CATEGORY_META[id].gallery,
)

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

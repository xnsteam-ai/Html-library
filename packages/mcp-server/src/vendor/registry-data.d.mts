/**
 * Types for the vendored registry core. The implementation is plain ESM copied
 * verbatim from scripts/lib/registry-data.mjs; only these declarations are
 * hand-written.
 */

export const REPO: string
export const BRANCH: string
export const PAGES_URL: string
export const REPO_URL: string
export const RAW_URL: string

export type CategoryId = 'images' | 'apps' | 'sites' | 'agent' | 'ui'
export type Surface = 'app' | 'site' | 'section'

export const CATEGORIES: Record<CategoryId, { title: string; order: number; blurb: string }>
export const FRAMED_CATEGORIES: CategoryId[]
export const SURFACES: Surface[]
export const APP_TOKENS: string[]
export const APP_TOKEN_RE: RegExp
export const SUBSTITUTIONS: Record<string, string>

export interface ComponentMeta {
  name: string
  title: string
  description: string
  category: CategoryId
  surface?: Surface
  order?: number
  tags?: string[]
  tagline?: string
  status?: string
  previewBg?: string
  previewHeight?: number
  previewAlign?: string
  prompt?: Record<string, Record<string, string>>
}

export interface RegistryItem {
  meta: ComponentMeta
  html: string
  appTokens: string[]
  portable: boolean
  hasStyle: boolean
}

export function scanPortability(html: string): { portable: boolean; appTokens: string[] }

export function validateHtml(
  id: string,
  html: string,
  collectors: { fail: (id: string, message: string) => void; warn: (id: string, message: string) => void },
): void

export function validateMeta(
  id: string,
  meta: unknown,
  collectors: { fail: (id: string, message: string) => void },
): void

export function readRegistryItems(
  registryDir: string,
  options?: { validate?: boolean },
): Promise<{ items: RegistryItem[]; errors: string[]; warnings: string[] }>

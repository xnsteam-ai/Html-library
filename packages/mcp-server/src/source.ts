import { existsSync } from 'node:fs'
import path from 'node:path'

import { PAGES_URL, RAW_URL } from './vendor/registry-data.mjs'

export type Source =
  | { mode: 'local'; registryDir: string }
  | { mode: 'remote'; baseUrl: string; rawBaseUrl: string }

/** How far up from cwd to look for a checkout, so launching from a subfolder still works. */
const MAX_ANCESTORS = 3

function looksLikeRegistry(dir: string): boolean {
  // A bare `registry/` folder somewhere unrelated should not win; require at
  // least one of the real category folders inside it.
  if (!existsSync(dir)) return false
  return ['ui', 'agent', 'sites', 'apps', 'images'].some((category) =>
    existsSync(path.join(dir, category)),
  )
}

function findRegistryDir(start: string, levels: number): string | null {
  let current = start
  for (let i = 0; i <= levels; i++) {
    const candidate = path.join(current, 'registry')
    if (looksLikeRegistry(candidate)) return candidate
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return null
}

function remoteSource(): Source {
  return { mode: 'remote', baseUrl: `${PAGES_URL}/r`, rawBaseUrl: RAW_URL }
}

/**
 * Local when we can see a real checkout (zero latency, reflects uncommitted
 * edits), remote otherwise so `npx html-library-mcp` works anywhere.
 */
export function resolveSource(cwd: string = process.cwd()): Source {
  const override = process.env.HTML_LIBRARY_SOURCE?.trim().toLowerCase()
  const dirOverride = process.env.HTML_LIBRARY_REGISTRY_DIR?.trim()

  if (override === 'remote') return remoteSource()

  if (override === 'local' || dirOverride) {
    const dir = dirOverride ? path.resolve(dirOverride) : path.join(cwd, 'registry')
    if (!looksLikeRegistry(dir)) {
      throw new Error(
        `html-library-mcp: local mode was requested but no registry was found at ${dir}. ` +
          'Set HTML_LIBRARY_REGISTRY_DIR to the registry/ folder, or unset ' +
          'HTML_LIBRARY_SOURCE to fall back to the hosted registry.',
      )
    }
    return { mode: 'local', registryDir: dir }
  }

  const detected = findRegistryDir(cwd, MAX_ANCESTORS)
  return detected ? { mode: 'local', registryDir: detected } : remoteSource()
}

export function describeSource(source: Source): string {
  return source.mode === 'local'
    ? `local mode (${source.registryDir})`
    : `remote mode (${source.baseUrl})`
}

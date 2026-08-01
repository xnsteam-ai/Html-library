import { useEffect, useState } from 'react'

import type { Surface } from '../../registry'

export type Route =
  | { kind: 'doc'; slug: string }
  | { kind: 'component'; name: string }
  | { kind: 'preview'; name: string }
  | { kind: 'gallery'; surface: Surface }
  | { kind: 'not-found'; path: string }

const DOC_SLUGS = ['introduction', 'installation', 'registry', 'theming', 'use-cases']

export const GALLERY_SLUG = 'apps-and-sites'

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/$/, '')
  if (path === '') return { kind: 'doc', slug: 'introduction' }

  const [head, tail] = path.split('/')
  if (head === 'component' && tail) return { kind: 'component', name: tail }
  if (head === 'preview' && tail) return { kind: 'preview', name: tail }
  if (head === GALLERY_SLUG) {
    if (!tail || tail === 'apps') return { kind: 'gallery', surface: 'app' }
    if (tail === 'sites') return { kind: 'gallery', surface: 'site' }
  }
  if (!tail && DOC_SLUGS.includes(head)) return { kind: 'doc', slug: head }
  return { kind: 'not-found', path }
}

/** Minimal hash router — deep links survive GitHub Pages without a 404 fallback. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export function navigate(href: string) {
  window.location.hash = href.startsWith('#') ? href : `#${href}`
}

export function docHref(slug: string) {
  return `#/${slug}`
}

export function componentHref(name: string) {
  return `#/component/${name}`
}

/** Chrome-free full-screen view, meant to be opened in its own tab. */
export function previewHref(name: string) {
  return `#/preview/${name}`
}

export function galleryHref(surface: Surface = 'app') {
  return surface === 'site' ? `#/${GALLERY_SLUG}/sites` : `#/${GALLERY_SLUG}`
}

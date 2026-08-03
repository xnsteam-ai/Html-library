import { useEffect, useState } from 'react'

import type { CategoryId } from '../../registry'

export type Route =
  | { kind: 'doc'; slug: string }
  | { kind: 'component'; name: string }
  | { kind: 'preview'; name: string }
  | { kind: 'gallery'; category: CategoryId }
  | { kind: 'not-found'; path: string }

const DOC_SLUGS = ['introduction', 'installation', 'registry', 'theming', 'use-cases']
const GALLERY_CATEGORY_SLUGS: CategoryId[] = ['images', 'apps', 'sites', 'agent', 'ui']

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/$/, '')
  if (path === '') return { kind: 'doc', slug: 'introduction' }

  const [head, tail] = path.split('/')
  if (head === 'component' && tail) return { kind: 'component', name: tail }
  if (head === 'preview' && tail) return { kind: 'preview', name: tail }
  if (!tail && GALLERY_CATEGORY_SLUGS.includes(head as CategoryId)) {
    return { kind: 'gallery', category: head as CategoryId }
  }
  // Apps and Sites used to share one gallery at #/apps-and-sites[/sites];
  // keep old links landing somewhere sensible rather than 404ing.
  if (head === 'apps-and-sites') {
    return { kind: 'gallery', category: tail === 'sites' ? 'sites' : 'apps' }
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

export function galleryHref(category: CategoryId) {
  return `#/${category}`
}

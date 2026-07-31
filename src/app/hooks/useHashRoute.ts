import { useEffect, useState } from 'react'

export type Route =
  | { kind: 'doc'; slug: string }
  | { kind: 'component'; name: string }
  | { kind: 'not-found'; path: string }

const DOC_SLUGS = ['introduction', 'installation', 'registry', 'theming', 'use-cases']

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/$/, '')
  if (path === '') return { kind: 'doc', slug: 'introduction' }

  const [head, tail] = path.split('/')
  if (head === 'component' && tail) return { kind: 'component', name: tail }
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

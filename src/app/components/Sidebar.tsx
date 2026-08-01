import { useEffect, useState } from 'react'
import { ChevronsLeft, Github, LayoutGrid, Moon, Search, Star, Sun } from 'lucide-react'
import { CATEGORY_META, categories, REPO, REPO_URL } from '../../registry'
import { componentHref, docHref, galleryHref, type Route } from '../hooks/useHashRoute'
import { useTheme } from '../hooks/useTheme'
import { Logo } from './Logo'

const DOC_LINKS = [
  { slug: 'introduction', label: 'Introduction' },
  { slug: 'installation', label: 'Installation' },
  { slug: 'registry', label: 'Registry' },
  { slug: 'theming', label: 'Theming' },
  { slug: 'use-cases', label: 'Use cases' },
]

function useStarCount() {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`https://api.github.com/repos/${REPO}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.stargazers_count === 'number') {
          setStars(data.stargazers_count)
        }
      })
      .catch(() => {
        // Offline or rate-limited — the link still works without a count.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return stars
}

interface SidebarProps {
  route: Route
  onCollapse: () => void
  onOpenSearch: () => void
}

export function Sidebar({ route, onCollapse, onOpenSearch }: SidebarProps) {
  const { theme, toggle } = useTheme()
  const stars = useStarCount()

  const isDocActive = (slug: string) => route.kind === 'doc' && route.slug === slug
  const isComponentActive = (name: string) => route.kind === 'component' && route.name === name

  return (
    <aside className="flex h-full w-[264px] min-w-[264px] flex-col border-r border-border bg-background">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-4">
        <Logo />
        <span className="flex-1 text-[15px] font-semibold tracking-tight text-foreground">
          HTML Library
        </span>
        <button
          type="button"
          onClick={onCollapse}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-subtle hover:text-foreground"
          aria-label="Collapse sidebar"
        >
          <ChevronsLeft size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 pt-1">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2 rounded-lg bg-muted px-2.5 py-2 text-left transition hover:bg-subtle"
        >
          <Search size={14} className="text-muted-foreground" />
          <span className="flex-1 text-[13px] text-muted-foreground">Search…</span>
          <kbd className="font-mono text-[11px] text-muted-foreground">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-3">
        <ul className="space-y-px py-1">
          {DOC_LINKS.map((link) => (
            <li key={link.slug}>
              <a
                href={docHref(link.slug)}
                aria-current={isDocActive(link.slug) ? 'page' : undefined}
                className={`block rounded-md px-2.5 py-1.5 text-[13.5px] transition ${
                  isDocActive(link.slug)
                    ? 'bg-subtle font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {categories.map((category) => {
          const isGallery = Boolean(CATEGORY_META[category.id].gallery)
          const isActiveGallery = route.kind === 'gallery' && route.category === category.id

          return (
          <div key={category.id} className="pt-3">
            <div className="mb-1 border-t border-border pt-3">
              {/* Apps and Sites each open their own gallery; the other
                  sections are plain labels. */}
              {isGallery ? (
                <a
                  href={galleryHref(category.id)}
                  aria-current={isActiveGallery ? 'page' : undefined}
                  className={`mx-0 flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition ${
                    isActiveGallery
                      ? 'bg-subtle text-foreground'
                      : 'text-muted-foreground/80 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {category.title}
                  <LayoutGrid size={11} className="opacity-70" />
                </a>
              ) : (
                <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                  {category.title}
                </p>
              )}
            </div>
            <ul className="space-y-px">
              {category.items.map((item) => (
                <li key={item.name}>
                  <a
                    href={componentHref(item.name)}
                    aria-current={isComponentActive(item.name) ? 'page' : undefined}
                    className={`block rounded-md px-2.5 py-1.5 text-[13.5px] transition ${
                      isComponentActive(item.name)
                        ? 'bg-subtle font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          )
        })}
      </nav>

      {/* CTA */}
      <div className="px-3 pb-3">
        <a
          href={docHref('installation')}
          className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-[13.5px] font-medium text-primary-foreground transition hover:opacity-90"
        >
          Get the registry
        </a>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <button
          type="button"
          onClick={toggle}
          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-subtle hover:text-foreground"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] text-muted-foreground transition hover:bg-subtle hover:text-foreground"
        >
          <Github size={15} />
          {stars !== null && (
            <span className="flex items-center gap-0.5">
              <Star size={11} />
              {stars}
            </span>
          )}
        </a>
      </div>
    </aside>
  )
}

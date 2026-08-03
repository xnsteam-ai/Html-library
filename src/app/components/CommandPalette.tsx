import { useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, ListTree, Search, Square, Component, FileImage, Microchip, AppWindow, LayoutGrid } from 'lucide-react'
import { CATEGORY_META, components } from '../../registry'
import { componentHref, docHref, galleryHref, navigate } from '../hooks/useHashRoute'

interface Entry {
  href: string
  title: string
  hint: string
  kind: 'doc' | 'component'
  category?: string
}

const DOC_ENTRIES: Entry[] = [
  { href: galleryHref('apps'), title: 'Apps gallery', hint: 'Browse mobile screens', kind: 'doc' },
  { href: galleryHref('sites'), title: 'Sites gallery', hint: 'Browse pages & sections', kind: 'doc' },
  { href: docHref('introduction'), title: 'Introduction', hint: 'Docs', kind: 'doc' },
  { href: docHref('installation'), title: 'Installation', hint: 'Docs', kind: 'doc' },
  { href: docHref('registry'), title: 'Registry', hint: 'Docs', kind: 'doc' },
  { href: docHref('theming'), title: 'Theming', hint: 'Docs', kind: 'doc' },
  { href: docHref('skills'), title: 'Skills', hint: 'Docs · teach an AI assistant this library', kind: 'doc' },
  { href: docHref('use-cases'), title: 'Use cases', hint: 'Docs', kind: 'doc' },
]

function score(entry: Entry, query: string) {
  const haystack = `${entry.title} ${entry.hint}`.toLowerCase()
  const index = haystack.indexOf(query)
  if (index === -1) return -1
  return entry.title.toLowerCase().startsWith(query) ? 0 : index + 1
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const entries = useMemo<Entry[]>(
    () => [
      ...DOC_ENTRIES,
      ...components.map((item) => ({
        href: componentHref(item.name),
        title: item.title,
        hint: `${CATEGORY_META[item.category].title} · ${(item.tags ?? []).join(', ')}`,
        kind: 'component' as const,
        category: item.category,
      })),
    ],
    [],
  )

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return entries
    return entries
      .map((entry) => ({ entry, rank: score(entry, needle) }))
      .filter(({ rank }) => rank >= 0)
      .sort((a, b) => a.rank - b.rank)
      .map(({ entry }) => entry)
  }, [entries, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => setActive(0), [query])

  if (!open) return null

  const commit = (entry: Entry | undefined) => {
    if (!entry) return
    navigate(entry.href)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 px-4 pt-[12vh] backdrop-blur-[2px] dark:bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Search the library"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-background shadow-2xl shadow-black/10 dark:shadow-black/50">
        <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
          <Search size={16} className="text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActive((index) => Math.min(index + 1, results.length - 1))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActive((index) => Math.max(index - 1, 0))
              } else if (event.key === 'Enter') {
                event.preventDefault()
                commit(results[active])
              } else if (event.key === 'Escape') {
                onClose()
              }
            }}
            placeholder="Search components and docs…"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
            esc
          </kbd>
        </div>

        <div className="scrollbar-thin max-h-[340px] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
              No matches for “{query}”.
            </p>
          ) : (
            results.map((entry, index) => (
              <button
                key={entry.href}
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => commit(entry)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                  index === active ? 'bg-muted' : ''
                }`}
              >
                {entry.kind === 'doc' ? (
                  <ListTree size={14} className="shrink-0 text-muted-foreground" />
                ) : entry.category === 'ui' ? (
                  <Component size={14} className="shrink-0 text-muted-foreground" />
                ) : entry.category === 'images' ? (
                  <FileImage size={14} className="shrink-0 text-muted-foreground" />
                ) : entry.category === 'agent' ? (
                  <Microchip size={14} className="shrink-0 text-muted-foreground" />
                ) : entry.category === 'apps' ? (
                  <AppWindow size={14} className="shrink-0 text-muted-foreground" />
                ) : entry.category === 'sites' ? (
                  <LayoutGrid size={14} className="shrink-0 text-muted-foreground" />
                ) : (
                  <Square size={14} className="shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] text-foreground">{entry.title}</span>
                  <span className="block truncate text-[11.5px] text-muted-foreground">
                    {entry.hint}
                  </span>
                </span>
                {index === active && (
                  <CornerDownLeft size={13} className="shrink-0 text-muted-foreground" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

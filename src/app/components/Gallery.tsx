import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { getScreens, type RegistryItem, type Surface } from '../../registry'
import { componentHref, galleryHref } from '../hooks/useHashRoute'
import { ScreenFrame } from './ScreenFrame'

// Card previews are scaled to roughly a third of the authored size; sites are
// far wider than phones, so each surface needs its own factor to land on
// similar card heights.
const CARD_SCALE: Record<Surface, number> = { app: 0.42, site: 0.22 }

const STATUS_LABEL = { new: 'New', updated: 'Updated' } as const

function ScreenCard({ item }: { item: RegistryItem }) {
  const surface = item.surface ?? 'app'

  return (
    <a href={componentHref(item.name)} className="group block">
      <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-muted p-5 transition group-hover:bg-subtle">
        {item.status && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
            {STATUS_LABEL[item.status]}
          </span>
        )}
        <ScreenFrame item={item} scale={CARD_SCALE[surface]} />
      </div>

      <div className="mt-3 flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground">
          {item.title.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-medium text-foreground">
            {item.title}
          </span>
          <span className="block truncate text-[12.5px] text-muted-foreground">
            {item.tagline ?? item.description}
          </span>
        </span>
      </div>
    </a>
  )
}

export function Gallery({ surface }: { surface: Surface }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const screens = getScreens(surface)
    const needle = query.trim().toLowerCase()
    if (!needle) return screens
    return screens.filter((item) =>
      `${item.title} ${item.tagline ?? ''} ${item.description} ${(item.tags ?? []).join(' ')}`
        .toLowerCase()
        .includes(needle),
    )
  }, [surface, query])

  const tab = (value: Surface, label: string, count: number) => (
    <a
      href={galleryHref(value)}
      aria-current={surface === value ? 'page' : undefined}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
        surface === value
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
      <span className="text-[11.5px] text-muted-foreground">{count}</span>
    </a>
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-9">
      <header className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">Apps &amp; Sites</h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
          Complete screens rather than parts — full mobile app views and website pages, still plain
          HTML + Tailwind and still one <code className="font-mono text-[13.5px]">curl</code> away.
        </p>
      </header>

      {/* Tabs + search */}
      <div className="mb-7 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-muted p-[3px]" role="tablist" aria-label="Surface">
          {tab('app', 'Apps', getScreens('app').length)}
          {tab('site', 'Sites', getScreens('site').length)}
        </div>

        <div className="relative ml-auto w-full max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={surface === 'app' ? 'Search app screens…' : 'Search site pages…'}
            aria-label="Search screens"
            className="w-full rounded-full bg-muted py-2 pl-9 pr-8 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-subtle hover:text-foreground"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-[14px] font-medium text-foreground">No screens match “{query}”</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Try a shorter term, or browse the other tab.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition hover:opacity-90"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-x-5 gap-y-7 ${
            surface === 'app'
              ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          }`}
        >
          {results.map((item) => (
            <ScreenCard key={item.name} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

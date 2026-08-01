import { useMemo, useState } from 'react'
import { ExternalLink, Search, X } from 'lucide-react'
import {
  CATEGORY_META,
  GALLERY_CATEGORIES,
  getByCategory,
  type CategoryId,
  type RegistryItem,
  type Surface,
} from '../../registry'
import { componentHref, galleryHref, previewHref } from '../hooks/useHashRoute'
import { ScreenFrame } from './ScreenFrame'

// Card previews are scaled to roughly a third of the authored size; sites are
// far wider than phones, so each surface needs its own factor to land on
// similar card heights. Sections additionally clamp to a fixed authored
// height so a long section still yields a tidy card.
const CARD_SCALE: Record<Surface, number> = { app: 0.42, site: 0.22, section: 0.28 }
const SECTION_CARD_CLAMP = 420

const STATUS_LABEL = { new: 'New', updated: 'Updated' } as const

function ScreenCard({ item }: { item: RegistryItem }) {
  const surface = item.surface ?? 'app'

  // The card is a link, so the full-screen control sits outside it — nesting
  // anchors is invalid and would swallow the card's own click.
  return (
    <div className="group relative">
      <a
        href={previewHref(item.name)}
        target="_blank"
        rel="noreferrer"
        className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-lg border border-border bg-background/95 px-2 py-1 text-[11.5px] font-medium text-muted-foreground opacity-0 shadow-sm backdrop-blur transition hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        title="Open full screen in a new tab"
      >
        <ExternalLink size={11} />
        Full screen
      </a>

      <a href={componentHref(item.name)} className="block">
        <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-muted p-5 transition group-hover:bg-subtle">
          {item.status && (
            <span className="absolute left-3 top-3 z-10 rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
              {STATUS_LABEL[item.status]}
            </span>
          )}
          <ScreenFrame
            item={item}
            scale={CARD_SCALE[surface]}
            clampHeight={surface === 'section' ? SECTION_CARD_CLAMP : undefined}
          />
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
    </div>
  )
}

export function Gallery({ category }: { category: CategoryId }) {
  const [query, setQuery] = useState('')
  const meta = CATEGORY_META[category]

  const results = useMemo(() => {
    const items = getByCategory(category)
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    return items.filter((item) =>
      `${item.title} ${item.tagline ?? ''} ${item.description} ${(item.tags ?? []).join(' ')}`
        .toLowerCase()
        .includes(needle),
    )
  }, [category, query])

  // Both galleries are wide enough to show as a pill switcher without a
  // dedicated tabs component, mirroring the app shell's Home/Code toggle.
  const tab = (value: CategoryId) => (
    <a
      key={value}
      href={galleryHref(value)}
      aria-current={category === value ? 'page' : undefined}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
        category === value
          ? 'bg-background text-foreground shadow-sm dark:bg-subtle'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {CATEGORY_META[value].title}
      <span className="text-[11.5px] text-muted-foreground">{getByCategory(value).length}</span>
    </a>
  )

  const isPhoneGrid = category === 'apps'

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-9">
      <header className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">{meta.title}</h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
          {meta.blurb} Still plain HTML + Tailwind, and still one{' '}
          <code className="font-mono text-[13.5px]">curl</code> away.
        </p>
      </header>

      {/* Category switcher + search */}
      <div className="mb-7 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full bg-muted p-[3px]" role="tablist" aria-label="Category">
          {GALLERY_CATEGORIES.map(tab)}
        </div>

        <div className="relative ml-auto w-full max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${meta.title.toLowerCase()}…`}
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
            Try a shorter term, or browse the other category.
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
            isPhoneGrid
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

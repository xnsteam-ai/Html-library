import { useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy, Search, X } from 'lucide-react'
import {
  CATEGORY_META,
  GALLERY_CATEGORIES,
  getByCategory,
  type CategoryId,
  type RegistryItem,
} from '../../registry'
import { componentHref, galleryHref } from '../hooks/useHashRoute'
import { useCopy } from '../hooks/useCopy'
import { toStandaloneHtml } from '../lib/standaloneHtml'

/**
 * Registry markup points at the deployed asset host so a copied snippet renders
 * wherever it is pasted. The docs app serves those same files out of `public/`,
 * so rewrite to a base-relative path — that resolves locally in dev and under
 * the GitHub Pages sub-path, instead of round-tripping to the live site.
 */
function localSrc(item: RegistryItem): string | undefined {
  const file = item.html.match(/\/images\/([^"?]+)/)?.[1]
  return file ? `${import.meta.env.BASE_URL}images/${file}` : undefined
}

/** The strip along the top — a scrollable rail of style cards. */
function StyleRail({ items }: { items: RegistryItem[] }) {
  const rail = useRef<HTMLDivElement>(null)

  const scrollBy = (direction: 1 | -1) => {
    rail.current?.scrollBy({ left: direction * 640, behavior: 'smooth' })
  }

  return (
    <div className="group/rail relative">
      <div
        ref={rail}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const src = localSrc(item)
          return (
            <a
              key={item.name}
              href={componentHref(item.name)}
              className="group/card relative aspect-[3/4] w-[150px] shrink-0 snap-start overflow-hidden rounded-lg bg-muted sm:w-[168px]"
              title={item.description}
            >
              {src && (
                <img
                  src={src}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent px-2.5 pb-2 pt-8">
                <span className="block truncate text-[12.5px] font-medium text-white">
                  {item.title}
                </span>
              </div>
            </a>
          )
        })}
      </div>

      {/* Rail controls — hidden until the row is hovered, as in a media shelf. */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll styles left"
        className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-background/90 p-1.5 text-foreground opacity-0 shadow-md backdrop-blur transition group-hover/rail:opacity-100 focus-visible:opacity-100 sm:block"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll styles right"
        className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-background/90 p-1.5 text-foreground opacity-0 shadow-md backdrop-blur transition group-hover/rail:opacity-100 focus-visible:opacity-100 sm:block"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

/**
 * Masonry tile. The column layout is CSS `columns`, so each tile must avoid
 * breaking across a column boundary and carries its own bottom margin — grid
 * `gap` does not apply inside a multi-column flow.
 */
function MasonryTile({ item }: { item: RegistryItem }) {
  const { copied, copy } = useCopy()
  const src = localSrc(item)

  return (
    <div className="group relative mb-3 break-inside-avoid">
      <a
        href={componentHref(item.name)}
        className="block overflow-hidden rounded-xl bg-muted"
        title={item.title}
      >
        {src && (
          <img
            src={src}
            alt={item.description}
            loading="lazy"
            className="w-full transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </a>

      {/* Caption + copy sit over the image, revealed on hover. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-2 rounded-b-xl bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 opacity-0 transition group-hover:opacity-100">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium text-white">{item.title}</span>
          <span className="block truncate text-[11px] text-white/70">{item.tagline}</span>
        </span>
        <button
          type="button"
          onClick={() => copy(toStandaloneHtml(item))}
          className="pointer-events-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
          title="Copy HTML"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  )
}

export function ImagesGallery() {
  const [query, setQuery] = useState('')
  const meta = CATEGORY_META.images
  const all = getByCategory('images')

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return all
    return all.filter((item) =>
      `${item.title} ${item.tagline ?? ''} ${item.description} ${(item.tags ?? []).join(' ')}`
        .toLowerCase()
        .includes(needle),
    )
  }, [all, query])

  const tab = (value: CategoryId) => (
    <a
      key={value}
      href={galleryHref(value)}
      aria-current={value === 'images' ? 'page' : undefined}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
        value === 'images'
          ? 'bg-white text-foreground shadow-sm dark:bg-neutral-700'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {CATEGORY_META[value].title}
      <span className="text-[11.5px] text-muted-foreground">{getByCategory(value).length}</span>
    </a>
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-9">
      <header className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">{meta.title}</h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
          {meta.blurb} Copy the tag, or pull the JSON like any other component.
        </p>
      </header>

      <div className="mb-7 flex flex-wrap items-center gap-3">
        <div
          className="flex rounded-full bg-neutral-200 p-[3px] dark:bg-neutral-800"
          role="tablist"
          aria-label="Category"
        >
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
            placeholder="Search images…"
            aria-label="Search images"
            className="w-full rounded-full bg-neutral-200 py-2 pl-9 pr-8 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:bg-neutral-800"
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

      {/* The rail always shows the full set — it is a shelf, not a result list. */}
      <StyleRail items={all} />

      <h2 className="mb-4 mt-9 text-[19px] font-semibold tracking-tight text-foreground">
        Discover
      </h2>

      {results.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-[14px] font-medium text-foreground">No images match “{query}”</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Try a shorter term, or browse the other categories.
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
        <div className="columns-2 gap-3 sm:columns-3 xl:columns-4">
          {results.map((item) => (
            <MasonryTile key={item.name} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

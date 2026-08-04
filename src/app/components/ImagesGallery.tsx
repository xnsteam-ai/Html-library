import { useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy, Search, Sparkles, X } from 'lucide-react'
import {
  CATEGORY_META,
  GALLERY_CATEGORIES,
  getByCategory,
  type CategoryId,
  type RegistryItem,
} from '../../registry'
import { componentHref, galleryHref } from '../hooks/useHashRoute'
import { useCopy } from '../hooks/useCopy'
import { findSimilarImages } from '../lib/imageSimilarity'
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

/** How many style cards the rail offers. A shelf, not the catalogue. */
const RAIL_SIZE = 10

/**
 * Pick the rail's line-up: one strong representative per leading style.
 *
 * Putting all 110 images here made it a scrollbar rather than a choice, and the
 * first ten happened to repeat the same few looks. So rank tags by how much of
 * the library each covers, then take the highest-priority image carrying each
 * one that has not been used yet — which yields ten visibly different styles
 * (portrait, product, poster, editorial, grid…) rather than ten near-duplicates.
 *
 * Derived rather than hand-listed, so it re-balances itself as images are added
 * instead of silently going stale. Ties break alphabetically and candidates are
 * taken in registry order, so the result is stable between renders.
 */
function pickStyleRail(items: RegistryItem[], count = RAIL_SIZE): RegistryItem[] {
  const frequency = new Map<string, number>()
  for (const item of items) {
    for (const tag of item.tags ?? []) frequency.set(tag, (frequency.get(tag) ?? 0) + 1)
  }

  const tagsByReach = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)

  const picked: RegistryItem[] = []
  const used = new Set<string>()

  for (const tag of tagsByReach) {
    if (picked.length >= count) break
    const match = items.find((item) => !used.has(item.name) && (item.tags ?? []).includes(tag))
    if (match) {
      used.add(match.name)
      picked.push(match)
    }
  }

  // Untagged images are invisible to the loop above, so top up in registry
  // order rather than leaving the shelf short.
  for (const item of items) {
    if (picked.length >= count) break
    if (!used.has(item.name)) {
      used.add(item.name)
      picked.push(item)
    }
  }

  return picked
}

/**
 * The strip along the top — a scrollable rail of style cards. Clicking a card
 * does not navigate; it drives the "similar to…" filter in Discover below, so
 * this is a toggle button rather than a link. Selecting the already-selected
 * card clears it, and its own detail page stays reachable through the "View
 * this image" link Discover renders once it is active.
 */
function StyleRail({
  items,
  selectedName,
  onSelect,
}: {
  items: RegistryItem[]
  selectedName: string | null
  onSelect: (name: string) => void
}) {
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
          const active = item.name === selectedName
          return (
            <button
              key={item.name}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(item.name)}
              className={`group/card relative aspect-[3/4] w-[150px] shrink-0 snap-start overflow-hidden rounded-lg bg-muted text-left transition sm:w-[168px] ${
                active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
              title={`Show images similar to ${item.title}`}
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
            </button>
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
function MasonryTile({
  item,
  reason,
  onExplore,
}: {
  item: RegistryItem
  /** Why this result surfaced, when it came from a similarity search. */
  reason?: string
  onExplore: (name: string) => void
}) {
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

      {/* Caption + actions sit over the image, revealed on hover. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-2 rounded-b-xl bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 opacity-0 transition group-hover:opacity-100">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium text-white">{item.title}</span>
          <span className="block truncate text-[11px] text-white/70">{reason ?? item.tagline}</span>
        </span>
        {/* Re-seeding from a result is what makes this explorable rather than a
            single lookup — every image is a door to the next set. */}
        <button
          type="button"
          onClick={() => onExplore(item.name)}
          className="pointer-events-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/15 text-white backdrop-blur transition hover:bg-white/30"
          title={`More like ${item.title}`}
          aria-label={`More like ${item.title}`}
        >
          <Sparkles size={13} />
        </button>
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
  // The image a rail card is currently selected for, driving a "similar to…"
  // filter on Discover. Mutually exclusive with the text search — starting
  // either one clears the other, so only one filter is ever in effect.
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const discover = useRef<HTMLDivElement>(null)
  const meta = CATEGORY_META.images
  const all = getByCategory('images')
  const selected = selectedName ? all.find((item) => item.name === selectedName) : undefined
  // The shelf is an invitation, so it only offers images that lead somewhere.
  // A few images are distinctive enough to have no eligible neighbours at all,
  // which is a fine thing to discover by searching but a poor front door.
  const railItems = useMemo(
    () => pickStyleRail(all.filter((item) => findSimilarImages(all, item).length > 0)),
    [all],
  )

  const selectRailImage = (name: string) => {
    setQuery('')
    setSelectedName((current) => (current === name ? null : name))
  }

  const searchQuery = (value: string) => {
    setQuery(value)
    setSelectedName(null)
  }

  // Re-seeding from a result several screens down would otherwise swap the grid
  // silently underneath the reader, so bring the new set into view.
  const exploreFrom = (name: string) => {
    selectRailImage(name)
    discover.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Ranked by the multi-channel scorer in lib/imageSimilarity — tags, theme,
  // look and technique, IDF-weighted so a rare shared trait outweighs a generic
  // one. Undefined (no selection) and empty array (selection has no match) are
  // kept distinct so the empty state can tell "nothing chosen" apart from
  // "chose one, found nothing like it".
  const similar = useMemo(
    () => (selected ? findSimilarImages(all, selected) : undefined),
    [all, selected],
  )
  const reasons = useMemo(
    () => new Map((similar ?? []).map((entry) => [entry.item.name, entry.reason])),
    [similar],
  )

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle) {
      return all.filter((item) =>
        `${item.title} ${item.tagline ?? ''} ${item.description} ${(item.tags ?? []).join(' ')}`
          .toLowerCase()
          .includes(needle),
      )
    }
    if (selected) return (similar ?? []).map((entry) => entry.item)
    return all
  }, [all, query, selected, similar])

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
    // Fills the main area like the other galleries; the masonry below picks its
    // own column count from the width it is given.
    <div className="w-full px-8 py-9">
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
            onChange={(event) => searchQuery(event.target.value)}
            placeholder="Search images…"
            aria-label="Search images"
            className="w-full rounded-full bg-neutral-200 py-2 pl-9 pr-8 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:bg-neutral-800"
          />
          {query && (
            <button
              type="button"
              onClick={() => searchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-subtle hover:text-foreground"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Ten styles to pick from, not the catalogue — Discover below still
          searches and matches against all of them. */}
      <StyleRail items={railItems} selectedName={selectedName} onSelect={selectRailImage} />

      <div
        ref={discover}
        className="mb-4 mt-9 flex scroll-mt-4 flex-wrap items-center gap-x-3 gap-y-1.5"
      >
        <h2 className="text-[19px] font-semibold tracking-tight text-foreground">Discover</h2>
        {selected && (
          <>
            <span className="text-[13px] text-muted-foreground">
              Similar to <span className="font-medium text-foreground">“{selected.title}”</span>
              {similar && similar.length > 0 ? ` · ${similar.length} match${similar.length === 1 ? '' : 'es'}` : ''}
            </span>
            <a
              href={componentHref(selected.name)}
              className="rounded-full border border-border px-2.5 py-1 text-[12px] font-medium text-foreground transition hover:bg-subtle"
            >
              View this image
            </a>
            <button
              type="button"
              onClick={() => setSelectedName(null)}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition hover:bg-subtle hover:text-foreground"
            >
              <X size={11} />
              Clear
            </button>
          </>
        )}
      </div>

      {selected && (!similar || similar.length === 0) ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-[14px] font-medium text-foreground">
            No images similar to “{selected.title}” yet
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Nothing else in the library shares its tags. Browse everything instead.
          </p>
          <button
            type="button"
            onClick={() => setSelectedName(null)}
            className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition hover:opacity-90"
          >
            Show all images
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-[14px] font-medium text-foreground">No images match “{query}”</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Try a shorter term, or browse the other categories.
          </p>
          <button
            type="button"
            onClick={() => searchQuery('')}
            className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition hover:opacity-90"
          >
            Clear search
          </button>
        </div>
      ) : (
        // Column *width* rather than a count above `sm`, so the masonry gains
        // columns as the area widens instead of stretching a fixed three. The
        // explicit two-up stays for phones, where a width-based rule would drop
        // to a single very wide column.
        <div className="columns-2 gap-3 sm:columns-[17rem]">
          {results.map((item) => (
            <MasonryTile
              key={item.name}
              item={item}
              reason={reasons.get(item.name)}
              onExplore={exploreFrom}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Check, Copy, ExternalLink, Search, X } from 'lucide-react'
import {
  CATEGORY_META,
  GALLERY_CATEGORIES,
  getByCategory,
  type CategoryId,
  type RegistryItem,
  type Surface,
} from '../../registry'
import { componentHref, galleryHref, previewHref } from '../hooks/useHashRoute'
import { useCopy } from '../hooks/useCopy'
import { toStandaloneHtml } from '../lib/standaloneHtml'
import { ScreenFrame } from './ScreenFrame'

// Card previews are scaled to roughly a third of the authored size; sites are
// far wider than phones, so each surface needs its own factor to land on
// similar card heights. Sections additionally clamp to a fixed authored
// height so a long section still yields a tidy card.
const CARD_SCALE: Record<Surface, number> = { app: 0.88, site: 0.22, section: 0.28 }
const SECTION_CARD_CLAMP = 420

const STATUS_LABEL = { new: 'New', updated: 'Updated' } as const

function AppCard({ item }: { item: RegistryItem }) {
  const { copied, copy } = useCopy()

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Phone frame sits directly, no outer card wrapper */}
      <a href={componentHref(item.name)} className="relative block">
        {item.status && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
            {STATUS_LABEL[item.status]}
          </span>
        )}
        <ScreenFrame item={item} scale={CARD_SCALE['app']} />
      </a>

      {/* Title row below the phone */}
      <div className="w-full text-center">
        <a href={componentHref(item.name)} className="block">
          <span className="block truncate text-[13.5px] font-medium text-foreground">
            {item.title}
          </span>
          <span className="block truncate text-[12px] text-muted-foreground">
            {item.tagline ?? item.description}
          </span>
        </a>

        <div className="mt-2 flex items-center justify-center gap-2">
          <a
            href={previewHref(item.name)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-foreground transition hover:bg-subtle"
          >
            <ExternalLink size={12} />
            Preview
          </a>
          <button
            type="button"
            onClick={() => copy(toStandaloneHtml(item))}
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-subtle hover:text-foreground"
            title="Copy HTML"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>
    </div>
  )
}

function ScreenCard({ item }: { item: RegistryItem }) {
  const surface = item.surface ?? 'app'

  return (
    <div className="flex flex-col group">
      <a 
        href={componentHref(item.name)} 
        className="relative flex items-start justify-center h-[200px] overflow-hidden rounded-xl border border-border bg-muted transition"
      >
        <ScreenFrame
          item={item}
          fit={true}
          unframed={true}
          clampHeight={surface === 'section' ? SECTION_CARD_CLAMP : undefined}
        />
      </a>
      
      <div className="mt-4 flex items-center gap-2.5 px-1">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-foreground text-[11px] font-bold text-background">
          {item.title.charAt(0)}
        </span>
        <a 
          href={componentHref(item.name)} 
          className="truncate text-[14.5px] font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors"
        >
          {item.title}
        </a>
        {item.status && (
          <span className="ml-auto rounded-full bg-subtle px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {STATUS_LABEL[item.status]}
          </span>
        )}
      </div>
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
          ? 'bg-white dark:bg-neutral-700 text-foreground shadow-sm'
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
        <div className="flex rounded-full bg-neutral-200 dark:bg-neutral-800 p-[3px]" role="tablist" aria-label="Category">
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
            className="w-full rounded-full bg-neutral-200 dark:bg-neutral-800 py-2 pl-9 pr-8 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
          className={`grid gap-x-6 gap-y-10 ${
            isPhoneGrid
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          }`}
        >
          {results.map((item) =>
            isPhoneGrid ? (
              <AppCard key={item.name} item={item} />
            ) : (
              <ScreenCard key={item.name} item={item} />
            ),
          )}
        </div>
      )}
    </div>
  )
}

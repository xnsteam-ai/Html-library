import { useEffect, useState } from 'react'
import { PanelLeft, Search } from 'lucide-react'
import { CATEGORY_META, getComponent } from '../registry'
import { CommandPalette } from './components/CommandPalette'
import { ComponentPage } from './components/ComponentPage'
import { Gallery } from './components/Gallery'
import { Sidebar } from './components/Sidebar'
import { docHref, useHashRoute, type Route } from './hooks/useHashRoute'
import { Installation } from './pages/Installation'
import { Introduction } from './pages/Introduction'
import { RegistryDoc } from './pages/Registry'
import { Theming } from './pages/Theming'
import { UseCases } from './pages/UseCases'

const DOC_TITLES: Record<string, string> = {
  introduction: 'Introduction',
  installation: 'Installation',
  registry: 'Registry',
  theming: 'Theming',
  'use-cases': 'Use cases',
}

function NotFound({ path }: { path: string }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-start px-8 py-16">
      <h1 className="text-[24px] font-semibold tracking-tight text-foreground">Nothing here</h1>
      <p className="mt-2 text-[14.5px] text-muted-foreground">
        <span className="font-mono text-[13.5px]">/{path}</span> is not a page in this library.
      </p>
      <a
        href={docHref('introduction')}
        className="mt-5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition hover:opacity-90"
      >
        Back to the introduction
      </a>
    </div>
  )
}

function breadcrumb(route: Route): string {
  if (route.kind === 'doc') return DOC_TITLES[route.slug] ?? 'Docs'
  if (route.kind === 'gallery') {
    return `${CATEGORY_META.apps.title} · ${route.surface === 'site' ? 'Sites' : 'Apps'}`
  }
  if (route.kind === 'component') {
    const item = getComponent(route.name)
    return item ? `${CATEGORY_META[item.category].title} · ${item.title}` : 'Not found'
  }
  return 'Not found'
}

function Content({ route }: { route: Route }) {
  // Keyed by surface so switching tabs clears the previous tab's search term,
  // which would otherwise leave the new tab looking empty.
  if (route.kind === 'gallery') return <Gallery key={route.surface} surface={route.surface} />
  if (route.kind === 'component') {
    const item = getComponent(route.name)
    return item ? <ComponentPage item={item} /> : <NotFound path={`component/${route.name}`} />
  }
  if (route.kind === 'not-found') return <NotFound path={route.path} />

  switch (route.slug) {
    case 'installation':
      return <Installation />
    case 'registry':
      return <RegistryDoc />
    case 'theming':
      return <Theming />
    case 'use-cases':
      return <UseCases />
    default:
      return <Introduction />
  }
}

export default function App() {
  const route = useHashRoute()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)

  // Scroll the reading pane back to the top on navigation.
  useEffect(() => {
    document.getElementById('content')?.scrollTo({ top: 0 })
  }, [route])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {sidebarOpen && (
        <Sidebar
          route={route}
          onCollapse={() => setSidebarOpen(false)}
          onOpenSearch={() => setSearchOpen(true)}
        />
      )}

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-subtle hover:text-foreground"
              aria-label="Open sidebar"
            >
              <PanelLeft size={16} />
            </button>
          )}
          <span className="text-[13px] text-muted-foreground">{breadcrumb(route)}</span>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] text-muted-foreground transition hover:bg-subtle hover:text-foreground"
          >
            <Search size={14} />
            <kbd className="font-mono text-[11px]">⌘K</kbd>
          </button>
        </header>

        <main id="content" className="scrollbar-thin flex-1 overflow-y-auto">
          <Content route={route} />
        </main>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

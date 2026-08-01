import { ArrowLeft, Moon, Sun } from 'lucide-react'
import { getComponent, type RegistryItem } from '../../registry'
import { componentHref } from '../hooks/useHashRoute'
import { useTheme } from '../hooks/useTheme'
import { ScreenFrame } from './ScreenFrame'

/**
 * The component on its own, with no docs chrome — the target of every
 * "Open in new tab" control. Whole screens render at their authored size;
 * everything else fills the viewport width so it can breathe.
 */
export function PreviewPage({ name }: { name: string }) {
  const item = getComponent(name)
  const { theme, toggle } = useTheme()

  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-[15px] font-medium text-foreground">No component named “{name}”</p>
        <a
          href={componentHref('agent-chat')}
          className="rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground"
        >
          Browse the library
        </a>
      </div>
    )
  }

  return (
    <div className="relative min-h-full bg-background">
      {/* Floating controls, deliberately out of the way of the component itself */}
      <div className="fixed right-4 top-4 z-50 flex items-center gap-1 rounded-full border border-border bg-background/90 p-1 shadow-sm backdrop-blur">
        <a
          href={componentHref(item.name)}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="Back to the documentation for this component"
        >
          <ArrowLeft size={13} />
          {item.title}
        </a>
        <button
          type="button"
          onClick={toggle}
          className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      <Rendered item={item} />
    </div>
  )
}

// No frame, no card, no border, no padding box around the markup — this route
// exists so a component renders exactly as it would if you'd navigated to it
// directly, not as a boxed-up preview of itself.
function Rendered({ item }: { item: RegistryItem }) {
  // Sections are authored `w-full` and meant to fill whatever page they sit
  // in, so let them do exactly that — full width, natural height.
  if (item.surface === 'section') {
    return <div dangerouslySetInnerHTML={{ __html: item.html }} />
  }

  // Apps and Sites are wrapped in their single device frame and fit to the viewport.
  if (item.category === 'apps' || item.category === 'sites') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 md:p-12 bg-background">
        <ScreenFrame item={item} fit interactive />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 pt-16">
      <div dangerouslySetInnerHTML={{ __html: item.html }} />
    </div>
  )
}

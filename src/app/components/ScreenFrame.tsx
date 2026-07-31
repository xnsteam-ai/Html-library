import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { FRAME_SIZE, type RegistryItem, type Surface } from '../../registry'

/** Border + padding the device chrome adds around the screen itself. */
const CHROME_WIDTH: Record<Surface, number> = { app: 20, site: 2 }

/**
 * Measures the available width and scales the screen down to fit it, never up.
 * Detail views pass `fit` so a 1280px site page stays inside the reading column
 * instead of overflowing it.
 */
function useFitScale(surface: Surface, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(enabled ? 0 : 1)

  useLayoutEffect(() => {
    if (!enabled) {
      setScale(1)
      return
    }
    const element = ref.current
    if (!element) return

    const update = () => {
      const available = element.clientWidth - CHROME_WIDTH[surface]
      setScale(Math.min(1, available / FRAME_SIZE[surface].width))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [surface, enabled])

  return { ref, scale }
}

/**
 * The markup is rendered at its authored size (390×844 or 1280×800) and then
 * scaled with a transform, so gallery cards and the full-size detail view share
 * one code path. Rendering inline rather than in an iframe is deliberate:
 * previews must inherit the docs stylesheet, since Tailwind generates registry
 * utilities through the `@source '../../registry/**\/*.html'` directive.
 */
function ScaledScreen({
  html,
  surface,
  scale,
}: {
  html: string
  surface: Surface
  scale: number
}) {
  const { width, height } = FRAME_SIZE[surface]

  return (
    <div
      style={{ width: width * scale, height: height * scale }}
      className="overflow-hidden bg-white dark:bg-neutral-950"
    >
      <div
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className="overflow-hidden"
      >
        <div className="pointer-events-none select-none" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="relative overflow-hidden rounded-[1.5rem]">
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-[18px] w-[86px] -translate-x-1/2 rounded-b-xl bg-gray-900 dark:bg-black" />
        {children}
      </div>
    </div>
  )
}

function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-white/20" />
        </span>
        <span className="mx-auto rounded-md bg-white px-8 py-0.5 text-[10px] text-gray-400 dark:bg-neutral-950 dark:text-gray-500">
          example.com
        </span>
      </div>
      {children}
    </div>
  )
}

interface ScreenFrameProps {
  item: RegistryItem
  /** Fixed scale for gallery cards. Ignored when `fit` is set. */
  scale?: number
  /** Scale down to whatever width is available, never up. */
  fit?: boolean
}

export function ScreenFrame({ item, scale = 1, fit = false }: ScreenFrameProps) {
  const surface = item.surface ?? 'app'
  const { ref, scale: fitted } = useFitScale(surface, fit)
  const applied = fit ? fitted : scale

  const screen = <ScaledScreen html={item.html} surface={surface} scale={applied} />
  const framed =
    surface === 'app' ? <PhoneFrame>{screen}</PhoneFrame> : <BrowserFrame>{screen}</BrowserFrame>

  // The ref must sit on a full-width box for the measurement to be meaningful.
  return (
    <div ref={ref} className="flex w-full justify-center">
      {applied > 0 && framed}
    </div>
  )
}

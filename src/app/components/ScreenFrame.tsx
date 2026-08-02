import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { FRAME_SIZE, type RegistryItem, type Surface } from '../../registry'

/** Border + padding the device chrome adds around the screen itself. */
const CHROME_WIDTH: Record<Surface, number> = { app: 20, site: 2, section: 2 }

/**
 * Sections are authored at a fixed width but grow with their content, so their
 * height has to be measured rather than looked up. Renders the markup at its
 * natural (unscaled) width and reports the resulting height.
 */
function useContentHeight(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!enabled) return
    const element = ref.current
    if (!element) return

    const update = () => setHeight(element.scrollHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled])

  return { ref, height }
}

/**
 * Measures the available width and scales the screen down to fit it, never up.
 * Detail views pass `fit` so a 1280px site page stays inside the reading column
 * instead of overflowing it.
 */
function useFitScale(width: number, chrome: number, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(enabled ? 0 : 1)

  useLayoutEffect(() => {
    if (!enabled) {
      setScale(1)
      return
    }
    const element = ref.current
    if (!element) return

    const update = () => setScale(Math.min(1, (element.clientWidth - chrome) / width))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [width, chrome, enabled])

  return { ref, scale }
}

/**
 * The markup is rendered at its authored size and then scaled with a
 * transform, so gallery cards and the full-size detail view share one code
 * path. Rendering inline rather than in an iframe is deliberate: previews must
 * inherit the docs stylesheet, since Tailwind generates registry utilities
 * through the `@source '../../registry/**\/*.html'` directive.
 */
function ScaledScreen({
  html,
  width,
  height,
  scale,
  interactive,
  clampHeight,
  contentRef,
  isSiteOrSection = false,
}: {
  html: string
  width: number
  height: number
  scale: number
  interactive: boolean
  clampHeight?: number
  contentRef?: React.Ref<HTMLDivElement>
  isSiteOrSection?: boolean
}) {
  const visibleHeight = clampHeight ? Math.min(height, clampHeight) : height

  return (
    <div
      style={{ width: width * scale, height: visibleHeight * scale }}
      className={`overflow-hidden bg-white dark:bg-neutral-950 ${
        isSiteOrSection ? 'rounded-xl border border-gray-200 shadow-sm dark:border-white/10' : ''
      }`}
    >
      <div
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className="overflow-hidden"
      >
        <div
          ref={contentRef}
          className={interactive ? undefined : 'pointer-events-none select-none'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
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

// A reasonable guess while a section's real height is still being measured,
// so the layout does not visibly jump once the observer reports in.
const FALLBACK_SECTION_HEIGHT = 480

interface ScreenFrameProps {
  item: RegistryItem
  /** Fixed scale for gallery cards. Ignored when `fit` is set. */
  scale?: number
  /** Scale down to whatever width is available, never up. */
  fit?: boolean
  /** Let clicks reach the screen's own controls. */
  interactive?: boolean
  /**
   * Authored-pixel height to crop a section to before scaling, so a long
   * section still yields a tidy gallery card. Ignored for fixed-height
   * surfaces (app, site).
   */
  clampHeight?: number
  /** Do not apply any device frame or rounding. */
  unframed?: boolean
}

export function ScreenFrame({
  item,
  scale = 1,
  fit = false,
  interactive = false,
  clampHeight,
  unframed = false,
}: ScreenFrameProps) {
  const surface = item.surface ?? 'app'
  const size = FRAME_SIZE[surface]
  const isAuto = size.height === 'auto'

  const { ref: contentRef, height: measuredHeight } = useContentHeight(isAuto)
  const height =
    size.height === 'auto' ? (measuredHeight ?? FALLBACK_SECTION_HEIGHT) : size.height

  const { ref: fitRef, scale: fitted } = useFitScale(size.width, CHROME_WIDTH[surface], fit)
  const applied = fit ? fitted : scale

  const screen = (
    <ScaledScreen
      html={item.html}
      width={size.width}
      height={height}
      scale={applied}
      interactive={interactive}
      clampHeight={clampHeight}
      contentRef={isAuto ? contentRef : undefined}
      isSiteOrSection={!unframed && (surface === 'site' || surface === 'section')}
    />
  )
  const framed = (!unframed && surface === 'app') ? <PhoneFrame>{screen}</PhoneFrame> : screen

  // The ref must sit on a full-width box for the measurement to be meaningful.
  return (
    <div ref={fitRef} className="flex w-full justify-center">
      {applied > 0 && framed}
    </div>
  )
}

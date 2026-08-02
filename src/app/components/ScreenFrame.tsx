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
  surface = 'app',
}: {
  html: string
  width: number
  height: number
  scale: number
  interactive: boolean
  clampHeight?: number
  contentRef?: React.Ref<HTMLDivElement>
  isSiteOrSection?: boolean
  surface?: Surface
}) {
  const visibleHeight = clampHeight ? Math.min(height, clampHeight) : height

  return (
    <div
      style={{ width: width * scale, height: visibleHeight * scale }}
      className={`overflow-hidden bg-white dark:bg-neutral-950 ${
        isSiteOrSection ? 'rounded-xl border border-gray-200 dark:border-white/10' : ''
      }`}
    >
      <div
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className="relative overflow-hidden"
      >
        <div
          ref={contentRef}
          className={interactive ? undefined : 'pointer-events-none select-none'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {surface === 'app' && (
          <>
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-6 pb-1 pt-3.5">
              <span className="text-[13px] font-semibold text-foreground dark:text-gray-100">9:41</span>
              <div className="flex items-center gap-1.5 text-foreground dark:text-gray-100">
                <svg className="h-3 w-4" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2" width="3" height="10" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" opacity="0.35" /></svg>
                <svg className="h-3 w-4" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1 4.5a10 10 0 0114 0M3.5 7.5a6.5 6.5 0 019 0M7 10.5l1 1 1-1" /></svg>
                <svg className="h-3 w-6" viewBox="0 0 26 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="15" height="8" rx="1.5" fill="currentColor" /><path d="M23 4v4a2.5 2.5 0 000-4z" fill="currentColor" opacity="0.5" /></svg>
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-2 pt-1">
              <span className="h-1 w-32 rounded-full bg-gray-900/80 dark:bg-white/60"></span>
            </div>
          </>
        )}
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
      surface={surface}
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

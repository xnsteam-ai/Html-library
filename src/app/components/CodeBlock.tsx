import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { createHighlighter, type Highlighter } from 'shiki'
import { useCopy } from '../hooks/useCopy'

// ---------------------------------------------------------------------------
// Shiki singleton — created once, reused for every CodeBlock on the page.
// ---------------------------------------------------------------------------
let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark-dimmed', 'github-light'],
      langs: ['html', 'bash', 'text'],
    })
  }
  return highlighterPromise
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CodeBlockProps {
  code: string
  language?: 'html' | 'bash' | 'text'
  filename?: string
  /** Tailwind max-height utility for the scroll area. */
  maxHeight?: string
  /**
   * What the Copy button actually places on the clipboard, if different from
   * the displayed `code` — e.g. a standalone document (Tailwind CDN + doctype)
   * for a bare registry fragment, so it renders correctly in any online HTML
   * previewer instead of showing unstyled markup.
   */
  copyCode?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CodeBlock({ code, language = 'html', filename, maxHeight, copyCode }: CodeBlockProps) {
  const { copied, copy } = useCopy()
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((hl) => {
      if (cancelled) return
      const out = hl.codeToHtml(code, {
        lang: language === 'text' ? 'text' : language,
        themes: {
          dark: 'github-dark-dimmed',
          light: 'github-light',
        },
        defaultColor: false,
      })
      setHtml(out)
    })
    return () => { cancelled = true }
  }, [code, language])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      {/* Header bar — original theme colors */}
      <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-1.5 dark:bg-[#0a0a0a]">
        <span className="font-mono text-[11px] text-muted-foreground">
          {filename ?? (language === 'bash' ? 'terminal' : language)}
        </span>
        <button
          type="button"
          onClick={() => copy(copyCode ?? code)}
          title={copyCode ? 'Copies a standalone HTML file — Tailwind included — that previews correctly anywhere' : undefined}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-subtle hover:text-foreground"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code area — Shiki syntax colours, app background */}
      <div className={`scrollbar-thin overflow-auto bg-background ${maxHeight ?? 'max-h-[600px]'}`}>
        {html ? (
          <div
            className="shiki-wrap text-[13px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="px-5 py-4 font-mono text-[13px] leading-relaxed text-[#adbac7] opacity-40">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  )
}

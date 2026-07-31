import { useMemo } from 'react'
import { Check, Copy } from 'lucide-react'
import { useCopy } from '../hooks/useCopy'

type Token = { text: string; className: string }

const TAG = 'text-sky-700 dark:text-sky-300'
const ATTR = 'text-violet-700 dark:text-violet-300'
const VALUE = 'text-emerald-700 dark:text-emerald-300'
const COMMENT = 'text-gray-400 dark:text-gray-500'
const PLAIN = 'text-gray-700 dark:text-gray-300'

/**
 * Tiny HTML tokenizer — enough colour for copy-paste snippets without pulling
 * in a syntax-highlighting dependency.
 */
function tokenizeHtml(code: string): Token[] {
  const tokens: Token[] = []
  const pattern = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(code))) {
    if (match.index > cursor) {
      tokens.push({ text: code.slice(cursor, match.index), className: PLAIN })
    }
    const chunk = match[0]

    if (chunk.startsWith('<!--')) {
      tokens.push({ text: chunk, className: COMMENT })
    } else {
      const inner = /^(<\/?)([A-Za-z][\w-]*)([\s\S]*?)(\/?>)$/.exec(chunk)
      if (!inner) {
        tokens.push({ text: chunk, className: PLAIN })
      } else {
        const [, open, tagName, attrs, close] = inner
        tokens.push({ text: open + tagName, className: TAG })

        const attrPattern = /([\w:@-]+)(\s*=\s*)("[^"]*"|'[^']*')|(\s+)|([^\s]+)/g
        let attrMatch: RegExpExecArray | null
        while ((attrMatch = attrPattern.exec(attrs))) {
          const [full, name, equals, value, space, other] = attrMatch
          if (name) {
            tokens.push({ text: name, className: ATTR })
            tokens.push({ text: equals, className: PLAIN })
            tokens.push({ text: value, className: VALUE })
          } else {
            tokens.push({ text: space ?? other ?? full, className: PLAIN })
          }
        }
        tokens.push({ text: close, className: TAG })
      }
    }
    cursor = match.index + chunk.length
  }

  if (cursor < code.length) tokens.push({ text: code.slice(cursor), className: PLAIN })
  return tokens
}

interface CodeBlockProps {
  code: string
  language?: 'html' | 'bash' | 'text'
  filename?: string
  /** Tailwind max-height utility for the scroll area. */
  maxHeight?: string
}

export function CodeBlock({ code, language = 'html', filename, maxHeight }: CodeBlockProps) {
  const { copied, copy } = useCopy()
  const tokens = useMemo(
    () => (language === 'html' ? tokenizeHtml(code) : [{ text: code, className: PLAIN }]),
    [code, language],
  )

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-1.5">
        <span className="font-mono text-[11px] text-muted-foreground">
          {filename ?? (language === 'bash' ? 'terminal' : language)}
        </span>
        <button
          type="button"
          onClick={() => copy(code)}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-subtle hover:text-foreground"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        className={`scrollbar-thin overflow-auto px-3.5 py-3 font-mono text-[12.5px] leading-relaxed ${maxHeight ?? 'max-h-[520px]'}`}
      >
        <code>
          {tokens.map((token, index) => (
            <span key={index} className={token.className}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

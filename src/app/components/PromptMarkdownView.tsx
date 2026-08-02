import { Check, Copy } from 'lucide-react'
import type { RegistryItem } from '../../registry'
import { useCopy } from '../hooks/useCopy'
import { buildPromptTemplate, hasPromptSpec } from '../lib/imagePrompt'

export function getPromptText(item: RegistryItem): string {
  return buildPromptTemplate(item)
}

/**
 * Renders the template as styled sections for reading, while Copy hands over
 * the exact text `buildPromptTemplate` produced — what you see and what you
 * paste into an image model are the same string.
 */
function Rendered({ text }: { text: string }) {
  const blocks: React.ReactNode[] = []
  let fields: string[] = []

  const flushFields = (key: string) => {
    if (!fields.length) return
    const current = fields
    blocks.push(
      <dl key={key} className="mb-4 grid gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,14rem)_1fr]">
        {current.map((field, index) => {
          const separator = field.indexOf(':')
          const label = separator === -1 ? field.slice(2) : field.slice(2, separator)
          const value = separator === -1 ? '' : field.slice(separator + 1).trim()
          return (
            <div key={index} className="contents">
              <dt className="text-[13px] font-medium text-muted-foreground">{label}</dt>
              <dd className="mb-1.5 text-[13.5px] text-foreground sm:mb-0">{value}</dd>
            </div>
          )
        })}
      </dl>,
    )
    fields = []
  }

  text.split('\n').forEach((raw, index) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    if (trimmed.startsWith('### ')) {
      flushFields(`fields-${index}`)
      blocks.push(
        <h3
          key={index}
          className="mb-2 mt-6 border-b border-border pb-1.5 font-mono text-[12px] font-semibold uppercase tracking-wider text-foreground first:mt-0"
        >
          {trimmed.slice(4)}
        </h3>,
      )
      return
    }

    if (trimmed.startsWith('- ')) {
      fields.push(trimmed)
      return
    }

    flushFields(`fields-${index}`)
    if (trimmed === '---') {
      blocks.push(<hr key={index} className="my-4 border-border" />)
      return
    }
    blocks.push(
      <p key={index} className="mb-3 text-[13.5px] leading-relaxed text-muted-foreground">
        {trimmed}
      </p>,
    )
  })

  flushFields('fields-final')
  return <>{blocks}</>
}

export function PromptMarkdownView({ item }: { item: RegistryItem }) {
  const { copied, copy } = useCopy()
  const promptText = buildPromptTemplate(item)
  const analysed = hasPromptSpec(item)

  return (
    <article className="mx-auto w-full rounded-xl border border-border bg-background p-6">
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="min-w-0">
          <h2 className="truncate text-[19px] font-semibold tracking-tight text-foreground">
            {item.title}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Recreation brief — swap the SUBJECT block, keep everything else.
          </p>
        </div>
        <button
          type="button"
          onClick={() => copy(promptText)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-[12px] font-medium text-foreground transition hover:bg-subtle"
        >
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          {copied ? 'Copied Prompt' : 'Copy Prompt'}
        </button>
      </div>

      {!analysed && (
        <p className="mb-4 rounded-lg border border-dashed border-border px-3 py-2 text-[12.5px] text-muted-foreground">
          This image has no shot analysis yet, so the brief below carries only the asset facts
          read from the file itself.
        </p>
      )}

      <div className="h-[500px] overflow-y-auto scrollbar-thin pr-2">
        <Rendered text={promptText} />
      </div>
    </article>
  )
}

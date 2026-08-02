import { Check, Copy } from 'lucide-react'
import type { RegistryItem } from '../../registry'
import { useCopy } from '../hooks/useCopy'

export function getPromptText(item: RegistryItem): string {
  if (item.prompt) return item.prompt
  const tagsStr = item.tags?.length ? item.tags.join(', ') : ''
  const taglineStr = item.tagline ? item.tagline.replace(/ · /g, ', ') : ''
  return `${item.description}${taglineStr ? `, ${taglineStr}` : ''}${tagsStr ? `, ${tagsStr}` : ''}`
}

export function PromptMarkdownView({ item }: { item: RegistryItem }) {
  const { copied, copy } = useCopy()
  const promptText = getPromptText(item)

  return (
    <article className="mx-auto w-full rounded-xl border border-border bg-background p-6 text-[14.5px] leading-relaxed text-foreground">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-[19px] font-semibold tracking-tight text-foreground">
          {item.title}
        </h2>
        <button
          type="button"
          onClick={() => copy(promptText)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-[12px] font-medium text-foreground transition hover:bg-subtle"
        >
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          {copied ? 'Copied Prompt' : 'Copy Prompt'}
        </button>
      </div>

      <blockquote className="my-4 select-all rounded-r-lg border-l-2 border-foreground/30 bg-muted/30 p-4 font-mono text-[14px] leading-relaxed text-foreground">
        {promptText}
      </blockquote>
    </article>
  )
}

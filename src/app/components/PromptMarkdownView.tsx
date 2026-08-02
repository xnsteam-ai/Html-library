import { useState } from 'react'
import { Check, Copy, FileText, Sparkles } from 'lucide-react'
import type { RegistryItem } from '../../registry'
import { useCopy } from '../hooks/useCopy'
import { CodeBlock } from './CodeBlock'

export function getPromptText(item: RegistryItem): string {
  if (item.prompt) return item.prompt
  const tagsStr = item.tags?.length ? item.tags.join(', ') : ''
  const taglineStr = item.tagline ? item.tagline.replace(/ · /g, ', ') : ''
  return `${item.description}${taglineStr ? `, ${taglineStr}` : ''}${tagsStr ? `, ${tagsStr}` : ''}, highly detailed, 8k resolution, professional photography.`
}

export function PromptMarkdownView({ item }: { item: RegistryItem }) {
  const { copied, copy } = useCopy()
  const promptText = getPromptText(item)
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered')

  const markdownContent = `# Image Generation Prompt

> **Prompt:**
> ${promptText}

### Specifications & Metadata
- **Title:** ${item.title}
- **Category / Style:** ${item.tagline || item.category}
- **Tags:** ${item.tags?.map((t) => `\`${t}\``).join(', ') || 'None'}

### Model Starters

#### Midjourney v6
\`\`\`bash
/imagine prompt: ${promptText} --ar 3:4 --v 6.0
\`\`\`

#### FLUX.1 / DALL-E 3
\`\`\`text
${promptText}
\`\`\`
`

  return (
    <div className="space-y-4">
      {/* Top Banner / Prompt Callout */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <Sparkles size={15} className="text-amber-500" />
            <span>AI Image Prompt</span>
          </div>
          <button
            type="button"
            onClick={() => copy(promptText)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1 text-[12px] font-medium text-foreground transition hover:bg-subtle"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {copied ? 'Copied Prompt' : 'Copy Prompt'}
          </button>
        </div>
        <p className="select-all rounded-lg border border-border/50 bg-muted/50 p-3 font-mono text-[13.5px] leading-relaxed text-foreground">
          {promptText}
        </p>
      </div>

      {/* Rendered Markdown View */}
      <div className="rounded-xl border border-border bg-background p-6">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <span className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <FileText size={14} />
            Markdown Render
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1 text-[12px]">
            <button
              type="button"
              onClick={() => setViewMode('rendered')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                viewMode === 'rendered'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Rendered
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                viewMode === 'raw'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Raw Markdown
            </button>
          </div>
        </div>

        {viewMode === 'rendered' ? (
          <article className="mx-auto w-full text-[14.5px] leading-relaxed text-foreground">
            <h1 className="mb-3 text-xl font-bold tracking-tight text-foreground">
              Image Generation Prompt
            </h1>

            <blockquote className="my-4 border-l-3 border-foreground/30 bg-muted/40 p-3.5 text-[14px] italic text-foreground rounded-r-lg">
              <strong className="not-italic font-semibold block mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                Prompt
              </strong>
              {promptText}
            </blockquote>

            <h3 className="mt-6 mb-2 text-base font-semibold text-foreground">
              Specifications & Metadata
            </h3>
            <ul className="mb-4 space-y-1.5 pl-5 list-disc text-[13.5px] text-foreground">
              <li>
                <strong className="text-foreground">Title:</strong> {item.title}
              </li>
              <li>
                <strong className="text-foreground">Category / Style:</strong>{' '}
                {item.tagline || item.category}
              </li>
              <li>
                <strong className="text-foreground">Tags:</strong>{' '}
                <span className="inline-flex flex-wrap gap-1">
                  {(item.tags ?? []).map((t) => (
                    <code
                      key={t}
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground"
                    >
                      {t}
                    </code>
                  ))}
                </span>
              </li>
            </ul>

            <h3 className="mt-6 mb-2 text-base font-semibold text-foreground">
              Model Starters
            </h3>

            <div className="space-y-3">
              <div>
                <span className="block mb-1 text-[12.5px] font-medium text-muted-foreground">
                  Midjourney v6
                </span>
                <CodeBlock
                  code={`/imagine prompt: ${promptText} --ar 3:4 --v 6.0`}
                  language="bash"
                  filename="midjourney"
                />
              </div>

              <div>
                <span className="block mb-1 text-[12.5px] font-medium text-muted-foreground">
                  FLUX.1 / DALL-E 3
                </span>
                <CodeBlock code={promptText} language="text" filename="prompt.txt" />
              </div>
            </div>
          </article>
        ) : (
          <CodeBlock code={markdownContent} language="text" filename="prompt.md" />
        )}
      </div>
    </div>
  )
}

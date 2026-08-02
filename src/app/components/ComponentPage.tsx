import { useState } from 'react'
import { Check, Code2, Copy, ExternalLink, Eye, Github } from 'lucide-react'
import {
  CATEGORY_META,
  rawRegistryUrl,
  registryUrl,
  REPO_URL,
  type RegistryItem,
} from '../../registry'
import { useCopy } from '../hooks/useCopy'
import { previewHref } from '../hooks/useHashRoute'
import { toStandaloneHtml } from '../lib/standaloneHtml'
import { CodeBlock } from './CodeBlock'
import { ScreenFrame } from './ScreenFrame'

const SURFACES: Record<string, string> = {
  plain: 'bg-background',
  muted: 'bg-neutral-100 dark:bg-neutral-900/40',
  app: 'bg-subtle',
}

function Preview({ item }: { item: RegistryItem }) {
  // Apps: phone floats directly on the page — no outer container.
  if (item.category === 'apps') {
    return (
      <div className="flex justify-center py-6">
        <ScreenFrame item={item} fit interactive />
      </div>
    )
  }

  // Sites: render centered directly with a 500px minimum height container.
  if (item.category === 'sites') {
    return (
      <div className="w-full flex items-center justify-center min-h-[500px] rounded-xl border border-border bg-white dark:bg-neutral-950 overflow-hidden p-6">
        <ScreenFrame item={item} fit interactive unframed />
      </div>
    )
  }

  return (
    <div
      className={`scrollbar-thin flex items-center justify-center overflow-auto rounded-xl border border-border p-6 dark:bg-[#0a0a0a] ${
        SURFACES[item.previewBg ?? 'plain']
      }`}
      style={{ minHeight: item.previewHeight ?? 500 }}
    >
      {/* Registry components are static HTML; Tailwind scans registry/**\/*.html
          so every utility they use exists in this stylesheet. */}
      <div className="w-full" dangerouslySetInnerHTML={{ __html: item.html }} />
    </div>
  )
}

export function ComponentPage({ item }: { item: RegistryItem }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview')
  const { copied, copy } = useCopy()

  const curl = `curl -s ${registryUrl(item.name)} \\
  | jq -r '.files[0].content' > ${item.name}.html`

  return (
    <article className="mx-auto w-full max-w-4xl px-8 py-9">
      <header className="mb-6">
        <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          {CATEGORY_META[item.category].title}
        </p>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">{item.title}</h1>
        <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">
          {item.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(item.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-0.5 text-[11.5px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          <a
            href={`${REPO_URL}/blob/main/registry/${item.category}/${item.name}/component.html`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Github size={13} />
            Source
          </a>
        </div>
      </header>

      {/* Preview / Code toggle — same pill treatment as the app shell */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex rounded-full bg-muted p-[3px]" role="tablist" aria-label="View">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'preview'}
            onClick={() => setTab('preview')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition ${
              tab === 'preview'
                ? 'bg-background text-foreground shadow-sm dark:bg-subtle'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye size={13} />
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'code'}
            onClick={() => setTab('code')}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition ${
              tab === 'code'
                ? 'bg-background text-foreground shadow-sm dark:bg-subtle'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code2 size={13} />
            Code
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={previewHref(item.name)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Open this component full screen in a new tab"
          >
            <ExternalLink size={13} />
            Open in new tab
          </a>
          <button
            type="button"
            onClick={() => copy(toStandaloneHtml(item))}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Copies a standalone HTML file — Tailwind included — that previews correctly anywhere"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy HTML'}
          </button>
        </div>
      </div>

      {tab === 'preview' ? (
        <Preview item={item} />
      ) : (
        <CodeBlock
          code={item.html}
          copyCode={toStandaloneHtml(item)}
          filename={`${item.name}.html`}
          maxHeight="max-h-[640px]"
        />
      )}

      {/* Install */}
      <section className="mt-10">
        <h2 className="text-[17px] font-semibold tracking-tight text-foreground">
          Pull it from the registry
        </h2>
        <p className="mb-3 mt-1 text-[13.5px] text-muted-foreground">
          Every component is a JSON file in this repo. Fetch it, take{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[12.5px] text-foreground">
            .files[0].content
          </code>
          , and paste it wherever Tailwind is already running.
        </p>
        <CodeBlock code={curl} language="bash" />

        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-[12.5px] font-medium text-muted-foreground transition hover:text-foreground">
            Prefer raw.githubusercontent.com?
          </summary>
          <div className="mt-2">
            <CodeBlock
              code={`curl -s ${rawRegistryUrl(item.name)} \\
  | jq -r '.files[0].content' > ${item.name}.html`}
              language="bash"
            />
          </div>
        </details>
      </section>
    </article>
  )
}

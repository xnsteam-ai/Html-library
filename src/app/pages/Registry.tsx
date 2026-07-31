import { components, PAGES_URL, RAW_URL, REPO_URL } from '../../registry'
import { CodeBlock } from '../components/CodeBlock'
import { Callout, Code, DocPage, List, P, Section } from '../components/Prose'

const ITEM_SHAPE = `{
  "$schema": "${PAGES_URL}/r/schema.json",
  "name": "agent-chat",
  "title": "Agent Chat",
  "description": "A complete conversation shell…",
  "category": "agent",
  "type": "html",
  "version": "0.1.0",
  "tailwind": "^4.0.0",
  "tags": ["chat", "shell", "conversation"],
  "files": [
    { "path": "agent-chat.html", "type": "html", "content": "<div …>" }
  ]
}`

const INDEX_SHAPE = `{
  "name": "html-library",
  "version": "0.1.0",
  "homepage": "${PAGES_URL}",
  "baseUrl": "${PAGES_URL}/r",
  "rawBaseUrl": "${RAW_URL}",
  "categories": [
    { "name": "agent", "title": "Agent Elements", "count": 19 },
    { "name": "ui",    "title": "UI Elements",    "count": 8 }
  ],
  "items": [
    { "name": "agent-chat", "title": "Agent Chat", "category": "agent",
      "url": "${PAGES_URL}/r/agent-chat.json",
      "rawUrl": "${RAW_URL}/agent-chat.json" }
  ]
}`

export function RegistryDoc() {
  return (
    <DocPage
      eyebrow="Docs"
      title="Registry"
      lede="GitHub is the registry. Components are generated into JSON, committed to the repo, and served from two hosts."
    >
      <Section title="How it fits together">
        <List
          items={[
            <>
              <Code>registry/&lt;category&gt;/&lt;name&gt;/</Code> is the source of truth — one{' '}
              <Code>component.html</Code> and one <Code>meta.json</Code> per component.
            </>,
            <>
              <Code>npm run build:registry</Code> validates every component and writes{' '}
              <Code>public/r/&lt;name&gt;.json</Code> plus <Code>public/r/index.json</Code>.
            </>,
            <>
              The generated JSON is committed, so <Code>raw.githubusercontent.com</Code> serves the
              registry with no infrastructure at all.
            </>,
            <>
              CI deploys the same files to GitHub Pages under <Code>/r/</Code>, and fails the build
              if the committed output is stale.
            </>,
          ]}
        />
      </Section>

      <Section title="URLs">
        <CodeBlock
          language="bash"
          code={`# index — every component with its URL
${PAGES_URL}/r/index.json
${RAW_URL}/index.json

# a single component
${PAGES_URL}/r/agent-chat.json
${RAW_URL}/agent-chat.json`}
        />
        <Callout>
          Pages is canonical and CDN-cached. The raw URLs are the fallback: they work the moment the
          repo is public, even before Pages is enabled.
        </Callout>
      </Section>

      <Section title="Item shape">
        <P>
          One component, one file. <Code>files[0].content</Code> is the complete markup — that is
          the only field you need.
        </P>
        <CodeBlock code={ITEM_SHAPE} language="text" filename="agent-chat.json" />
      </Section>

      <Section title="Index shape">
        <CodeBlock code={INDEX_SHAPE} language="text" filename="index.json" />
      </Section>

      <Section title="Add your own component">
        <P>
          The docs site reads <Code>registry/</Code> directly, so a new folder shows up in the
          sidebar as soon as you save it — no wiring, no manifest to update.
        </P>
        <CodeBlock
          language="bash"
          code={`mkdir -p registry/ui/tooltip
$EDITOR registry/ui/tooltip/component.html
$EDITOR registry/ui/tooltip/meta.json

npm run dev              # it appears under UI Elements
npm run build:registry   # regenerate public/r, then commit both`}
        />
        <P>
          <Code>meta.json</Code> takes <Code>name</Code> (must equal the folder), <Code>title</Code>,{' '}
          <Code>description</Code>, <Code>category</Code>, and optionally <Code>order</Code>,{' '}
          <Code>tags</Code>, <Code>previewBg</Code> and <Code>previewHeight</Code>.
        </P>
      </Section>

      <Section title="What the validator rejects">
        <List
          items={[
            <>
              a <Code>&lt;script&gt;</Code> tag, <Code>&lt;link&gt;</Code>, <Code>&lt;iframe&gt;</Code>{' '}
              or <Code>@import</Code> — components must be self-contained
            </>,
            <>
              <Code>className</Code> — these are HTML files, not JSX
            </>,
            <>a name that disagrees with its folder, or a duplicate name</>,
            <>an unknown category, or a missing required field in <Code>meta.json</Code></>,
          ]}
        />
        <P>
          Remote images and scoped <Code>&lt;style&gt;</Code> blocks are warned about, not blocked —
          keyframes have nowhere else to live. Today the registry ships {components.length}{' '}
          components and exactly one style block.
        </P>
        <P>
          The full contributing guide lives in{' '}
          <a
            href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            CONTRIBUTING.md
          </a>
          .
        </P>
      </Section>
    </DocPage>
  )
}

import { components, PAGES_URL, RAW_URL, REPO_URL } from '../../registry'
import { CodeBlock } from '../components/CodeBlock'
import { Callout, Code, DocPage, List, P, Section } from '../components/Prose'

export function Installation() {
  return (
    <DocPage
      eyebrow="Docs"
      title="Installation"
      lede="There is nothing to install. You need Tailwind CSS v4 in your project, and a way to fetch a file."
    >
      <Section title="1. Have Tailwind v4 running">
        <P>
          Components use stock Tailwind v4 utilities and the default palette. If your project
          already has Tailwind, skip ahead. Otherwise:
        </P>
        <CodeBlock
          language="bash"
          code={`npm install tailwindcss @tailwindcss/vite

# src/styles.css
@import "tailwindcss";`}
        />
      </Section>

      <Section title="2. Take a component">
        <P>
          Copy it from the page you are looking at, or pull it from the registry. Both give you the
          same markup.
        </P>
        <CodeBlock
          language="bash"
          code={`# Pages (canonical)
curl -s ${PAGES_URL}/r/agent-chat.json \\
  | jq -r '.files[0].content' > agent-chat.html

# raw.githubusercontent.com (fallback, no Pages needed)
curl -s ${RAW_URL}/agent-chat.json \\
  | jq -r '.files[0].content' > agent-chat.html`}
        />
        <P>
          Without <Code>jq</Code>, fetch the JSON and read <Code>.files[0].content</Code> with
          whatever you have — <Code>node -e</Code>, Python, or your editor.
        </P>
      </Section>

      <Section title="3. Make sure Tailwind scans it">
        <P>
          If you drop <Code>.html</Code> files somewhere Tailwind is not already looking, add a
          source directive. This is the one step people miss — utilities that are never scanned are
          never generated, and the component renders unstyled.
        </P>
        <CodeBlock language="bash" code={`@source "./components/**/*.html";`} />
        <Callout>
          This repo does exactly that: <Code>src/styles/tailwind.css</Code> declares{' '}
          <Code>@source '../../registry/**/*.html'</Code> so the live previews on this site work.
        </Callout>
      </Section>

      <Section title="Fetch the whole set">
        <P>
          The index lists all {components.length} components with their URLs, so scripting a bulk
          copy is a one-liner.
        </P>
        <CodeBlock
          language="bash"
          code={`curl -s ${PAGES_URL}/r/index.json \\
  | jq -r '.items[] | .url' \\
  | xargs -I{} sh -c 'curl -s {} | jq -r ".files[0].content" > "$(basename {} .json).html"'`}
        />
      </Section>

      <Section title="Run the docs locally">
        <P>Clone the repo if you want to browse offline or contribute a component.</P>
        <CodeBlock
          language="bash"
          code={`git clone ${REPO_URL}.git
cd html-library
npm install
npm run dev            # docs at http://localhost:5173
npm run build:registry # regenerate public/r after editing registry/`}
        />
        <List
          items={[
            <>
              <Code>registry/&lt;category&gt;/&lt;name&gt;/component.html</Code> — the component
              itself.
            </>,
            <>
              <Code>registry/&lt;category&gt;/&lt;name&gt;/meta.json</Code> — title, description,
              tags, preview settings.
            </>,
            <>
              <Code>public/r/</Code> — generated, committed. Never edit it by hand.
            </>,
          ]}
        />
      </Section>
    </DocPage>
  )
}

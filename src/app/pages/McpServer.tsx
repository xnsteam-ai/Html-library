import { components, PAGES_URL, REPO_URL } from '../../registry'
import { CodeBlock } from '../components/CodeBlock'
import { CodeTabs } from '../components/CodeTabs'
import { Callout, Code, DocPage, List, P, Section, Table } from '../components/Prose'

// Counted from the registry rather than hard-coded, so the numbers on this page
// can never disagree with what the server actually reports.
const APP_TOKEN_RE =
  /(?:^|[\s"'])(?:[a-z-]+:)*(?:text|bg|border|ring|fill|stroke|divide|placeholder|from|to|via|shadow|outline|accent|caret|decoration)-(?:foreground|muted-foreground|accent-foreground|background|muted|subtle|border|primary|primary-foreground)(?![a-z0-9-])/

const TOTAL = components.length
const NEEDS_SUBSTITUTION = components.filter((item) => APP_TOKEN_RE.test(item.html)).length

const NPX_CONFIG = `{
  "mcpServers": {
    "html-library": {
      "command": "npx",
      "args": ["-y", "html-library-mcp"]
    }
  }
}`

const DESKTOP_CONFIG = `{
  "mcpServers": {
    "html-library": {
      "command": "npx",
      "args": ["-y", "html-library-mcp"],
      "env": { "HTML_LIBRARY_SOURCE": "remote" }
    }
  }
}`

const LOCAL_CONFIG = `{
  "mcpServers": {
    "html-library": {
      "command": "node",
      "args": ["packages/mcp-server/bin/html-library-mcp.mjs"],
      "env": { "HTML_LIBRARY_SOURCE": "local" }
    }
  }
}`

const PORTABILITY_EXAMPLE = `{
  "portable": false,
  "appTokens": ["background", "muted-foreground"],
  "substitutions": [
    { "from": "bg-background",        "to": "bg-white dark:bg-neutral-950" },
    { "from": "text-muted-foreground", "to": "text-neutral-500 dark:text-neutral-400" }
  ],
  "fixedHtml": "<div class=\\"bg-white dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400\\">",
  "fixedIsPortable": true
}`

const TOOL_GROUPS: { group: string; tools: [string, string][] }[] = [
  {
    group: 'Discovery',
    tools: [
      ['list_components', 'List by category, surface or tag, paginated.'],
      ['search_components', 'Search names, titles, descriptions and tags.'],
      ['get_categories', 'Counts, what each category is for, and the canvas each surface draws at.'],
    ],
  },
  {
    group: 'Retrieval',
    tools: [
      ['get_component', 'One component in full — metadata, markup, portability, image prompt.'],
      ['get_component_markup', 'Just the HTML, for up to 20 components at once.'],
    ],
  },
  {
    group: 'Portability',
    tools: [
      ['check_portability', 'Scan markup for app-only tokens and return corrected HTML.'],
      ['get_component_portability', 'Is this component safe to paste elsewhere, without fetching it.'],
      ['lint_html', 'Validate your own fragment against registry conventions.'],
    ],
  },
  {
    group: 'Composition',
    tools: [
      ['recommend_components', 'Plain-language need to the components to reach for.'],
      ['get_recipe', 'Nesting order for a known pattern, and what already contains what.'],
      ['get_interactivity_pattern', 'The CSS-only mechanism for tabs, toggles, dropdowns, dismiss, row-select.'],
    ],
  },
  {
    group: 'Images',
    tools: [['get_image_prompt', 'The seven-block recreation brief, including exact framing geometry.']],
  },
]

export function McpServer() {
  return (
    <DocPage
      eyebrow="Docs"
      title="MCP Server"
      lede="Query the registry live from your editor — twelve tools for finding components, pulling their markup, and checking that what you paste will actually render."
    >
      <Section title="Introduction">
        <P>
          The HTML Library MCP server exposes all {TOTAL} components over the Model Context
          Protocol. Your assistant can search the registry, pull markup, ask which component fits a
          need, and — the part no static file can do — check markup for classes that will break
          outside this app and get back a corrected version.
        </P>
        <P>
          It runs over stdio and works with Claude Code, Cursor, Claude Desktop, and any other MCP
          client. Nothing about it is React-specific: the components it serves are plain HTML, and
          so is everything it hands back.
        </P>
      </Section>

      <Section title="Prerequisites">
        <P>
          Node 18.17 or newer. That is the whole list — there is no project config to scaffold, no{' '}
          <Code>init</Code> command to run, and nothing to add to your dependencies. The server
          reads a public registry, so there is no key or account either.
        </P>
      </Section>

      <Section title="Configuring MCP">
        <P>
          Add the server to your client's MCP config. Pick your client below; each block is the
          complete file.
        </P>
        <CodeTabs
          tabs={[
            {
              label: 'Claude Code',
              filename: '.mcp.json',
              code: NPX_CONFIG,
              note: 'Project-scoped. Drop this at the root of the project you are working in.',
            },
            {
              label: 'Cursor',
              filename: '.cursor/mcp.json',
              code: NPX_CONFIG,
              note: 'Use ~/.cursor/mcp.json instead to enable it for every project.',
            },
            {
              label: 'Claude Desktop',
              filename: 'claude_desktop_config.json',
              code: DESKTOP_CONFIG,
              note: 'Desktop launches with an unrelated working directory, so the source is pinned explicitly.',
            },
            {
              label: 'From a clone',
              filename: '.mcp.json',
              code: LOCAL_CONFIG,
              note: 'Working inside this repo. Run npm run build:mcp first — this repo already ships this file.',
            },
          ]}
        />
        <Callout>
          The package is not on npm yet, so the <Code>npx</Code> blocks will not resolve until it is
          published. Until then use the <strong className="font-medium text-foreground">From a clone</strong>{' '}
          tab, or point <Code>args</Code> at the absolute path of{' '}
          <Code>packages/mcp-server/bin/html-library-mcp.mjs</Code>.
        </Callout>
        <P>
          In Claude Code, run <Code>/mcp</Code> to confirm the server connected and to see the tools
          it registered.
        </P>
      </Section>

      <Section title="Try it">
        <P>Once connected, ask for things in plain language. The server does the lookup.</P>
        <List
          items={[
            <>“What components are available for building a pricing page?”</>,
            <>“Build me a chat interface using the agent elements.”</>,
            <>“Show me every loading state in the registry.”</>,
            <>
              “Get the markup for <Code>table-interactive</Code> and make sure it will work in my
              project.”
            </>,
            <>“Which component should I use for a settings screen with toggles?”</>,
            <>
              “Give me the image prompt for <Code>image-sunlit-portrait</Code>.”
            </>,
          ]}
        />
      </Section>

      <Section title="Tools">
        <P>
          Twelve tools in five groups. Discovery and retrieval are what you would expect; the rest
          exist because this registry has constraints a React library does not.
        </P>
        <Table
          headers={['Group', 'Tool', 'What it does']}
          rows={TOOL_GROUPS.flatMap((entry) =>
            entry.tools.map(([name, description], index) => [
              index === 0 ? <span className="font-medium text-foreground">{entry.group}</span> : '',
              <Code>{name}</Code>,
              description,
            ]),
          )}
        />
      </Section>

      <Section title="Why check_portability exists">
        <P>
          Two class vocabularies live in this registry. Most components use literal Tailwind and
          paste anywhere. <strong className="font-medium text-foreground">{NEEDS_SUBSTITUTION} of
          the {TOTAL}</strong> use theme tokens like <Code>text-muted-foreground</Code> that resolve
          only inside this docs app. Paste one of those into your project and the text renders
          invisible — with no error to tell you why.
        </P>
        <P>
          Hand the tool some markup and it finds them, then hands back a fixed version. Each
          replacement carries its own <Code>dark:</Code> variant, so the result is correct in both
          themes.
        </P>
        <CodeBlock
          language="json"
          filename='check_portability — input: <div class="bg-background text-muted-foreground">'
          code={PORTABILITY_EXAMPLE}
        />
        <P>
          This has no equivalent in other component-registry MCP servers, because JSX has no
          app-scoped-class problem to solve. It is the single most common way generated markup from
          this library goes wrong.
        </P>
      </Section>

      <Section title="Where the data comes from">
        <P>
          The server picks a source automatically and prints which one it chose to stderr at
          startup. Both modes return identical results.
        </P>
        <Table
          headers={['Mode', 'When', 'Behaviour']}
          rows={[
            [
              <Code>local</Code>,
              <>
                a <Code>registry/</Code> folder is found in the working directory or up to three
                levels above
              </>,
              'Reads from disk — instant, and reflects uncommitted edits.',
            ],
            [
              <Code>remote</Code>,
              'otherwise',
              <>
                Fetches the published registry over HTTPS, retrying{' '}
                <Code>raw.githubusercontent.com</Code> if Pages fails.
              </>,
            ],
          ]}
        />
        <P>Override the choice with either environment variable:</P>
        <CodeBlock
          language="bash"
          code={`HTML_LIBRARY_SOURCE=local|remote      # skip auto-detection
HTML_LIBRARY_REGISTRY_DIR=<path>      # use a specific registry/ folder`}
        />
      </Section>

      <Section title="MCP server or skill?">
        <P>
          Both teach an assistant this library. They are not alternatives so much as different
          delivery mechanisms — plenty of people use both.
        </P>
        <Table
          headers={['', 'Skill', 'MCP server']}
          rows={[
            ['Setup', 'One curl, one file', 'A config block, runs a process'],
            ['Works offline', 'Yes', 'Only in local mode'],
            ['Freshness', 'As of the file you downloaded', 'Always current'],
            ['Queries', 'The model reads and filters itself', 'Structured, filtered server-side'],
            ['Can check your markup', 'No — it can only describe the rules', 'Yes — check_portability, lint_html'],
            ['Any client', 'Anything that reads a file or URL', 'MCP clients only'],
          ]}
        />
        <P>
          Reach for the <a
            href="#/skills"
            className="font-medium text-foreground underline underline-offset-2"
          >
            skill
          </a>{' '}
          when you want zero moving parts or your assistant cannot run a server. Reach for the MCP
          server when you are building against the library repeatedly and want it to answer
          questions rather than recite a file.
        </P>
      </Section>

      <Section title="Best practices">
        <List
          items={[
            <>
              <strong className="font-medium text-foreground">
                Run check_portability on anything you paste.
              </strong>{' '}
              It is one call and it catches the failure that produces invisible text.
            </>,
            <>
              <strong className="font-medium text-foreground">Ask before you search.</strong>{' '}
              <Code>recommend_components</Code> maps a goal to components; reach for{' '}
              <Code>search_components</Code> once you know the vocabulary.
            </>,
            <>
              <strong className="font-medium text-foreground">Do not double-nest.</strong>{' '}
              <Code>get_recipe</Code> tells you what a component already contains — if you pasted{' '}
              <Code>agent-chat</Code>, you do not also paste <Code>input-bar</Code>.
            </>,
            <>
              <strong className="font-medium text-foreground">Never add JavaScript.</strong> If an
              interaction looks like it needs a script, call{' '}
              <Code>get_interactivity_pattern</Code> — the CSS-only mechanism already exists, and
              deleting the hidden input is what breaks it.
            </>,
            <>
              <strong className="font-medium text-foreground">
                Re-namespace ids on a second copy.
              </strong>{' '}
              CSS-only state is keyed on <Code>id</Code> and <Code>for</Code>, so two copies of the
              same component cross-talk until you rename them.
            </>,
          ]}
        />
      </Section>

      <Section title="Development">
        <P>
          The server lives in this repo as an npm workspace. From the root:
        </P>
        <CodeBlock
          language="bash"
          code={`npm run build:mcp     # sync the shared core, compile TypeScript
npm run verify:mcp    # staleness check, typecheck, tests against the real registry`}
        />
        <P>
          Registry logic is shared with the build scripts rather than copied — the portability rules
          have exactly one definition, in <Code>scripts/lib/registry-data.mjs</Code>, and CI fails if
          the server's vendored copy drifts from it. Source is at{' '}
          <a
            href={`${REPO_URL}/tree/main/packages/mcp-server`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            packages/mcp-server
          </a>
          , and the registry it reads is at{' '}
          <a
            href={`${PAGES_URL}/r/index.json`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            /r/index.json
          </a>
          .
        </P>
      </Section>
    </DocPage>
  )
}

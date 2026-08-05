import { components } from '../../registry'
import { CodeBlock } from '../components/CodeBlock'
import { CodeTabs } from '../components/CodeTabs'
import { Callout, Code, DocPage, List, P, Section, Table } from '../components/Prose'

// Counted from the registry rather than hard-coded, so the numbers on this page
// can never disagree with what the server actually reports.
const APP_TOKEN_RE =
  /(?:^|[\s"'])(?:[a-z-]+:)*(?:text|bg|border|ring|fill|stroke|divide|placeholder|from|to|via|shadow|outline|accent|caret|decoration)-(?:foreground|muted-foreground|accent-foreground|background|muted|subtle|border|primary|primary-foreground)(?![a-z0-9-])/

const TOTAL = components.length
const NEEDS_SUBSTITUTION = components.filter((item) => APP_TOKEN_RE.test(item.html)).length

const MCP_HTTP_URL = 'https://html-library-mcp.fly.dev/mcp'

const CLAUDE_CODE_CLI = `claude mcp add --transport http html-library ${MCP_HTTP_URL}`

const MCP_CONFIG_URL = `{
  "mcpServers": {
    "html-library": {
      "url": "${MCP_HTTP_URL}"
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
    group: 'Guide',
    tools: [
      ['get_design_guide', 'Palette, type scale, radius rhythm, dark-mode strategy.'],
      ['get_category_guide', 'How one category — apps, sites, agent or ui — behaves.'],
    ],
  },
  {
    group: 'Discovery',
    tools: [
      ['list_components', 'List by category, surface or tag, paginated.'],
      ['search_components', 'Search names, titles, descriptions and tags.'],
      ['get_categories', 'Counts and what each category is for.'],
    ],
  },
  {
    group: 'Retrieval',
    tools: [
      ['get_component', 'One component in full — markup, portability, image prompt.'],
      ['get_component_markup', 'Just the HTML, for up to 20 components at once.'],
    ],
  },
  {
    group: 'Portability',
    tools: [
      ['check_portability', 'Scan markup for app-only tokens and return corrected HTML.'],
      ['get_component_portability', 'Is this component safe to paste elsewhere.'],
      ['lint_html', 'Validate your own fragment against registry conventions.'],
    ],
  },
  {
    group: 'Composition',
    tools: [
      ['recommend_components', 'Plain-language need to the components to reach for.'],
      ['get_recipe', 'Nesting order for a known pattern.'],
      ['get_interactivity_pattern', 'The CSS-only mechanism for tabs, toggles, dropdowns.'],
    ],
  },
  {
    group: 'Images',
    tools: [['get_image_prompt', 'The seven-block recreation brief.']],
  },
]

export function McpServer() {
  return (
    <DocPage
      eyebrow="Docs"
      title="MCP Server"
      lede="Query the registry live from your editor. Hosted — one URL, nothing to install."
    >
      <Section title="Connect">
        <P>
          No account, no API key, no local process to run. Point any MCP client at this URL:
        </P>
        <CodeBlock language="text" filename="server URL" code={MCP_HTTP_URL} />
        <Callout>
          <strong className="font-medium text-foreground">Claude Desktop</strong> — Settings →
          Connectors → Add custom connector, paste the URL above. Done.
        </Callout>
        <CodeTabs
          tabs={[
            {
              label: 'Claude Code',
              filename: 'terminal',
              code: CLAUDE_CODE_CLI,
              language: 'bash',
              note: 'Then /mcp to confirm it connected.',
            },
            {
              label: 'Others',
              filename: 'mcp.json',
              code: MCP_CONFIG_URL,
              note: 'Cursor, Windsurf, VS Code, Zed — any client that takes a url field.',
            },
          ]}
        />
      </Section>

      <Section title="Try it">
        <P>Ask for things in plain language. The server does the lookup.</P>
        <List
          items={[
            <>“What components are available for building a pricing page?”</>,
            <>“Build me a chat interface using the agent elements.”</>,
            <>
              “Get the markup for <Code>table-interactive</Code> and make sure it will work in my
              project.”
            </>,
            <>“Which component should I use for a settings screen with toggles?”</>,
          ]}
        />
      </Section>

      <Section title="Tools">
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
          <strong className="font-medium text-foreground">{NEEDS_SUBSTITUTION} of the {TOTAL}</strong>{' '}
          components use theme tokens like <Code>text-muted-foreground</Code> that only resolve
          inside this docs app — paste one elsewhere and the text renders invisible. This tool
          finds them and hands back fixed markup, each replacement carrying its own{' '}
          <Code>dark:</Code> variant.
        </P>
        <CodeBlock
          language="json"
          filename='check_portability — input: <div class="bg-background text-muted-foreground">'
          code={PORTABILITY_EXAMPLE}
        />
      </Section>

      <Section title="MCP server or skill?">
        <Table
          headers={['', 'Skill', 'MCP server']}
          rows={[
            ['Setup', 'One curl, one file', 'Paste a URL'],
            ['Freshness', 'As of the file you downloaded', 'Always current'],
            ['Can check your markup', 'No', 'Yes — check_portability, lint_html'],
          ]}
        />
        <P>
          Reach for the{' '}
          <a
            href="#/skills"
            className="font-medium text-foreground underline underline-offset-2"
          >
            skill
          </a>{' '}
          when your assistant can't run a server. Reach for the MCP server for structured,
          filtered answers instead of a file to read.
        </P>
      </Section>

      <Section title="Best practices">
        <List
          items={[
            <>
              <strong className="font-medium text-foreground">
                Run check_portability on anything you paste.
              </strong>{' '}
              It catches the failure that produces invisible text.
            </>,
            <>
              <strong className="font-medium text-foreground">Never add JavaScript.</strong> Call{' '}
              <Code>get_interactivity_pattern</Code> — the CSS-only mechanism already exists.
            </>,
            <>
              <strong className="font-medium text-foreground">
                Re-namespace ids on a second copy.
              </strong>{' '}
              CSS-only state is keyed on <Code>id</Code> and <Code>for</Code>.
            </>,
          ]}
        />
      </Section>
    </DocPage>
  )
}

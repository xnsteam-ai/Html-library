import { components, PAGES_URL, REPO_URL } from '../../registry'
import { CodeBlock } from '../components/CodeBlock'
import { Callout, Code, DocPage, List, P, Section } from '../components/Prose'

// Classes that only resolve inside this app's own `@theme` block. Counted here
// rather than hard-coded so the number on the page always matches the registry.
const APP_TOKEN_RE =
  /(?:^|[\s"'])(?:[a-z-]+:)*(?:text|bg|border|ring|fill|stroke|divide|placeholder|from|to|via|shadow|outline|accent|caret|decoration)-(?:foreground|muted-foreground|accent-foreground|background|muted|subtle|border|primary|primary-foreground)(?![a-z0-9-])/

const TOTAL = components.length
const NEEDS_SUBSTITUTION = components.filter((item) => APP_TOKEN_RE.test(item.html)).length
const PORTABLE = TOTAL - NEEDS_SUBSTITUTION

const SKILL_URL = `${PAGES_URL}/skill.md`

const CLAUDE_CODE = `mkdir -p .claude/skills/html-library
curl -sL ${SKILL_URL} \\
  -o .claude/skills/html-library/SKILL.md`

const CURSOR = `mkdir -p .cursor/rules
curl -sL ${SKILL_URL} \\
  -o .cursor/rules/html-library.mdc`

const GENERIC = `# Copilot, Windsurf, Cline, Aider, Zed — all read AGENTS.md
curl -sL ${SKILL_URL} -o AGENTS.md

# …or keep your own AGENTS.md and point at the hosted copy
echo "See ${SKILL_URL} for the HTML Library component registry." >> AGENTS.md`

const NO_INSTALL = `# Any assistant that can fetch a URL needs no install at all
curl -s ${PAGES_URL}/llms.txt     # short index, every component + description
curl -s ${SKILL_URL}              # the full skill, one file`

export function Skills() {
  return (
    <DocPage
      eyebrow="Docs"
      title="Skills"
      lede="One file that teaches any AI assistant this entire library — every component, the class contract, and the rules that keep generated markup correct."
    >
      <Section title="What it is">
        <P>
          A coding agent pointed at this registry usually gets two things wrong: it writes React
          when the library is plain HTML, and it pastes components whose classes only resolve
          inside this docs app. The skill fixes both by giving the model the whole picture up
          front — all {TOTAL} components with descriptions, the surface and canvas rules, the
          CSS-only interactivity patterns, and an exact substitution table for the{' '}
          {NEEDS_SUBSTITUTION} components that need it.
        </P>
        <P>
          It is a single Markdown file with YAML frontmatter. No CLI, no package, no runtime. It
          works with Claude Code, Cursor, Copilot, Windsurf, Cline, Aider and Zed — and with any
          model that can read a URL, including small local ones.
        </P>
      </Section>

      <Section title="Install">
        <P>
          Pick the line for your assistant. Each writes one file into your project; nothing else
          changes.
        </P>
        <CodeBlock language="bash" filename="Claude Code" code={CLAUDE_CODE} />
        <CodeBlock language="bash" filename="Cursor" code={CURSOR} />
        <CodeBlock language="bash" filename="AGENTS.md — Copilot, Windsurf, Cline, Aider, Zed" code={GENERIC} />
        <CodeBlock language="bash" filename="No install" code={NO_INSTALL} />
        <Callout>
          Working inside this repo? The skill is already here — <Code>skills/html-library/</Code>.
          Claude Code picks it up from <Code>.claude/skills/</Code>; symlink or copy it there.
        </Callout>
      </Section>

      <Section title="What the agent learns">
        <List
          items={[
            <>
              <strong className="font-medium text-foreground">Every component by name</strong> —
              all {TOTAL} across Images, Apps, Sites, Agent Elements and UI Elements, each with
              its description, surface and tags. The model never has to guess a name or make one
              up.
            </>,
            <>
              <strong className="font-medium text-foreground">The class contract</strong> —{' '}
              {PORTABLE} components are literal Tailwind and paste anywhere;{' '}
              {NEEDS_SUBSTITUTION} use app-only tokens like <Code>text-muted-foreground</Code>{' '}
              that render invisible outside this app. The skill ships the exact 1:1 replacement
              for each one.
            </>,
            <>
              <strong className="font-medium text-foreground">CSS-only interactivity</strong> —
              tabs, switches, dropdowns and row selection are hidden inputs plus{' '}
              <Code>peer-checked</Code>, <Code>group-has-[…]</Code> and <Code>:has()</Code>. The
              skill states plainly that deleting the hidden input deletes the behaviour, which
              stops agents from "fixing" a component with JavaScript.
            </>,
            <>
              <strong className="font-medium text-foreground">Composition order</strong> — which
              components nest inside which, so an agent that already pasted{' '}
              <Code>agent-chat</Code> does not also paste <Code>input-bar</Code> inside it.
            </>,
            <>
              <strong className="font-medium text-foreground">Dark mode and contrast</strong> —
              every colour utility needs a <Code>dark:</Code> partner, plus the specific pairings
              that fall below 4.5:1 and must not be used.
            </>,
            <>
              <strong className="font-medium text-foreground">Troubleshooting</strong> — symptom
              to cause to fix for the failures that actually happen: invisible text, dead toggles,
              duplicate ids, stale registry output.
            </>,
          ]}
        />
      </Section>

      <Section title="Endpoints">
        <P>
          Everything is static and public. No auth, no rate limit beyond GitHub's own, and no
          build step on your side.
        </P>
        <CodeBlock
          language="bash"
          code={`${PAGES_URL}/skill.md      # the full skill, single file
${PAGES_URL}/llms.txt      # llms.txt — short index of every component
${PAGES_URL}/skill.json    # machine-readable manifest + stats
${PAGES_URL}/r/index.json  # the registry itself`}
        />
        <P>
          The skill is progressive: <Code>SKILL.md</Code> is the entry point and carries the
          complete component index inline, so a model can answer "which component does X" with no
          further fetches. Four reference files —{' '}
          <Code>conventions</Code>, <Code>recipes</Code>, <Code>registry-api</Code> and{' '}
          <Code>troubleshooting</Code> — load only when the task calls for them.
        </P>
      </Section>

      <Section title="Fetching a component">
        <P>
          This is the entire workflow the skill teaches. <Code>files[0].content</Code> is the
          complete markup.
        </P>
        <CodeBlock
          language="bash"
          code={`BASE=${PAGES_URL}/r

curl -s $BASE/index.json | jq -r '.items[].name'
curl -s $BASE/agent-chat.json | jq -r '.files[0].content' > agent-chat.html`}
        />
      </Section>

      <Section title="It cannot go stale">
        <P>
          The skill is generated from <Code>registry/</Code>, not written by hand. Adding a
          component regenerates its index entry, its counts, and its portability flag. CI runs{' '}
          <Code>verify:skill</Code> alongside <Code>verify:registry</Code>, so a component added
          without regenerating fails the build.
        </P>
        <CodeBlock
          language="bash"
          code={`npm run build:skill    # regenerate SKILL.md, llms.txt, skill.json
npm run verify:skill   # fail if the committed output is stale`}
        />
        <P>
          The hand-written reference files live in{' '}
          <a
            href={`${REPO_URL}/tree/main/skills/html-library/references`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            skills/html-library/references
          </a>{' '}
          and are bundled untouched — the generator only ever writes the parts it derives from the
          registry.
        </P>
      </Section>

      <Section title="Why it is built this way">
        <List
          items={[
            <>
              <strong className="font-medium text-foreground">No CLI to run.</strong> Skills that
              shell out to a tool fail in sandboxes, offline, and in agents without terminal
              access. This one is a file the model reads.
            </>,
            <>
              <strong className="font-medium text-foreground">The index is inline.</strong> A
              small or local model with no tool-calling can still name the right component,
              because every name is already in the file it was given.
            </>,
            <>
              <strong className="font-medium text-foreground">Rules are tables, not prose.</strong>{' '}
              Decision tables and 1:1 substitution maps survive aggressive summarisation in a way
              that paragraphs do not.
            </>,
            <>
              <strong className="font-medium text-foreground">
                It documents the library's real flaws.
              </strong>{' '}
              The {NEEDS_SUBSTITUTION} non-portable components are named and counted rather than
              glossed over, because an agent that knows about the trap avoids it.
            </>,
          ]}
        />
      </Section>
    </DocPage>
  )
}

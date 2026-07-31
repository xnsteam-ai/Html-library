import { CodeBlock } from '../components/CodeBlock'
import { componentHref } from '../hooks/useHashRoute'
import { Code, DocPage, List, P, Section } from '../components/Prose'

const CASES = [
  {
    title: 'Prototype an agent UI in an afternoon',
    body: 'Compose agent-chat, tool-group and the tool cards into a working surface before writing a single line of state. Every interactive state ships as static markup, so the design review happens against real DOM.',
    components: ['agent-chat', 'tool-group', 'bash-tool', 'plan-tool'],
  },
  {
    title: 'Add a chat panel to a server-rendered app',
    body: 'Rails, Django, Laravel and Astro all render HTML. Paste message-list and input-bar into a template, bind the values, and you are done — no client framework, no hydration.',
    components: ['message-list', 'input-bar', 'send-button'],
  },
  {
    title: 'Ship an internal tool without a design system',
    body: 'The UI set covers the primitives an internal dashboard actually needs. Consistent hairlines and spacing come for free because every component was drawn from the same shell.',
    components: ['card', 'alert', 'tabs', 'empty-state'],
  },
  {
    title: 'Feed components to your own agent',
    body: 'The registry is machine-readable and self-contained: one fetch returns markup an LLM can paste verbatim. Point a coding agent at index.json and it can pick a component by tag and description.',
    components: ['markdown', 'text-shimmer', 'spiral-loader'],
  },
]

export function UseCases() {
  return (
    <DocPage
      eyebrow="Docs"
      title="Use cases"
      lede="What plain HTML buys you: no framework lock-in, no dependency graph, and markup that pastes anywhere Tailwind runs."
    >
      {CASES.map((useCase) => (
        <Section key={useCase.title} title={useCase.title}>
          <P>{useCase.body}</P>
          <div className="flex flex-wrap gap-2">
            {useCase.components.map((name) => (
              <a
                key={name}
                href={componentHref(name)}
                className="rounded-full border border-border px-2.5 py-1 font-mono text-[12px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {name}
              </a>
            ))}
          </div>
        </Section>
      ))}

      <Section title="Using a component inside React">
        <P>
          Plain HTML is not a limitation in a React codebase — it is a starting point. Paste the
          markup into a component, change <Code>class</Code> to <Code>className</Code>, and wire the
          handlers you need.
        </P>
        <CodeBlock
          language="text"
          filename="SendButton.tsx"
          code={`export function SendButton({ onSend, busy }) {
  return (
    <button
      onClick={onSend}
      className="flex h-8 w-8 items-center justify-center rounded-full
                 bg-gray-900 text-white transition hover:bg-gray-700
                 dark:bg-white dark:text-neutral-900"
      aria-label={busy ? "Stop generating" : "Send message"}
    >
      {busy ? <span className="h-2.5 w-2.5 rounded-[2px] bg-current" /> : <ArrowUp />}
    </button>
  )
}`}
        />
      </Section>

      <Section title="When not to use this">
        <List
          items={[
            <>
              You want behaviour out of the box — focus traps, portals, keyboard menus. Use a
              headless library; these are visuals only.
            </>,
            <>
              You are not on Tailwind. The markup assumes utility classes; without them you get
              unstyled HTML.
            </>,
            <>
              You need versioned upgrades. Copy-paste means the component is yours the moment you
              take it — including future fixes you will not receive automatically.
            </>,
          ]}
        />
      </Section>
    </DocPage>
  )
}

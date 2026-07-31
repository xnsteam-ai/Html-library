import { CodeBlock } from '../components/CodeBlock'
import { Callout, Code, DocPage, List, P, Section } from '../components/Prose'

export function Theming() {
  return (
    <DocPage
      eyebrow="Docs"
      title="Theming"
      lede="Components are styled with stock Tailwind utilities, so restyling them is find-and-replace — not a config file."
    >
      <Section title="Light and dark">
        <P>
          Every component pairs its light classes with <Code>dark:</Code> variants. Tailwind v4
          resolves <Code>dark:</Code> against a media query by default; this site switches on a
          class instead, which is what the sidebar toggle drives.
        </P>
        <CodeBlock
          language="text"
          filename="theme.css"
          code={`@custom-variant dark (&:is(.dark *));`}
        />
        <P>
          With that in place, adding <Code>class="dark"</Code> to <Code>&lt;html&gt;</Code> flips
          every component. Drop the directive and the same markup follows the operating system
          setting instead — no component changes either way.
        </P>
      </Section>

      <Section title="The palette components use">
        <List
          items={[
            <>
              surfaces — <Code>bg-white</Code> / <Code>dark:bg-neutral-950</Code>, and{' '}
              <Code>bg-gray-50</Code> / <Code>dark:bg-white/5</Code> for recessed rows
            </>,
            <>
              borders — <Code>border-gray-200</Code> / <Code>dark:border-white/10</Code>
            </>,
            <>
              text — <Code>text-gray-900</Code>, <Code>text-gray-600</Code>,{' '}
              <Code>text-gray-400</Code>, mirrored as <Code>dark:text-gray-100/300/500</Code>
            </>,
            <>
              accents — <Code>bg-gray-900</Code> / <Code>dark:bg-white</Code> for primary actions;
              emerald, amber and red for status
            </>,
          ]}
        />
        <Callout>
          Swapping the accent to your brand is a single replace: <Code>bg-gray-900</Code> →{' '}
          <Code>bg-brand-600</Code> and <Code>dark:bg-white</Code> → <Code>dark:bg-brand-400</Code>.
          Nothing else in a component depends on it.
        </Callout>
      </Section>

      <Section title="Prefer semantic tokens?">
        <P>
          If your project already uses CSS variables for colour, map them once in{' '}
          <Code>@theme</Code> and replace the literal classes as you paste. The markup and layout
          stay identical.
        </P>
        <CodeBlock
          language="text"
          filename="styles.css"
          code={`@theme inline {
  --color-surface: var(--surface);
  --color-hairline: var(--hairline);
}

/* bg-white dark:bg-neutral-950  →  bg-surface   */
/* border-gray-200 dark:border-white/10  →  border-hairline */`}
        />
      </Section>

      <Section title="Density and radius">
        <P>
          Components use explicit sizes — <Code>text-[13px]</Code> through{' '}
          <Code>text-[15px]</Code>, <Code>rounded-lg</Code> and <Code>rounded-xl</Code> — rather
          than inherited defaults, so a component keeps its proportions when dropped into a page
          whose base font size differs. Adjust both with a find-and-replace on the file you copied.
        </P>
      </Section>

      <Section title="Motion">
        <P>
          Animated components respect <Code>prefers-reduced-motion</Code>:{' '}
          <Code>motion-reduce:animate-none</Code> on spinners, and a media query inside the one
          scoped style block that <Code>text-shimmer</Code> ships.
        </P>
      </Section>
    </DocPage>
  )
}

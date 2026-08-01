import { ArrowUpRight } from 'lucide-react'
import { CATEGORY_META, categories, components, PAGES_URL, REPO_URL } from '../../registry'
import { componentHref, docHref, galleryHref } from '../hooks/useHashRoute'
import { Callout, Code, DocPage, List, P, Section } from '../components/Prose'

export function Introduction() {
  return (
    <DocPage
      eyebrow="Docs"
      title="Introduction"
      lede="An open-source component library where every component is plain HTML + Tailwind, and GitHub is the registry."
    >
      <Section title="What this is">
        <P>
          {components.length} components live in this repository as <Code>.html</Code> files. No
          React, no build step, no package to install — copy the markup, or pull it over HTTP from
          the registry that ships with the repo. This site is the browser for that registry.
        </P>
        <List
          items={[
            <>
              <strong className="font-medium text-foreground">HTML + Tailwind only.</strong> Utility
              classes and inline SVG. Nothing to import, nothing to configure.
            </>,
            <>
              <strong className="font-medium text-foreground">Framework agnostic.</strong> The same
              file works in Rails, Django, Astro, Laravel, plain PHP, or a React component.
            </>,
            <>
              <strong className="font-medium text-foreground">GitHub is the registry.</strong> Each
              component is served as JSON from GitHub Pages and{' '}
              <Code>raw.githubusercontent.com</Code>.
            </>,
            <>
              <strong className="font-medium text-foreground">Light and dark.</strong> Every
              component carries <Code>dark:</Code> variants; the toggle in the sidebar drives the
              previews.
            </>,
          ]}
        />
      </Section>

      <Section title="The four sets">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => {
            const first = category.items[0]
            const isGallery = Boolean(CATEGORY_META[category.id].gallery)
            const href = isGallery ? galleryHref(category.id) : componentHref(first.name)
            const cta = isGallery ? 'Browse the gallery' : `Start with ${first.title}`

            return (
              <div key={category.id} className="flex flex-col rounded-xl border border-border p-4">
                <h3 className="text-[14.5px] font-semibold text-foreground">{category.title}</h3>
                <span className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {category.items.length} components
                </span>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
                  {category.blurb}
                </p>
                <a
                  href={href}
                  className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-foreground transition hover:opacity-70"
                >
                  {cta}
                  <ArrowUpRight size={13} />
                </a>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Interactive, with no JavaScript">
        <P>
          The components genuinely work — menus open, tabs switch panels, checkboxes tick, alerts
          dismiss, switches flip — and they do it without shipping a single line of JavaScript. The
          build script rejects any component containing a <Code>&lt;script&gt;</Code> tag or an
          external stylesheet.
        </P>
        <List
          items={[
            <>
              <Code>&lt;details&gt;</Code> / <Code>&lt;summary&gt;</Code> for disclosure — dropdown
              menus, collapsible tool output, expandable diffs.
            </>,
            <>
              Hidden radios and checkboxes hold the state; the visible parts style themselves from
              it with <Code>peer-checked:</Code>, <Code>has-checked:</Code> and{' '}
              <Code>group-has-[…]:</Code>.
            </>,
            <>
              Real form controls throughout — <Code>&lt;label for&gt;</Code>,{' '}
              <Code>&lt;select&gt;</Code>, <Code>&lt;input type="file"&gt;</Code> — so keyboard
              navigation and screen readers work without any extra wiring.
            </>,
          ]}
        />
        <P>
          This is why paste-and-go actually holds: there is no hydration step, no event listener to
          register, and nothing to initialise. Drop the markup into a Rails view or a React
          component and the behaviour comes with it.
        </P>
        <Callout>
          Three things genuinely need JavaScript and are therefore left to you: copying text to the
          clipboard, filtering a list as you type, and appending a new message to a thread. Those
          are marked in the components rather than faked.
        </Callout>
      </Section>

      <Section title="One exception">
        <P>
          <Code>text-shimmer</Code> carries a single scoped <Code>&lt;style&gt;</Code> block,
          because CSS keyframes cannot be expressed as Tailwind utilities. Its class names are
          prefixed <Code>hl-</Code> to stay collision-free.
        </P>
      </Section>

      <Section title="Next">
        <List
          items={[
            <>
              <a
                href={docHref('installation')}
                className="font-medium text-foreground underline underline-offset-2"
              >
                Installation
              </a>{' '}
              — get a component into your project in one command.
            </>,
            <>
              <a
                href={docHref('registry')}
                className="font-medium text-foreground underline underline-offset-2"
              >
                Registry
              </a>{' '}
              — the JSON contract, URLs, and how to add your own component.
            </>,
            <>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-medium text-foreground underline underline-offset-2">
                GitHub
              </a>{' '}
              — the source, and <Code>{PAGES_URL}/r/index.json</Code> for the machine-readable
              index.
            </>,
          ]}
        />
      </Section>
    </DocPage>
  )
}

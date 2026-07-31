import { ArrowUpRight } from 'lucide-react'
import { categories, components, PAGES_URL, REPO_URL } from '../../registry'
import { componentHref, docHref } from '../hooks/useHashRoute'
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

      <Section title="The two sets">
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <div key={category.id} className="rounded-xl border border-border p-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[14.5px] font-semibold text-foreground">{category.title}</h3>
                <span className="text-[12px] text-muted-foreground">
                  {category.items.length} components
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {category.blurb}
              </p>
              <a
                href={componentHref(category.items[0].name)}
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-foreground transition hover:opacity-70"
              >
                Start with {category.items[0].title}
                <ArrowUpRight size={13} />
              </a>
            </div>
          ))}
        </div>
      </Section>

      <Section title="One rule, one exception">
        <P>
          Registry files ship no JavaScript — the build script rejects any component containing a{' '}
          <Code>&lt;script&gt;</Code> tag or an external stylesheet. Interactive states are shown as
          static variants (open menus, selected tabs, running spinners) so you can wire them to
          whatever state layer you already use.
        </P>
        <Callout>
          The one exception: <Code>text-shimmer</Code> carries a single scoped{' '}
          <Code>&lt;style&gt;</Code> block, because CSS keyframes cannot be expressed as Tailwind
          utilities. Its class names are prefixed <Code>hl-</Code> to stay collision-free.
        </Callout>
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

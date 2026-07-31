import type { ReactNode } from 'react'

export function DocPage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string
  title: string
  lede?: string
  children: ReactNode
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-8 py-9">
      <header className="mb-7">
        {eyebrow && (
          <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">{title}</h1>
        {lede && (
          <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{lede}</p>
        )}
      </header>
      <div className="space-y-8">{children}</div>
    </article>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[17px] font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[14.5px] leading-relaxed text-accent-foreground">{children}</p>
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px] text-foreground">
      {children}
    </code>
  )
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-1.5 pl-5">
      {items.map((item, index) => (
        <li
          key={index}
          className="list-disc text-[14.5px] leading-relaxed text-accent-foreground marker:text-muted-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted px-4 py-3 text-[13.5px] leading-relaxed text-accent-foreground">
      {children}
    </div>
  )
}

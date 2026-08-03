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

export function Table({
  headers,
  rows,
}: {
  headers: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-border bg-muted">
            {headers.map((header) => (
              <th
                key={header}
                className="px-3 py-2 font-medium text-muted-foreground whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-3 py-2 align-top leading-relaxed text-accent-foreground"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted px-4 py-3 text-[13.5px] leading-relaxed text-accent-foreground">
      {children}
    </div>
  )
}

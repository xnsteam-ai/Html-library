import { useState } from 'react'

import { CodeBlock } from './CodeBlock'

export interface CodeTab {
  label: string
  filename?: string
  language?: 'html' | 'bash' | 'json' | 'text'
  code: string
  /** Rendered under the tab bar, above the code — a one-line caveat. */
  note?: string
}

/**
 * A code block with a tab strip, for the same thing expressed several ways —
 * one config block per MCP client. Real React state rather than the registry's
 * CSS-only radio trick, because this is the docs app, not a registry item.
 */
export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [active, setActive] = useState(0)
  const current = tabs[active] ?? tabs[0]

  return (
    <div className="space-y-2">
      <div
        role="tablist"
        aria-label="Choose your client"
        className="scrollbar-thin flex gap-1 overflow-x-auto rounded-lg bg-muted p-1"
      >
        {tabs.map((tab, index) => {
          const selected = index === active
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(index)}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[12.5px] font-medium transition ${
                selected
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {current.note && (
        <p className="text-[13px] leading-relaxed text-muted-foreground">{current.note}</p>
      )}

      <CodeBlock
        code={current.code}
        language={current.language ?? 'json'}
        filename={current.filename}
      />
    </div>
  )
}

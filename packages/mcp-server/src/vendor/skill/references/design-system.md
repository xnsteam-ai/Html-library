<!-- GENERATED — do not edit. Copied from skills/html-library/ by
     packages/mcp-server/scripts/sync-core.mjs. Edit the original and
     re-run `npm run build:mcp`. -->

# Design system — what the library looks like

Every number here is counted from the markup when this file is generated, so it
describes the library as it is rather than as anyone remembers it. 81
non-image components.

## The rule that explains most of the palette

Light side uses named grays; **dark side switches to alpha-on-white** for
surfaces and borders. This is the most consistent convention in the library.

```
light                       dark
bg-white                    dark:bg-neutral-950
bg-gray-50                  dark:bg-white/5      (recessed rows)
bg-gray-100                 dark:bg-white/10     (raised chips)
border-gray-200             dark:border-white/10
text-gray-900               dark:text-gray-100   (primary)
text-gray-600               dark:text-gray-400   (secondary)
bg-gray-900 text-white      dark:bg-white dark:text-neutral-900  (primary action)
```

Status colours keep their hue in both themes and only shift weight:
`bg-emerald-50 text-emerald-700` → `dark:bg-emerald-500/10 dark:text-emerald-400`.
The same shape holds for amber, red, violet and rose.

Rebranding is one substitution: `bg-gray-900` → your brand, `dark:bg-white` →
its dark counterpart.

## Type scale

Sizes are **arbitrary values, not Tailwind's named scale** — `text-sm`/`text-base`
are effectively unused. The half-pixel steps are the library's signature.

`text-[13px]` ×227 · `text-[13.5px]` ×108 · `text-[12.5px]` ×93 · `text-[14px]` ×85 · `text-[12px]` ×84 · `text-[11px]` ×79 · `text-[11.5px]` ×71 · `text-[15px]` ×61 · `text-[14.5px]` ×36 · `text-[10px]` ×30 · `text-[16px]` ×23 · `text-[10.5px]` ×21

Display sizes appear only in `sites` and `apps`. Body copy carries
`leading-relaxed`; everything else inherits.

## Radius

`rounded-full` ×257 · `rounded-lg` ×165 · `rounded-xl` ×102 · `rounded` ×90 · `rounded-md` ×78 · `rounded-2xl` ×45 · `rounded-t` ×23 · `rounded-[20px]` ×8

Rhythm: **control `rounded-lg` · container `rounded-xl` · pill/avatar `rounded-full`**,
with `apps` sitting one step larger throughout.

## Per category

| Category | Items | Canvas | Radius | Type |
|---|---|---|---|---|
| `ui` | 23 | 640×auto | `rounded-full` ×71 · `rounded-lg` ×55 · `rounded` ×19 · `rounded-xl` ×18 | `text-[13px]` ×61 · `text-[12.5px]` ×19 · `text-[13.5px]` ×17 · `text-[14px]` ×17 |
| `agent` | 23 | 640×auto | `rounded-full` ×55 · `rounded-lg` ×49 · `rounded-md` ×44 · `rounded-xl` ×30 | `text-[13px]` ×51 · `text-[11px]` ×33 · `text-[12px]` ×26 · `text-[12.5px]` ×25 |
| `sites` | 29 | 1280×800 / auto | `rounded-full` ×85 · `rounded-lg` ×53 · `rounded` ×47 · `rounded-xl` ×45 | `text-[13px]` ×96 · `text-[13.5px]` ×71 · `text-[15px]` ×43 · `text-[14px]` ×41 |
| `apps` | 6 | 390×844 | `rounded-full` ×46 · `rounded-2xl` ×12 · `rounded-xl` ×9 · `rounded-lg` ×8 | `text-[11.5px]` ×21 · `text-[13px]` ×19 · `text-[12.5px]` ×12 · `text-[13.5px]` ×11 |

**UI Elements** — controls `rounded-lg`, containers `rounded-xl`. Bordered
surfaces: `rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-950`.

**Agent Elements** — always `mx-auto w-full max-w-2xl`. Composers are
`rounded-xl … focus-within:border-gray-300`. The chat bubble tail
`rounded-2xl rounded-br-md` is unique to this category. Shadows are a
light-mode device only — `shadow-sm dark:shadow-none`.

**Sites** — section frame `w-full bg-white px-6 py-24 dark:bg-neutral-950`, inner
`mx-auto max-w-4xl` or `max-w-6xl`. Full pages are hard-sized `h-[800px] w-[1280px]`.
Display type runs to `text-[56px] font-semibold leading-[1.05] tracking-[-0.02em]`.
Cards are `rounded-2xl`. CTAs are larger than a UI button: `px-5 py-3 text-[14.5px]`.

**Apps** — fixed `flex h-[844px] w-[390px] flex-col`. Radii skew a step larger:
cards and full-width buttons are `rounded-2xl`/`rounded-3xl` where another
category would use `rounded-lg`. **Cards are borderless** —
separation is elevation (`bg-white` on `bg-gray-50`) plus
`divide-y divide-gray-100 dark:divide-white/5`, not `border`. The only category
that is 100% literal Tailwind, so it is the safest source to copy from.

## Button — the canonical control

```
small   rounded-md px-2.5 py-1   text-[12px] font-medium
medium  rounded-lg px-3.5 py-2   text-[13px] font-medium
large   rounded-xl px-5 py-2.5   text-[15px] font-medium
icon    flex h-9 w-9 items-center justify-center rounded-lg
```

| Variant | Classes |
|---|---|
| primary | `bg-gray-900 text-white hover:bg-gray-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-gray-200` |
| secondary | `border border-gray-200 bg-white hover:bg-gray-50 dark:border-white/15 dark:bg-transparent dark:hover:bg-white/10` |
| ghost | `hover:bg-gray-100 dark:hover:bg-white/10` |
| destructive | `bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600` |
| link | `underline underline-offset-4` |

Focus ring, from `ui/button` — the reference implementation:

```
focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900
focus-visible:ring-offset-2 dark:focus-visible:ring-white
dark:focus-visible:ring-offset-neutral-950
```

## State vocabulary, as practised

| Pattern | Occurrences | Files |
|---|---|---|
| `hover:` | 658 | 63 of 81 |
| `transition` | 376 | 60 of 81 |
| `peer-checked:` | 236 | 19 of 81 |
| `has-[` / `has-checked` | 156 | 15 of 81 |
| `group-has-` | 113 | 10 of 81 |
| `aria-` | 92 | 36 of 81 |
| `focus-visible:` | 56 | 7 of 81 |
| `<details>` | 30 | 9 of 81 |
| `active:` | 29 | 5 of 81 |
| `motion-reduce` | 10 | 6 of 81 |

Three things this table is telling you, which matter more than the totals:

- **The `disabled:` variant is never used.** Disabled is the HTML `disabled`
  attribute plus explicit classes: `cursor-not-allowed bg-gray-200 dark:bg-white/10`.
- **`hover:` is near-universal, `focus-visible:` is rare.** Only `ui/button`
  implements the full ring-offset pattern. If you are writing new markup, copy it
  — do not copy the majority.
- **`transition` is used bare**, so everything animates at Tailwind's default
  150ms. `transition-all` appears only alongside the `active:scale-95` press idiom.

Named groups (`group/name`) are used; named peers never are, so a
`peer-checked:` rule always depends on the hidden input being the immediate
previous sibling. Moving it breaks the component silently.

## Three design systems ship, not one

19 components carry a scoped `<style>` block. Keep it — it holds
either `@keyframes` or a palette that utilities cannot express.

**Tailwind-literal** — everything above. The default.

**Fluent** (Microsoft) — `nav-horizontal`, `nav-vertical`, `switch`, `switch-list`,
`table`, `table-interactive`, the skeletons and spinners:

```css
--fluent-brand: #0f6cbd;  --text-primary: #242424;  --border-color: #e0e0e0;
/* dark */
--fluent-brand: #479ef5;  --text-primary: #ffffff;  --border-color: #424242;
```

**Astryx** (softer editorial) — `chat-landing`, `chat-conversation`,
`site-component-docs`, `site-ide-shell`, `site-product-gallery`,
`site-setup-guide`, `site-storefront`:

```css
--bg-app: #f4f4f6;  --bg-surface-raised: #ffffff;  --border-color: rgba(0,0,0,.08);
--text-primary: #171717;  --text-secondary: #555555;  --text-muted: #999999;
/* dark */
--bg-app: #141414;  --bg-surface-raised: #222222;  --border-color: rgba(255,255,255,.07);
--text-primary: #e8e8e8;  --text-secondary: #999999;  --text-muted: #555555;
```

Do not mix the three in one screen. If you paste a Fluent component next to a
Tailwind-literal one, restyle one of them.

## Motion

Every animation wraps in `@media (prefers-reduced-motion: reduce) { animation: none }`.

| Effect | Timing |
|---|---|
| shimmer | `2.4s linear infinite` over `background-size: 200% auto` |
| skeleton pulse | `2s cubic-bezier(0.4,0,0.2,1)`, opacity 1 → 0.3 → 1 |
| spinner | `1.3s cubic-bezier(0.53,0.21,0.29,0.67)` |

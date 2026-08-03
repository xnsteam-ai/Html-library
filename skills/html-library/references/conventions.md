# Conventions — the class contract

Read this before you paste any component into a project.

## Rule 1 — Every component is plain HTML + Tailwind

- No JavaScript. No `<script>`. Ever.
- No `className`. It is `class` (HTML, not JSX).
- No `<link>`, no `<iframe>`, no `@import`. Components are self-contained.
- Interactivity is CSS-only (see "CSS-only interactivity" below).

## Rule 2 — Two class vocabularies exist. Know which one you got.

| Vocabulary | Example classes | Works where |
|---|---|---|
| **Literal Tailwind** | `bg-gray-900`, `text-gray-500`, `border-gray-200` | Anywhere Tailwind runs. Portable. |
| **App-only tokens** | `text-muted-foreground`, `bg-muted`, `text-foreground`, `border-border` | ONLY inside this docs app, which defines them in `@theme`. |

**136 of 191 components use literal Tailwind only — paste and go.**
**55 components contain app-only tokens** (agent 20, sites 22, ui 13). In a plain
Tailwind project those classes resolve to nothing: text renders black-on-black or
invisible.

### Detect it in one grep

```bash
grep -oE '(text|bg|border|ring|divide|placeholder)-(foreground|muted-foreground|accent-foreground|background|muted|subtle|border|primary|primary-foreground)\b' component.html
```

Empty output = portable. Any output = apply the substitution table.

### Substitution table (exact 1:1 — these are the real values from `theme.css`)

| App-only token | Light | Dark | Replace with |
|---|---|---|---|
| `bg-background` | `#ffffff` | `#101010` | `bg-white dark:bg-neutral-950` |
| `text-foreground` | `#171717` | `#f5f5f5` | `text-neutral-900 dark:text-neutral-100` |
| `bg-muted` | `#f5f5f5` | `#171717` | `bg-neutral-100 dark:bg-neutral-900` |
| `text-muted-foreground` | `#737373` | `#a3a3a3` | `text-neutral-500 dark:text-neutral-400` |
| `bg-subtle` | `#e5e5e5` | `#262626` | `bg-neutral-200 dark:bg-neutral-800` |
| `border-border` | `#e5e5e5` | `#333333` | `border-neutral-200 dark:border-white/10` |
| `text-accent-foreground` | `#404040` | `#d4d4d8` | `text-neutral-700 dark:text-neutral-300` |
| `bg-primary` | `#171717` | `#f5f5f5` | `bg-neutral-900 dark:bg-neutral-100` |
| `text-primary-foreground` | `#ffffff` | `#111111` | `text-white dark:text-neutral-900` |

The prefix swaps freely: `text-muted` → `text-neutral-100 dark:text-neutral-900`,
`border-muted` → `border-neutral-100 dark:border-neutral-900`, and so on.

### The shortcut that avoids all of it

Use **Copy HTML** on the component page (or `toStandaloneHtml`). It emits a full
document with the Tailwind Play CDN attached, so the markup renders correctly in
any HTML previewer with zero setup. Use it for demos and bug reports. For real
projects, paste the fragment and apply the substitution table.

## Rule 3 — Dark mode is always paired

Every color utility ships with a `dark:` partner. Never emit a bare `bg-white`
or `text-gray-900` without one.

```html
<!-- correct -->
<div class="bg-white text-gray-900 dark:bg-neutral-950 dark:text-gray-100">

<!-- wrong — invisible in dark mode -->
<div class="bg-white text-gray-900">
```

The app toggles dark mode with a `dark` class on `<html>`, so the consuming
project needs Tailwind's class strategy (`darkMode: 'class'` in v3;
`@custom-variant dark (&:where(.dark, .dark *))` in v4).

### Contrast floor

Body text must clear **4.5:1** against its own background. Two pairings that
look fine but fail — do not use them:

- `text-gray-500` on `bg-neutral-900` → 3.9:1
- `text-gray-600` on `#0a0a0a` → 2.6:1

Safe defaults: `text-gray-600 dark:text-gray-400` for secondary text,
`text-gray-900 dark:text-gray-100` for primary.

## Rule 4 — IDs must be globally unique

Interactivity is driven by `for`/`id` pairs and `:checked`. Two copies of the
same component on one page will cross-talk. Every id is namespaced by component:

```html
<input type="radio" name="model-picker-choice" id="model-picker-opus" />
<label for="model-picker-opus">…</label>
```

If you paste a component twice, **re-namespace the second copy** (`-2` suffix on
every `id`, `for`, and `name`). The registry validator enforces uniqueness within
a file but cannot see your page.

## Rule 5 — CSS-only interactivity

These are the four patterns used across the library. Reproduce them; do not
reach for JavaScript.

| Pattern | Mechanism | Used by |
|---|---|---|
| Tabs / segmented control | `<input type="radio" class="sr-only">` + `group-has-[#id:checked]/name:` | `tabs`, `nav-horizontal`, `nav-vertical` |
| Toggle / switch | hidden `<input type="checkbox" class="peer">` + `peer-checked:` | `switch`, `switch-list` |
| Dismiss | checkbox + `peer-checked:hidden` | `alert` |
| Disclosure / dropdown | native `<details>`/`<summary>` + `group-open/name:` | `model-picker`, `mode-selector` |
| Row selection | `:has()` — `has-checked:bg-…`, and `has-[tbody_:checked]:` on an ancestor | `table-interactive` |

Named groups (`group/picker` … `group-has-[…]/picker:`) are mandatory when a
component may appear more than once — an unnamed group leaks to siblings.

## Rule 6 — `<style>` blocks are for keyframes only

Tailwind cannot express `@keyframes`, so a handful of components carry one
scoped `<style>` block. Rules:

- Class names are **prefixed** (`lg-`, `hl-`, `fsp-`, …) to avoid collisions.
- Always pair with `@media (prefers-reduced-motion: reduce) { animation: none }`.
- Components that carry a full theme (the Fluent-style set) also declare CSS
  custom properties scoped to a root class, with a `.dark` override:

```html
<style>
  .fsp-root { --fluent-brand: #0f6cbd; }
  .dark .fsp-root { --fluent-brand: #479ef5; }
</style>
<div class="fsp-root">…</div>
```

These components are **fully portable** — their colors come from their own
`<style>` block, not from the app theme.

## Rule 7 — Images point at a CDN

Image components reference a deployed URL so the markup is portable by design.
The docs app rewrites it locally for preview only. Copy output always keeps the
deployed URL. Do not "fix" it to a relative path.

## Accessibility floor

- Icon-only controls get `aria-label`.
- Decorative SVGs are `aria-hidden` or have no accessible name.
- Tab strips use `role="tablist"`; menus use `role="listbox"` / `role="option"`.
- Status regions use `role="status"`; errors use `role="alert"`.
- Never remove focus rings without replacing them (`focus-visible:ring-2`).

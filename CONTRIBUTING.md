# Contributing

Thanks for adding to the library. A component is two files.

## Add a component

```bash
mkdir -p registry/ui/tooltip
$EDITOR registry/ui/tooltip/component.html
$EDITOR registry/ui/tooltip/meta.json

npm run dev              # it appears in the sidebar immediately
npm run build:registry   # regenerate public/r, then commit both
```

### `component.html`

The markup, and nothing else.

**Required**

- Plain HTML with Tailwind v4 utility classes — no `className`, no JSX.
- No `<script>`, `<link>`, `<iframe>` or `@import`. The build script rejects these.
- Icons as inline `<svg>` with `stroke="currentColor"` or `fill="currentColor"`.
- A `dark:` variant for every colour utility. Preview both themes with the sidebar toggle.
- Stock Tailwind classes only — no custom theme tokens, since consumers paste into their own project.
- Semantic markup: real `<button>`, `<label>`, `<table>`; `aria-label` on icon-only controls.

**Allowed**

- A scoped `<style>` block **only** for keyframes that cannot be expressed as utilities. Prefix class names with `hl-` and honour `prefers-reduced-motion`. See `registry/agent/text-shimmer/component.html`.
- Inline `style` attributes for one-off values a utility cannot express (e.g. a bar height percentage).

**Conventions**

- Show interactive states as static variants — open menu, selected tab, running spinner — rather than reaching for JavaScript.
- Sizes are explicit (`text-[13px]`, `rounded-xl`) so a component keeps its proportions wherever it lands.
- Surfaces `bg-white` / `dark:bg-neutral-950`, hairlines `border-gray-200` / `dark:border-white/10`, primary actions `bg-gray-900` / `dark:bg-white`.
- Add `motion-reduce:animate-none` to anything animated.

### `meta.json`

```json
{
  "name": "tooltip",
  "title": "Tooltip",
  "description": "One sentence describing what ships and which variants are included.",
  "category": "ui",
  "order": 9,
  "tags": ["overlay", "hint"],
  "previewBg": "plain",
  "previewHeight": 240
}
```

- `name` must equal the folder name; `category` must equal the parent folder (`apps`, `agent` or `ui`).
- `order` controls sidebar position within the category.
- `previewBg` is `plain`, `muted` or `app`; `previewHeight` is the minimum preview height in pixels.

### Whole screens (`registry/apps/`)

Items in `apps` are complete screens rather than parts, and appear in the Apps & Sites gallery.

- `surface` is **required**: `"app"` for mobile screens, `"site"` for desktop pages. The build fails without it.
- Author at the exact frame size — `h-[844px] w-[390px]` for apps, `h-[800px] w-[1280px]` for sites — since the gallery scales that box down and the detail view fits it to the column.
- `tagline` is the short line under the name in the grid; it falls back to `description`.
- `status` is optional, `"new"` or `"updated"`, and renders as a badge on the card.
- Include the platform chrome the screen would really have — status bar and home indicator for apps — so previews read as screens rather than floating panels.

## Before opening a pull request

```bash
npm run build:registry   # regenerates public/r — commit the result
npx tsc --noEmit
npm run build
```

CI runs `npm run verify:registry` and fails if `public/r` does not match `registry/`. Because the generated JSON is committed, `raw.githubusercontent.com` serves the registry without any infrastructure — that only holds if the two stay in sync.

## Adding a category

Add an entry to `CATEGORIES` in `scripts/build-registry.mjs` and to `CATEGORY_META` in `src/registry/index.ts` (extending the `CategoryId` union), then create `registry/<category>/`. The sidebar and the Introduction page pick it up automatically — both are driven by `CATEGORY_META`, ordered by its `order` field.

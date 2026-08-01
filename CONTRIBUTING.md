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

**Interactivity — make it real, without scripts**

Components are expected to actually work. Use the platform:

- `<details>` / `<summary>` for anything that opens and closes — dropdown menus, collapsible output, expandable diffs. Add `list-none [&::-webkit-details-marker]:hidden` to the summary and rotate the chevron with `group-open/name:rotate-90`.
- Hidden `<input type="radio">` / `<input type="checkbox">` (`class="peer sr-only"`) to hold state. Style the visible sibling with `peer-checked:`; when the styled element is not a sibling, put `group/name` on a common ancestor and use `group-has-[#id:checked]/name:` instead. **`peer-*` only reaches siblings — this is the single easiest thing to get wrong.**
- Dismissal is a checkbox plus `peer-checked:hidden`. Point the ✕ at it with `<label for="…">` so only the ✕ dismisses, never the whole element.
- Prefer real controls — `<select>`, `<label for>`, `<input type="file">` — over faked ones; keyboard and screen-reader support then comes for free.
- Give every `id` a component-name prefix. Several screens render at once in the gallery, and duplicate ids would cross-wire them.

Do not fake what genuinely needs JavaScript (clipboard copy, live filtering, appending messages). Leave it to the consumer and say so.
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

- `name` must equal the folder name; `category` must equal the parent folder (`apps`, `sites`, `agent` or `ui`).
- `order` controls sidebar position within the category.
- `previewBg` is `plain`, `muted` or `app`; `previewHeight` is the minimum preview height in pixels.

### Apps (`registry/apps/`)

Complete mobile screens, browsable in the Apps gallery.

- `surface` is **required** and must be `"app"`. The build rejects anything else here.
- Author at the exact frame size — `h-[844px] w-[390px]` — since the gallery scales that box down and the detail view fits it to the column.
- Include the platform chrome a real screen would have — status bar, home indicator — so previews read as screens rather than floating panels.
- `tagline` is the short line under the name in the grid; it falls back to `description`. `status` is optional, `"new"` or `"updated"`, and renders as a badge on the card.

### Sites (`registry/sites/`)

Website pages and the marketing sections a page is built from, browsable in the Sites gallery. Both share the browser-chrome frame; they differ in `surface`:

- **`surface: "site"`** — a complete page, authored at the exact `h-[800px] w-[1280px]` frame. Use for something meant to be seen as a whole page (a dashboard, a docs layout).
- **`surface: "section"`** — a single reusable block, authored `w-full` at **1280px wide with no fixed height** (`<section class="w-full …">`, height comes from the content). Use for anything meant to be composed with other sections — hero, features, pricing, FAQ, footer. The frontend measures the rendered height itself; do not set an explicit height on the section.
- `tagline` and `status` work the same as in Apps.

## Before opening a pull request

```bash
npm run build:registry   # regenerates public/r — commit the result
npx tsc --noEmit
npm run build
```

CI runs `npm run verify:registry` and fails if `public/r` does not match `registry/`. Because the generated JSON is committed, `raw.githubusercontent.com` serves the registry without any infrastructure — that only holds if the two stay in sync.

## Adding a category

Add an entry to `CATEGORIES` in `scripts/build-registry.mjs` and to `CATEGORY_META` in `src/registry/index.ts` (extending the `CategoryId` union), then create `registry/<category>/`. The sidebar and the Introduction page pick it up automatically — both are driven by `CATEGORY_META`, ordered by its `order` field.

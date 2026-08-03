---
name: html-library
description: >-
  Use when building UI with the HTML Library registry (191 copy-paste
  components: mobile app screens, marketing pages, agent chat surfaces, UI
  primitives and photography). Plain HTML + Tailwind — no React, no JavaScript,
  no dependencies. Covers fetching components, the class-portability contract,
  CSS-only interactivity, dark mode, and composing whole screens.
license: MIT
homepage: https://xnsteam-ai.github.io/Html-library
repository: https://github.com/xnsteam-ai/Html-library
version: 1
---

# HTML Library

A registry of **191 copy-paste UI components written in plain HTML +
Tailwind CSS**. Not React. Not a framework. No JavaScript, no build step, no
dependency to install. Every component is a self-contained fragment of markup
that works anywhere Tailwind runs — React, Vue, Svelte, Astro, Rails, Django,
Laravel, PHP, or a bare `.html` file.

## Quick start

```bash
BASE=https://xnsteam-ai.github.io/Html-library/r

curl -s $BASE/index.json | jq -r '.items[].name'          # list everything
curl -s $BASE/button.json | jq -r '.files[0].content'     # get the markup
```

`.files[0].content` is the complete component. Paste it. That is the whole
workflow — there is no CLI and no install command.

Working in this repo instead of over the network? The same string lives at
`registry/<category>/<name>/component.html`. Read it directly.

## The 6 rules

Follow these and you will not produce broken output.

1. **It is `class`, never `className`.** These are HTML files.
2. **Never add JavaScript.** Interactivity is CSS-only. If a component seems to
   need JS, it does not — see the pattern table below.
3. **Always pair a `dark:` variant** with every color utility. A bare
   `bg-white` is invisible in dark mode.
4. **Check the class vocabulary before pasting.** 55 of 191
   components use app-only theme tokens that render invisible outside this repo.
   See *Class portability* below — this is the single most common failure.
5. **Re-namespace `id` / `for` / `name`** if you paste a component twice.
   CSS-only state is keyed on them and two copies will cross-talk.
6. **Keep any `<style>` block.** It carries `@keyframes` or a scoped color
   theme that Tailwind utilities cannot express.

## Class portability — read before pasting

Two vocabularies exist in this registry.

| Vocabulary | Looks like | Portable? |
|---|---|---|
| Literal Tailwind | `bg-gray-900`, `text-gray-500` | Yes — paste anywhere |
| App-only tokens | `text-muted-foreground`, `bg-muted` | **No** — only inside this docs app |

**136 of 191 components are fully portable.**
**55 contain app-only tokens** (sites 22, agent elements 20, ui elements 13) and are marked ⚠ in
the index below.

Detect:

```bash
grep -oE '(text|bg|border)-(muted-foreground|foreground|muted|background|border)\b' file.html
```

Fix — exact 1:1 replacements:

| Replace | With |
|---|---|
| `text-muted-foreground` | `text-neutral-500 dark:text-neutral-400` |
| `text-foreground` | `text-neutral-900 dark:text-neutral-100` |
| `text-accent-foreground` | `text-neutral-700 dark:text-neutral-300` |
| `bg-background` | `bg-white dark:bg-neutral-950` |
| `bg-muted` | `bg-neutral-100 dark:bg-neutral-900` |
| `bg-subtle` | `bg-neutral-200 dark:bg-neutral-800` |
| `bg-primary` | `bg-neutral-900 dark:bg-neutral-100` |
| `text-primary-foreground` | `text-white dark:text-neutral-900` |
| `border-border` | `border-neutral-200 dark:border-white/10` |

Shortcut: the **Copy HTML** button on any component page emits a standalone
document with the Tailwind CDN and theme attached — correct anywhere, zero setup.

## CSS-only interactivity

| Need | Mechanism |
|---|---|
| Tabs, segmented control, nav | hidden `<input type="radio">` + `group-has-[#id:checked]/name:` |
| Toggle, switch | hidden `<input type="checkbox" class="peer">` + `peer-checked:` |
| Dismiss a banner | checkbox + `peer-checked:hidden` |
| Dropdown, disclosure | native `<details>`/`<summary>` + `group-open/name:` |
| Row selection | `:has()` — `has-checked:`, `has-[tbody_:checked]:` |

Deleting the hidden `<input>` deletes the behavior — it *is* the state.

## Categories

| Category | Count | What it is | Canvas |
|---|---|---|---|
| `images` | 110 | Ready-to-paste photography served from a CDN. | — |
| `apps` | 6 | Complete mobile app screens, drawn at 390x844. | 390x844 |
| `sites` | 29 | Website pages and the marketing sections they are built from. | 1280x800 / 1280xauto |
| `agent` | 23 | Chat surfaces, composers and tool-call cards. | 640xauto |
| `ui` | 23 | General-purpose primitives that pair with the agent set. | 640xauto |

`surface` decides the canvas: `app` (390x844), `site` (1280x800),
`section` (1280xauto), or omitted → `element` (640xauto, no chrome).
Only `apps` and `sites` require it.

## Component index

`[surface]` is shown where set. ⚠ = contains app-only tokens, needs the
substitution table above.

### Apps — 6

- `app-onboarding` `[app]` — A welcome screen with a gradient hero, paging dots, primary and social sign-in actions, and iOS status bar chrome.
- `app-feed` `[app]` — A discovery feed: category chips, a featured card with a real photo, compact list rows with author avatars, and a four-item tab bar.
- `app-wallet` `[app]` — A finance home: dark balance card with trend pill, a row of quick actions, and a categorised transaction list.
- `app-checkout` `[app]` — An order review screen: line items with quantity steppers, delivery address, selectable payment methods, totals, and a sticky pay bar.
- `app-chat-inbox` `[app]` — A messages list: search field, pinned avatars with presence, unread and read-receipt states, and a tab bar.
- `app-profile-settings` `[app]` — An account screen: avatar header with membership badge and stat row, plus grouped setting rows with toggles, values and a destructive action.

### Sites — 29

- `site-landing` `[site]` ⚠ — A marketing home: nav bar, announcement pill, large hero with dual calls to action, logo social proof, and a three-column feature row.
- `site-pricing` `[site]` ⚠ — Three pricing tiers with a monthly/yearly toggle, a highlighted popular plan, checked feature lists, and an FAQ strip.
- `site-dashboard` `[site]` ⚠ — A product app shell: navigation sidebar with account footer, stat tiles with trends, a bar chart with range toggle, and a status table.
- `site-docs` `[site]` ⚠ — A three-column docs layout: search bar with shortcut, grouped nav, article with breadcrumb, code block, callout and options table, plus an on-this-page rail.
- `site-auth` `[site]` ⚠ — A split authentication page: social and credential sign-in with remember-me on one side, a dark testimonial panel with stats on the other.
- `site-agents` `[site]` ⚠ — A warm-toned product landing page: sticky nav with dropdown affordances, breadcrumb strip, split hero with a node-graph illustration, and a partner logo wall.
- `site-research` `[site]` ⚠ — A publication home page: translucent nav, centred prompt hero with quick-action pills, a bento lead story and a recent-news row. Thumbnails are real photos.
- `site-fintech-hero` `[site]` ⚠ — A full-bleed photo backdrop with a floating pill nav and a footer-anchored headline — the composition that pairs a bold claim with feature chips below the fold.
- `section-hero` `[section]` ⚠ — A centred marketing hero: announcement pill, large headline, supporting copy, dual calls to action, and avatar social proof.
- `section-features` `[section]` ⚠ — A six-item feature grid with icon tiles, an eyebrow label and a centred section heading.
- `section-bento` `[section]` ⚠ — A mixed-size feature grid: one large panel with a bar chart, three supporting tiles, and a wide closing tile.
- `section-pricing` `[section]` ⚠ — Three pricing tiers with a working monthly/yearly toggle that swaps the price, a highlighted popular plan, and checked feature lists.
- `section-testimonials` `[section]` ⚠ — A working quote slider: three testimonials switched by clickable dot navigation, no JavaScript.
- `section-faq` `[section]` ⚠ — A five-question accordion built on native details/summary, with a rotating plus icon and a contact line.
- `section-cta` `[section]` ⚠ — A dark closing call-to-action banner with decorative gradients and dual actions.
- `section-stats` `[section]` — A four-up metric row on a dark band, with a heading and supporting line.
- `section-logo-cloud` `[section]` ⚠ — A compact social-proof band: an eyebrow label above a row of muted customer wordmarks.
- `section-team` `[section]` ⚠ — A four-up team grid: photo avatar, name and role, with a heading and supporting line above.
- `section-newsletter` `[section]` ⚠ — A real email subscribe form with native required validation, an icon tile and a supporting line.
- `site-component-docs` `[site]` — A design-system component reference: category nav tree, live stage preview, best-practices table, examples, and an on-this-page rail.
- `section-footer` `[section]` ⚠ — A five-column footer: brand blurb, four link groups, and a legal row with social icons.
- `site-storefront` `[site]` — An ecommerce top nav with a hover mega menu, hero banner and category grid rows.
- `section-customer-stories` `[section]` ⚠ — A two-column case-study grid pairing a square brand-locked thumbnail with a headline, summary and inline link. Thumbnails are real photos.
- `site-product-gallery` `[site]` — A marketing header over a grid of square product cards with pricing.
- `section-plan-picker` `[section]` ⚠ — Credit-based pricing tiers with a per-month allowance box, indented model lists, and a highlighted plan wrapped in a dark shell with an amber call to action.
- `site-ide-shell` `[site]` — A code-editor shell: menu bar, file-tree sidebar with an active file, editor tabs and a mock code area.
- `section-service-grid` `[section]` — A 2×2 directory of service categories, each a pastel panel with tag pills and an Explore footer, above a filter header with a live status dot.
- `site-setup-guide` `[site]` — A getting-started documentation page: an AI assistance prompt card, prerequisites, install steps with code blocks, and an on-this-page rail.
- `section-lead-form` `[section]` ⚠ — A long-form informational page — savings, benefits and contractor copy — ending in a multi-fieldset request form with a real radio-scale question. Auto-height, so nothing is clipped.

### Agent Elements — 23

- `agent-chat` ⚠ — A complete conversation shell: header with agent status, scrollable thread with an inline tool call, and a composer.
- `message-list` ⚠ — A conversation thread with user bubbles, assistant turns, hover actions, and a streaming turn with a caret.
- `input-bar` ⚠ — The composer: auto-height textarea, attachment and tools controls, model readout, dictation, and a send button.
- `suggestions` ⚠ — Prompt starters in two shapes: a wrapping chip row and a stacked list with icons and descriptions.
- `model-picker` ⚠ — A model selector trigger plus the open menu: options with descriptions, a selected check, and a settings row.
- `mode-selector` ⚠ — Segmented controls for switching agent modes — a full-width pill group and a compact bordered variant.
- `user-message` ⚠ — The sent turn: a plain bubble and a richer variant with an attached file, timestamp, and edit/copy actions.
- `markdown` ⚠ — Typography for rendered agent output: headings, lists, inline code, a titled code block, blockquote, table, and links.
- `send-button` ⚠ — Send affordance in four states: idle, disabled, generating (stop), and a labelled variant with a keyboard hint.
- `attachment-button` ⚠ — Attachment triggers (plus and paperclip) with the open source menu: file, image, repo, and clipboard.
- `file-attachment` ⚠ — Attached files as removable chips, an uploading card with a progress bar, and a failed card with a retry action.
- `text-shimmer` ⚠ — A shimmering status label for pending work, plus a pulsing skeleton. Ships one scoped style block for the keyframes.
- `spiral-loader` ⚠ — A masked conic-gradient spinner in three sizes, a bordered ring variant, and an inline running-status row.
- `bash-tool` ⚠ — Terminal tool calls: command header, scrollable output, exit-status pill, duration footer, and a failed variant.
- `edit-tool` ⚠ — A file-edit tool call rendered as a diff: path header with +/− counts, gutter line numbers, and apply actions.
- `search-tool` ⚠ — Grep-style results grouped by file, with line gutters, highlighted matches, and a search summary footer.
- `todo-tool` ⚠ — The agent's task list: completed items struck through, an in-progress row with a spinner, pending rows, and a progress bar.
- `plan-tool` ⚠ — A proposed plan awaiting approval: numbered steps with affected files, a status pill, and approve/edit actions.
- `tool-group` ⚠ — A collapsible run of tool calls: summary header with stacked icons and timing, collapsed, expanded, and running children.
- `ide-composer` — A dark, IDE-embedded prompt bar: session placeholder with a blinking caret, mode toggle row, and a bottom Local/Remote action strip. Always dark, like the editor panel it depicts.
- `chat-landing` `[site]` — A full-page AI assistant home: greeting, rich composer, category toggles and filtered suggestion cards.
- `chat-welcome` ⚠ — The empty-state screen before any messages exist: a centred greeting above a rounded composer with a teal send button and a scroll-to-bottom affordance.
- `chat-conversation` `[site]` — A full-page thread with a user message, an expanded tool-call log, a rendered code block, and a split artifact document panel.

### UI Elements — 23

- `button` ⚠ — Primary, secondary, ghost, destructive and link buttons across four sizes, with loading, disabled and icon states.
- `badge` ⚠ — Status pills in seven tones plus dot, counter, removable-tag and small label variants.
- `card` ⚠ — A surface in three shapes: header/body/footer card, stat card with a bar sparkline, and a clickable link card.
- `input` ⚠ — Form fields: labelled input with hint, search with shortcut, prefixed input, invalid state, textarea and disabled.
- `alert` ⚠ — Neutral, success, warning and error alerts with icons and actions, plus a solid inline announcement banner.
- `tabs` ⚠ — Three tab patterns — underline with a count badge, pill group, and vertical tabs beside a panel.
- `avatar` ⚠ — Photo avatars in four sizes and several tones, with a presence dot, initials and icon fallback states, overlap stack and account row.
- `empty-state` ⚠ — A dashed placeholder with icon, copy and actions, plus a compact no-results row for search.
- `radio-card-group` ⚠ — Selectable plan cards backed by native radio inputs — checked, hover and disabled states are driven entirely by CSS, so selection works without JavaScript.
- `prompt-composer` ⚠ — A rounded message box with an inline toolbar — attachment, agent and model pickers on the left, send on the right. The shell lights up on focus-within.
- `auth-card` ⚠ — A sign-in panel with crosshair corner marks and bleeding hairlines — email and password fields, a primary action, and GitHub / Google providers.
- `badge-pill` ⚠ — shadcn-style semantic badge variants — default, secondary, outline and destructive — for labelling status inside a larger component.
- `login-glass` ⚠ — A translucent, glassmorphic auth card floating over two soft drifting blobs — email, password and a full-width primary action.
- `nav-horizontal` — A top tab strip with a sliding underline indicator, working via a radio group and CSS — no JavaScript.
- `nav-vertical` — A sidebar navigation list with a selected-state highlight, paired with a content pane.
- `skeleton-card` — A pulsing placeholder for a card — avatar, image, text lines and action buttons — shown while real content loads.
- `skeleton-list` — Staggered pulsing rows for a loading data list — avatar, two text lines and a status pill per row.
- `spinner` — A spinning ring loading indicator in four sizes.
- `spinner-overlay` — A blocking loading overlay with a spinner and label over blurred underlying content.
- `switch` — A real toggle switch in on, off and disabled states, driven entirely by a hidden checkbox and CSS.
- `switch-list` — Labeled toggle rows for a settings panel, including a disabled row managed by an admin.
- `table` — A simple data table with a header, hover rows and a title/description block.
- `table-interactive` — A selectable data table where checking a row reveals a bulk-actions bar, driven purely by CSS `:has()`.

### Images — 110

All are `image-*`. Every one carries a structured `prompt` object (subject,
composition, **framing geometry**, environment, lighting, camera, atmosphere)
for handing to an image model:

```bash
curl -s $BASE/image-sunlit-portrait.json | jq '.prompt'
```

Available (drop the `image-` prefix here for brevity — the real name keeps it):

feathered-motion, weathered-portrait, skincare-sheet, iced-coffee-mockup, motion-blur-crowd, daisy-displacement, headphone-pop, wildflower-field, sky-skate-poster, feather-collar, streetwear-collage, golden-cover, expression-grid, plush-toy-set, summer-twirl, boxing-cover, flat-lay-fashion, device-beach-ad, mascot-hoodie, idol-grid, newsprint-editorial, portrait-collage, blue-bloom, cap-selfie, blossom-grid, sunlit-hands, blue-knit, own-the-sky, sunlit-portrait, fruit-soda-set, ball-cap-portrait, puffer-jacket-pair, day-night-comparison, flat-cap-contact-sheet, phone-spec-diagram, tailored-coat-street-style, mirror-selfie-athletic, smart-glasses-badge, teal-eyes-portrait, roast-chicken-recipe-card, phone-case-exploded-view, performance-shoe-ad, red-sport-poster, backlit-warehouse-portrait, urban-street-portrait, outfit-lineup-grid, outdoor-apparel-poster, snow-sport-portrait, beauty-close-up-necklace, headphones-product-poster, yellow-sports-car-poster, sports-car-spec-sheet, skincare-routine-card, blue-coupe-poster, beach-hat-portrait, winter-jacket-ad, motion-pose-poster, phone-call-poster, fitness-pose-portrait, motion-shoe-poster, coastal-road-trip, casting-reference-sheet-a, casting-reference-sheet-b, sunglasses-product-poster, lakeside-spring-portrait, casual-outdoor-portrait, short-hair-teal-portrait, athletic-dark-portrait, headshot-casting-grid-a, phantom-shoe-ad, urban-calm-cover, headshot-casting-grid-b, ice-cream-flowers-portrait, shoe-lifestyle-collage, gym-set-portrait, sunlit-car-portrait, poolside-portrait, garden-floral-portrait, lip-gloss-product-shot, sedan-poster, coconut-cooler-poster, character-reference-sheet, sofa-cat-portrait, gym-pose-pink, anime-style-illustration, own-the-move-poster, hairstyle-options-sheet, athletic-field-portrait, anime-couple-illustration, earbuds-product-poster, streetwear-character-figure, soccer-jersey-portrait, beauty-hand-on-face, casual-mirror-selfie, studio-portrait-arms-up, cozy-sweater-selfie, golden-hour-sunglasses-portrait, silver-sports-car-poster, casual-bedroom-selfie, los-angeles-travel-poster, car-lean-portrait, soft-portrait-white-blouse, dramatic-male-portrait, striped-wall-portrait, extreme-closeup-beauty, pink-floral-portrait, blue-blazer-coastal-portrait, snack-beverage-grid, automotive-poster-series, studio-portrait-warm

## Reference files

Load these only when the task calls for them.

| File | Read it when |
|---|---|
| `references/conventions.md` | Writing or editing a component; full class contract, a11y, dark mode |
| `references/recipes.md` | Composing a screen; decision tables, nesting order, framework porting |
| `references/registry-api.md` | Fetching over the network; JSON shapes, jq recipes, adding a component |
| `references/troubleshooting.md` | Something renders wrong; symptom → cause → fix |
| `references/components.md` | Full detail on every component — tags, surface, portability |
| `references/images.md` | Full image catalogue with tags |

## Do not

- Do not add React, JSX, `className`, or any JavaScript.
- Do not invent component names — every valid name is in the index above.
- Do not strip a `<style>` block or a hidden `<input>`.
- Do not emit a color utility without its `dark:` partner.
- Do not use `text-gray-500` on a dark surface (3.9:1 — below the 4.5:1 floor).


---

<!-- references/conventions.md -->

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


---

<!-- references/recipes.md -->

# Recipes — composing real screens

## Pick a component: decision table

| The user says… | Reach for |
|---|---|
| "chat UI", "assistant", "conversation" | `agent-chat` (whole shell) or `message-list` + `input-bar` |
| "full chat product page" | `chat-landing` (home) → `chat-conversation` (thread) |
| "show the model thinking / streaming" | `text-shimmer`, `spiral-loader` |
| "tool call", "function call", "agent ran a command" | `tool-group`, `bash-tool`, `edit-tool`, `search-tool`, `todo-tool`, `plan-tool` |
| "prompt box", "composer" | `prompt-composer`, `input-bar`, `ide-composer` |
| "landing page", "marketing site" | `site-landing`, or compose `section-*` |
| "pricing" | `site-pricing`, `section-pricing`, `section-plan-picker` |
| "docs site" | `site-docs`, `site-component-docs`, `site-setup-guide` |
| "shop", "ecommerce", "storefront" | `site-storefront`, `site-product-gallery` |
| "code editor UI", "IDE" | `site-ide-shell` |
| "mobile app screen" | `app-onboarding`, `app-feed`, `app-wallet`, `app-checkout`, `app-chat-inbox`, `app-profile-settings` |
| "dashboard", "internal tool" | `site-dashboard` + `card`, `table`, `tabs`, `alert` |
| "data table", "list of rows" | `table` (static), `table-interactive` (selectable) |
| "loading state", "skeleton" | `skeleton-card`, `skeleton-list`, `spinner`, `spinner-overlay` |
| "settings", "preferences", "toggles" | `switch`, `switch-list` |
| "sidebar nav" / "tab bar" | `nav-vertical` / `nav-horizontal`, `tabs` |
| "sign in", "login" | `site-auth`, `auth-card`, `login-glass` |
| "photo", "hero image", "portrait" | any `image-*` (110 available) |

## Surface → canvas (decides how it renders)

| `surface` | Canvas | Used by |
|---|---|---|
| `app` | 390 × 844, phone chrome | Apps only |
| `site` | 1280 × 800 | full pages |
| `section` | 1280 × auto | page sections |
| *(omitted)* → `element` | 640 × auto, no chrome | Agent + UI Elements |

Agent/UI items normally omit `surface`. A few agent items (`chat-landing`,
`chat-conversation`) set `surface: "site"` because they are whole pages.

## Recipe — agent chat surface

Fastest path is one component:

```bash
BASE=https://xnsteam-ai.github.io/Html-library/r
curl -s $BASE/agent-chat.json | jq -r '.files[0].content'
```

To build it from parts instead, nest in this order:

```
chat-welcome        ← empty state, before the first message
message-list        ← the thread
  user-message      ← one turn from the user
  markdown          ← one turn from the assistant (rendered prose)
  tool-group        ← collapsed tool calls
    bash-tool / edit-tool / search-tool / todo-tool / plan-tool
  text-shimmer      ← "thinking…" while streaming
input-bar           ← the composer
  attachment-button + file-attachment
  model-picker / mode-selector
  send-button
```

## Recipe — marketing landing page

Either take `site-landing` whole, or stack sections in this order:

```
section-hero
section-logo-cloud
section-features   (or section-bento)
section-stats
section-testimonials  (or section-customer-stories)
section-pricing    (or section-plan-picker)
section-faq
section-cta
section-newsletter
section-footer
```

Each is `surface: "section"` — 1280 wide, natural height. Drop them into one
column in that order and you have a full page.

## Recipe — internal dashboard

```
nav-vertical          ← left rail
  tabs                ← view switcher
  card                ← stat tiles
  table-interactive   ← the data, with bulk actions
  alert               ← toasts / banners
  empty-state         ← zero-results
  skeleton-list       ← while loading
```

## Recipe — drop in an image

```bash
curl -s $BASE/image-sunlit-portrait.json | jq -r '.files[0].content'
```

The `<img>` points at a deployed CDN URL and is portable as-is. Every image item
also carries a `prompt` object — a structured recreation brief (subject,
composition, **framing geometry**, environment, lighting, camera, atmosphere)
you can hand to an image model to regenerate a similar shot:

```bash
curl -s $BASE/image-sunlit-portrait.json | jq '.prompt'
```

The `framing` block is the part most prompts miss: it pins subject scale, the
subject's bounding box, anchor lines, edge crops and negative space as
percentages of the frame, so a recreation lands at the same size and position.

## Porting to a framework

The markup is a starting point, not a limitation.

**React** — rename `class` → `className`, `for` → `htmlFor`, close void tags,
and convert inline `style="a: b"` to `style={{ a: 'b' }}`:

```jsx
export function SendButton({ onSend, busy }) {
  return (
    <button
      onClick={onSend}
      aria-label={busy ? 'Stop generating' : 'Send message'}
      className="flex h-8 w-8 items-center justify-center rounded-full
                 bg-gray-900 text-white transition hover:bg-gray-700
                 dark:bg-white dark:text-neutral-900"
    >
      {busy ? <span className="h-2.5 w-2.5 rounded-[2px] bg-current" /> : <ArrowUp />}
    </button>
  )
}
```

**Vue / Svelte / Astro / Blade / ERB / Jinja** — paste verbatim. They all accept
`class`. Replace the CSS-only state (hidden radio/checkbox) with real state
bindings when you need programmatic control.

**Keep or drop the CSS-only interactivity?** Keep it for static pages and
prototypes. Drop it once the framework owns the state — a controlled `<Tabs>`
should not also have a hidden radio group.

## Composition ladder

Bigger components already contain smaller ones. Do not double-nest.

```
site-*            contains sections, nav, cards
  section-*       contains card / button / badge
agent-chat        contains message-list + input-bar + tool cards
  message-list    contains user-message + markdown
  input-bar       contains send-button + attachment-button + model-picker
  tool-group      contains bash-tool / edit-tool / search-tool / …
```

If you already pasted `agent-chat`, you do **not** also paste `input-bar`.


---

<!-- references/registry-api.md -->

# Registry API — fetching components

The registry is static JSON committed to the repo. No CLI, no auth, no build step.

## Hosts

| Host | Base URL | When to use |
|---|---|---|
| GitHub Pages (canonical, CDN-cached) | `https://xnsteam-ai.github.io/Html-library/r` | Default. |
| raw.githubusercontent (fallback) | `https://raw.githubusercontent.com/xnsteam-ai/Html-library/main/public/r` | Works before Pages is enabled. |

## The three endpoints

```bash
BASE=https://xnsteam-ai.github.io/Html-library/r

curl -s $BASE/index.json     # every component, with urls
curl -s $BASE/<name>.json    # one component, markup included
curl -s $BASE/schema.json    # JSON Schema for an item
```

## Get markup in one line

```bash
curl -s $BASE/agent-chat.json | jq -r '.files[0].content' > agent-chat.html
```

`.files[0].content` is the complete markup. It is the only field you need.

## Item shape

```json
{
  "$schema": "https://xnsteam-ai.github.io/Html-library/r/schema.json",
  "name": "agent-chat",
  "title": "Agent Chat",
  "description": "A complete conversation shell…",
  "category": "agent",
  "type": "html",
  "version": "0.1.0",
  "tailwind": "^4.0.0",
  "tags": ["chat", "shell", "conversation"],
  "surface": "site",
  "files": [{ "path": "agent-chat.html", "type": "html", "content": "<div …>" }]
}
```

`surface` appears only on whole-screen items. `prompt` appears only on images.

## Index shape

```json
{
  "name": "html-library",
  "version": "0.1.0",
  "homepage": "https://xnsteam-ai.github.io/Html-library",
  "baseUrl": "https://xnsteam-ai.github.io/Html-library/r",
  "rawBaseUrl": "https://raw.githubusercontent.com/xnsteam-ai/Html-library/main/public/r",
  "categories": [{ "name": "ui", "title": "UI Elements", "count": 23 }],
  "items": [
    {
      "name": "agent-chat", "title": "Agent Chat",
      "description": "…", "category": "agent", "tags": ["chat"],
      "url": "…/r/agent-chat.json", "rawUrl": "…/agent-chat.json"
    }
  ]
}
```

## Useful jq recipes

```bash
# every component name
curl -s $BASE/index.json | jq -r '.items[].name'

# names in one category
curl -s $BASE/index.json | jq -r '.items[] | select(.category=="ui") | .name'

# search by tag
curl -s $BASE/index.json | jq -r '.items[] | select(.tags[]?=="chat") | .name'

# search title + description + tags for a word
curl -s $BASE/index.json | jq -r --arg q table \
  '.items[] | select((.title+" "+.description+" "+(.tags|join(" ")))|ascii_downcase|contains($q)) | .name'

# name + description table
curl -s $BASE/index.json | jq -r '.items[] | "\(.name)\t\(.description)"'

# fetch several at once
for n in button card input alert; do
  curl -s $BASE/$n.json | jq -r '.files[0].content' > $n.html
done
```

## No network? Read the repo directly

Source of truth is `registry/<category>/<name>/{component.html,meta.json}`.
Generated output is `public/r/<name>.json`. Reading either is equivalent —
just read `component.html`, it is the same string as `files[0].content`.

## Adding a component

```bash
mkdir -p registry/ui/tooltip
$EDITOR registry/ui/tooltip/component.html
$EDITOR registry/ui/tooltip/meta.json
npm run build:registry     # validates, regenerates public/r — commit both
```

`meta.json` requires `name` (must equal the folder), `title`, `description`,
`category`. Optional: `order`, `tags`, `previewBg`, `previewHeight`,
`previewAlign`, `tagline`, `status`. Items in `apps`/`sites` also require
`surface`.

### The validator rejects

- `<script>`, `<link>`, `<iframe>`, `@import`
- `className`
- duplicate `id`, or `<label for>` with no matching `id` in the file
- a `name` that disagrees with its folder, or a duplicate name
- an unknown category, or a missing required field
- an `apps`/`sites` item without a valid `surface`

### It warns (does not block)

- remote asset URLs
- a scoped `<style>` block


---

<!-- references/troubleshooting.md -->

# Troubleshooting

Symptom → cause → fix. Check these before rewriting a component.

## Text is invisible / black-on-black / washed out

**Cause.** The component uses app-only theme tokens (`text-muted-foreground`,
`text-foreground`, `bg-muted`, `border-border`) and your project does not define
them. 55 of 191 components do this.

**Fix.** Apply the substitution table in `conventions.md`. Quick version:

| Replace | With |
|---|---|
| `text-muted-foreground` | `text-neutral-500 dark:text-neutral-400` |
| `text-foreground` | `text-neutral-900 dark:text-neutral-100` |
| `bg-muted` | `bg-neutral-100 dark:bg-neutral-900` |
| `bg-background` | `bg-white dark:bg-neutral-950` |
| `border-border` | `border-neutral-200 dark:border-white/10` |

**Or** use the component page's **Copy HTML** button, which emits a standalone
document with the Tailwind CDN and the theme attached.

## The component renders completely unstyled

**Cause.** Tailwind is not running, or it is not scanning the file.

**Fix.** Confirm Tailwind is installed and that your content/source globs
include the file you pasted into. In Tailwind v4 the docs app uses
`@source '../../registry/**/*.html'` — your project needs an equivalent glob for
wherever you put the markup.

## Dark mode does nothing

**Cause.** Tailwind's dark variant is not on the class strategy.

**Fix.**
- v3: `darkMode: 'class'` in `tailwind.config.js`
- v4: `@custom-variant dark (&:where(.dark, .dark *));` in your CSS

Then toggle a `dark` class on `<html>`.

## Two copies of the component control each other

**Cause.** Duplicate `id` / `name` attributes. CSS-only state is keyed on them.

**Fix.** Re-namespace every `id`, `for` and `name` in the second copy:

```bash
sed -e 's/model-picker-/model-picker-2-/g' component.html > copy-2.html
```

## Tabs / toggle / dropdown do not respond

**Causes, in order of likelihood.**

1. The hidden `<input>` was deleted. The `sr-only` radio/checkbox **is** the
   state — removing it removes the behavior.
2. `<label for>` no longer matches an `id`.
3. The named group was dropped — `group-has-[#x:checked]/picker` needs
   `group/picker` on the ancestor.
4. Tailwind is not generating the arbitrary variant because it never saw the
   class string. Add the file to your content globs.

## `:has()` selectors do nothing

**Cause.** `:has()` needs Safari 15.4+, Chrome 105+, Firefox 121+.

**Fix.** For older targets, replace `has-checked:` styling with a small JS
class toggle. Affects `table-interactive` and `model-picker`.

## Animation does not run

**Cause.** The component's `<style>` block was stripped, or the user has
reduced-motion enabled (which every animated component honors deliberately).

**Fix.** Keep the `<style>` block — `@keyframes` cannot be expressed as a
utility class. If you inline it elsewhere, keep the prefixed class names.

## A Fluent-styled component looks wrong

**Cause.** Its `<style>` block was removed. Those components define their whole
palette in CSS custom properties scoped to a root class
(`.fsp-root { --fluent-brand: #0f6cbd }`) with a `.dark` override.

**Fix.** Keep both the `<style>` block and the root class on the wrapper. These
components are otherwise fully portable — they do not touch the app theme.

## Images 404

**Cause.** You are running the docs app locally before deploying. Registry
markup points at the deployed CDN URL by design, so copied output stays
portable. The app rewrites it for local preview only.

**Fix.** Nothing to fix for copied output — it works in your project. If you
want local files, download the asset and change the `src` yourself.

## `npm run build:registry` fails

Read the error; the validator is specific. Most common:

| Error | Fix |
|---|---|
| `contains a <script> tag` | Remove it. Components ship no JS. |
| `uses className` | These are `.html` files — use `class`. |
| `duplicate id attribute(s)` | Namespace them per component. |
| `<label for="x"> has no matching id` | Fix the pair. |
| `"surface" must be one of app, site, section` | `apps`/`sites` items require it. |
| `meta.json name … does not match the folder` | Rename one to match. |

## CI says "registry output is stale"

You edited `registry/` but did not regenerate.

```bash
npm run build:registry && git add public/r && git commit
```

On Windows, if the diff looks empty but CI still fails, you have CRLF-smudged
source. Normalize to LF and rebuild:

```bash
git config core.autocrlf false
```


---

<!-- references/components.md -->

# Component reference

Every non-image component with its surface, tags and class vocabulary.
"⚠" lists the app-only tokens it uses — substitute them per `conventions.md`
before pasting into a project that is not this repo.

## Apps — 6

Complete mobile app screens, drawn at 390x844.

| Name | Title | Surface | Tags | Classes |
|---|---|---|---|---|
| `app-onboarding` | Onboarding | app | onboarding, welcome, auth | portable |
| `app-feed` | Content Feed | app | feed, list, tab-bar | portable |
| `app-wallet` | Wallet | app | finance, balance, transactions | portable |
| `app-checkout` | Checkout | app | commerce, checkout, payment | portable |
| `app-chat-inbox` | Chat Inbox | app | chat, inbox, list | portable |
| `app-profile-settings` | Profile & Settings | app | profile, settings, account | portable |

## Sites — 29

Website pages and the marketing sections they are built from.

| Name | Title | Surface | Tags | Classes |
|---|---|---|---|---|
| `site-landing` | Landing Page | site | marketing, hero, landing | ⚠ foreground, muted-foreground |
| `site-pricing` | Pricing Page | site | pricing, marketing, plans | ⚠ foreground, muted-foreground |
| `site-dashboard` | Dashboard | site | dashboard, admin, analytics | ⚠ foreground, muted-foreground |
| `site-docs` | Documentation | site | docs, layout, reference | ⚠ foreground, muted-foreground |
| `site-auth` | Sign In | site | auth, login, split | ⚠ foreground, muted-foreground |
| `site-agents` | Agents Landing | site | landing, marketing, hero, product | ⚠ muted-foreground |
| `site-research` | Research Home | site | landing, editorial, bento, search | ⚠ foreground, muted-foreground |
| `site-fintech-hero` | Fintech Hero | site | landing, hero, fintech, gradient | ⚠ foreground, muted-foreground |
| `section-hero` | Hero | section | hero, marketing, landing | ⚠ foreground, muted-foreground |
| `section-features` | Features | section | features, grid, marketing | ⚠ foreground, muted-foreground |
| `section-bento` | Bento Grid | section | bento, features, grid | ⚠ foreground, muted-foreground |
| `section-pricing` | Pricing | section | pricing, plans, toggle | ⚠ foreground, muted-foreground |
| `section-testimonials` | Testimonials | section | testimonials, slider, social-proof | ⚠ foreground, muted-foreground |
| `section-faq` | FAQ | section | faq, accordion, support | ⚠ foreground, muted-foreground |
| `section-cta` | CTA | section | cta, banner, conversion | ⚠ background |
| `section-stats` | Stats | section | stats, metrics, numbers | portable |
| `section-logo-cloud` | Logo Cloud | section | logo-cloud, social-proof, trust | ⚠ muted-foreground |
| `section-team` | Team | section | team, about, bios | ⚠ foreground, muted-foreground |
| `section-newsletter` | Newsletter | section | newsletter, form, email | ⚠ foreground, muted-foreground |
| `site-component-docs` | Component Docs | site | docs, design-system, reference | portable · scoped `<style>` |
| `section-footer` | Footer | section | footer, navigation, legal | ⚠ foreground, muted-foreground |
| `site-storefront` | Storefront | site | ecommerce, nav, mega-menu | portable · scoped `<style>` |
| `section-customer-stories` | Customer Stories | section | customers, case study, marketing, grid | ⚠ foreground, muted-foreground |
| `site-product-gallery` | Product Gallery | site | ecommerce, gallery, products | portable · scoped `<style>` |
| `section-plan-picker` | Plan Picker | section | pricing, plans, credits, upgrade | ⚠ foreground, muted-foreground |
| `site-ide-shell` | IDE Shell | site | ide, editor, shell | portable · scoped `<style>` |
| `section-service-grid` | Service Grid | section | services, directory, cards, grid | portable |
| `site-setup-guide` | Setup Guide | site | docs, onboarding, guide | portable · scoped `<style>` |
| `section-lead-form` | Lead Gen Form | section | form, lead gen, landing, long-form | ⚠ foreground, muted-foreground |

## Agent Elements — 23

Chat surfaces, composers and tool-call cards.

| Name | Title | Surface | Tags | Classes |
|---|---|---|---|---|
| `agent-chat` | Agent Chat | element | chat, shell, conversation | ⚠ foreground, muted-foreground |
| `message-list` | Message List | element | messages, thread, streaming | ⚠ foreground, muted-foreground |
| `input-bar` | Input Bar | element | composer, input, textarea | ⚠ foreground, muted-foreground |
| `suggestions` | Suggestions | element | prompts, chips, empty-state | ⚠ foreground, muted-foreground |
| `model-picker` | Model Picker | element | menu, dropdown, model | ⚠ foreground, muted-foreground |
| `mode-selector` | Mode Selector | element | tabs, segmented, toggle | ⚠ foreground, muted-foreground |
| `user-message` | User Message | element | message, bubble, user | ⚠ foreground, muted-foreground |
| `markdown` | Markdown | element | typography, prose, output | ⚠ foreground, muted-foreground |
| `send-button` | Send Button | element | button, send, states | ⚠ muted-foreground |
| `attachment-button` | Attachment Button | element | menu, attachment, upload | ⚠ muted-foreground |
| `file-attachment` | File Attachment | element | file, upload, progress | ⚠ foreground, muted-foreground |
| `text-shimmer` | Text Shimmer | element | loading, animation, status | ⚠ muted-foreground · scoped `<style>` |
| `spiral-loader` | Spiral Loader | element | loading, spinner, status | ⚠ foreground, muted-foreground |
| `bash-tool` | Bash Tool | element | tool, terminal, output | ⚠ foreground, muted-foreground |
| `edit-tool` | Edit Tool | element | tool, diff, editor | ⚠ foreground, muted-foreground |
| `search-tool` | Search Tool | element | tool, search, results | ⚠ foreground, muted-foreground |
| `todo-tool` | Todo Tool | element | tool, todo, progress | ⚠ foreground, muted-foreground |
| `plan-tool` | Plan Tool | element | tool, plan, approval | ⚠ foreground, muted-foreground |
| `tool-group` | Tool Group | element | tool, collapsible, timeline | ⚠ foreground, muted-foreground |
| `ide-composer` | IDE Composer | element | composer, ide, dark, toolbar | portable |
| `chat-landing` | Chat Landing | site | chat, landing, composer, suggestions | portable · scoped `<style>` |
| `chat-welcome` | Chat Welcome | element | chat, empty state, composer, welcome | ⚠ foreground, muted-foreground |
| `chat-conversation` | Chat Conversation | site | chat, conversation, artifact, tool-calls | portable · scoped `<style>` |

## UI Elements — 23

General-purpose primitives that pair with the agent set.

| Name | Title | Surface | Tags | Classes |
|---|---|---|---|---|
| `button` | Button | element | button, action, variants | ⚠ foreground, muted-foreground |
| `badge` | Badge | element | badge, tag, status | ⚠ muted-foreground |
| `card` | Card | element | card, surface, layout | ⚠ foreground, muted-foreground |
| `input` | Input | element | form, input, field | ⚠ foreground, muted-foreground |
| `alert` | Alert | element | alert, feedback, banner | ⚠ background, border, foreground, muted-foreground |
| `tabs` | Tabs | element | tabs, navigation, segmented | ⚠ foreground, muted-foreground |
| `avatar` | Avatar | element | avatar, identity, stack | ⚠ foreground, muted-foreground |
| `empty-state` | Empty State | element | empty, placeholder, zero-state | ⚠ foreground, muted-foreground |
| `radio-card-group` | Radio Card Group | element | radio, form, selection, pricing | ⚠ foreground, muted-foreground |
| `prompt-composer` | Prompt Composer | element | textarea, composer, toolbar, form | ⚠ foreground, muted-foreground |
| `auth-card` | Auth Card | element | auth, login, form, card | ⚠ foreground, muted-foreground |
| `badge-pill` | Badge Pill | element | badge, label, variants, status | ⚠ foreground, muted-foreground |
| `login-glass` | Login Glass | element | auth, login, glassmorphism, form | ⚠ foreground, muted-foreground · scoped `<style>` |
| `nav-horizontal` | Nav Horizontal | element | nav, tabs, navigation | portable · scoped `<style>` |
| `nav-vertical` | Nav Vertical | element | nav, sidebar, navigation | portable · scoped `<style>` |
| `skeleton-card` | Skeleton Card | element | skeleton, loading, placeholder | portable · scoped `<style>` |
| `skeleton-list` | Skeleton List | element | skeleton, loading, list | portable · scoped `<style>` |
| `spinner` | Spinner | element | spinner, loading, indicator | portable · scoped `<style>` |
| `spinner-overlay` | Spinner Overlay | element | spinner, loading, overlay | portable · scoped `<style>` |
| `switch` | Switch | element | switch, toggle, form | portable · scoped `<style>` |
| `switch-list` | Switch List | element | switch, toggle, settings | portable · scoped `<style>` |
| `table` | Table | element | table, data, list | portable · scoped `<style>` |
| `table-interactive` | Table Interactive | element | table, selection, bulk-actions | portable · scoped `<style>` |


---

<!-- references/images.md -->

# Images — 110

Ready-to-paste photography. The `<img>` points at a deployed CDN URL and is
portable as-is; do not rewrite it to a relative path.

```bash
BASE=https://xnsteam-ai.github.io/Html-library/r
curl -s $BASE/image-sunlit-portrait.json | jq -r '.files[0].content'   # markup
curl -s $BASE/image-sunlit-portrait.json | jq '.prompt'                # brief
```

## The `prompt` object

Every image carries a structured recreation brief. All fields are optional —
anything not observable in the file is omitted rather than guessed.

| Block | Fields |
|---|---|
| `subject` | age, descent, physical, expression, clothing |
| `composition` | shotType, angle, placement, distance, depthOfField, focus |
| `framing` | subjectScale, subjectBox, anchors, edges, negativeSpace |
| `environment` | setting, background, depth |
| `lighting` | quality, direction, temperature, shadows |
| `camera` | lens, quality, artifacts, aesthetic |
| `atmosphere` | mood, story, micro |

`framing` is the block most prompts omit. It pins subject scale, bounding box,
anchor lines, edge crops and negative space as percentages of the frame, so a
recreation lands at the same size and position instead of being re-centred.

## Catalogue

| Name | Title | Tags |
|---|---|---|
| `image-feathered-motion` | Feathered Motion | portrait, editorial, dark, fashion |
| `image-weathered-portrait` | Weathered Portrait | portrait, character, texture, cinematic |
| `image-skincare-sheet` | Skincare Product Sheet | product, skincare, grid, commercial |
| `image-iced-coffee-mockup` | Iced Coffee Mockup | product, beverage, mockup, splash |
| `image-motion-blur-crowd` | Motion Blur Crowd | motion, blur, crowd, editorial |
| `image-daisy-displacement` | Daisy Displacement | portrait, glitch, floral, surreal |
| `image-headphone-pop` | Headphone Pop | portrait, music, colour, youth |
| `image-wildflower-field` | Wildflower Field | nature, flowers, lifestyle, outdoor |
| `image-sky-skate-poster` | Sky Skate Poster | poster, skate, sky, sport |
| `image-feather-collar` | Feather Collar | portrait, studio, feather, teal |
| `image-streetwear-collage` | Streetwear Collage | collage, streetwear, grid, fashion |
| `image-golden-cover` | Golden Cover | cover, magazine, gold, portrait |
| `image-expression-grid` | Expression Grid | grid, expressions, contact sheet, denim |
| `image-plush-toy-set` | Plush Toy Set | product, plush, toys, grid |
| `image-summer-twirl` | Summer Twirl | fashion, summer, sky, movement |
| `image-boxing-cover` | Boxing Cover | cover, magazine, sport, typography |
| `image-flat-lay-fashion` | Flat Lay Fashion | fashion, flat lay, overhead, yellow |
| `image-device-beach-ad` | Device Beach Ad | ad, device, product, lifestyle |
| `image-mascot-hoodie` | Mascot Hoodie | mascot, character, blue, apparel |
| `image-idol-grid` | Idol Grid | grid, idol, green, portrait |
| `image-newsprint-editorial` | Newsprint Editorial | editorial, layout, fashion, newsprint |
| `image-portrait-collage` | Portrait Collage | collage, portrait, polaroid, print |
| `image-blue-bloom` | Blue Bloom | portrait, surreal, floral, blue |
| `image-cap-selfie` | Cap Selfie | street, selfie, casual, youth |
| `image-blossom-grid` | Blossom Grid | grid, pastel, blossom, spring |
| `image-sunlit-hands` | Sunlit Hands | portrait, sunlight, flare, warm |
| `image-blue-knit` | Blue Knit | portrait, knit, blue, warm |
| `image-own-the-sky` | Own The Sky | poster, sport, typography, blue |
| `image-sunlit-portrait` | Sunlit Portrait | portrait, sunlight, sky, natural |
| `image-fruit-soda-set` | Fruit Soda Set | product, beverage, fruit, grid |
| `image-ball-cap-portrait` | Ball Cap Portrait | portrait, casual, studio, neutral |
| `image-puffer-jacket-pair` | Puffer Jacket Pair | product, apparel, jacket, flat lay |
| `image-day-night-comparison` | Day And Night Comparison | portrait, comparison, beauty, split |
| `image-flat-cap-contact-sheet` | Flat Cap Contact Sheet | portrait, contact sheet, grid, casting reference |
| `image-phone-spec-diagram` | Phone Spec Diagram | product, tech, diagram, phone |
| `image-tailored-coat-street-style` | Tailored Coat Street Style | fashion, menswear, street, lookbook |
| `image-mirror-selfie-athletic` | Mirror Selfie, Athletic Wear | portrait, fitness, selfie, lifestyle |
| `image-smart-glasses-badge` | Smart Glasses Badge | product, tech, wearable, badge |
| `image-teal-eyes-portrait` | Teal Eyes Portrait | portrait, beauty, teal, mood |
| `image-roast-chicken-recipe-card` | Roast Chicken Recipe Card | infographic, food, recipe, card |
| `image-phone-case-exploded-view` | Phone Case Exploded View | product, tech, diagram, phone case |
| `image-performance-shoe-ad` | Performance Shoe Ad | poster, product, footwear, sport |
| `image-red-sport-poster` | Red Sport Brand Poster | poster, sport, apparel, editorial |
| `image-backlit-warehouse-portrait` | Backlit Warehouse Portrait | portrait, moody, industrial, cinematic |
| `image-urban-street-portrait` | Urban Street Portrait | portrait, street, urban, menswear |
| `image-outfit-lineup-grid` | Outfit Lineup Grid | fashion, lookbook, menswear, grid |
| `image-outdoor-apparel-poster` | Outdoor Apparel Poster | poster, outdoor, apparel, editorial |
| `image-snow-sport-portrait` | Snow Sport Portrait | portrait, winter, sport, blue |
| `image-beauty-close-up-necklace` | Beauty Close-Up | portrait, beauty, jewelry, close-up |
| `image-headphones-product-poster` | Headphones Product Poster | poster, product, audio, tech |
| `image-yellow-sports-car-poster` | Yellow Sports Car Poster | poster, automotive, sports car, product |
| `image-sports-car-spec-sheet` | Sports Car Spec Sheet | poster, automotive, spec sheet, product |
| `image-skincare-routine-card` | Skincare Routine Card | infographic, beauty, skincare, product |
| `image-blue-coupe-poster` | Blue Coupe Poster | poster, automotive, coupe, product |
| `image-beach-hat-portrait` | Beach Hat Portrait | portrait, swimwear, beach, summer |
| `image-winter-jacket-ad` | Winter Jacket Ad | poster, apparel, winter, editorial |
| `image-motion-pose-poster` | Motion Pose Poster | poster, dance, motion, editorial |
| `image-phone-call-poster` | Phone Call Poster | poster, product, tech, portrait |
| `image-fitness-pose-portrait` | Fitness Pose Portrait | portrait, fitness, gym, athletic |
| `image-motion-shoe-poster` | Motion Shoe Poster | poster, product, footwear, motion |
| `image-coastal-road-trip` | Coastal Road Trip | landscape, travel, coastal, van |
| `image-casting-reference-sheet-a` | Casting Reference Sheet A | casting, reference, grid, fashion |
| `image-casting-reference-sheet-b` | Casting Reference Sheet B | casting, reference, grid, headshots |
| `image-sunglasses-product-poster` | Sunglasses Product Poster | poster, product, eyewear, editorial |
| `image-lakeside-spring-portrait` | Lakeside Spring Portrait | portrait, outdoor, spring, lifestyle |
| `image-casual-outdoor-portrait` | Casual Outdoor Portrait | portrait, casual, lifestyle, outdoor |
| `image-short-hair-teal-portrait` | Short Hair Portrait | portrait, beauty, teal, hairstyle |
| `image-athletic-dark-portrait` | Athletic Dark Portrait | portrait, fitness, dark, editorial |
| `image-headshot-casting-grid-a` | Headshot Casting Grid A | casting, reference, grid, headshots |
| `image-phantom-shoe-ad` | Phantom Shoe Ad | poster, product, footwear, sport |
| `image-urban-calm-cover` | Urban Calm Cover | poster, illustration, cover, editorial |
| `image-headshot-casting-grid-b` | Headshot Casting Grid B | casting, reference, grid, headshots |
| `image-ice-cream-flowers-portrait` | Ice Cream And Flowers | portrait, lifestyle, playful, editorial |
| `image-shoe-lifestyle-collage` | Shoe Lifestyle Collage | product, footwear, collage, lifestyle |
| `image-gym-set-portrait` | Gym Set Portrait | portrait, fitness, gym, athletic |
| `image-sunlit-car-portrait` | Sunlit Car Portrait | portrait, automotive, lifestyle, golden hour |
| `image-poolside-portrait` | Poolside Portrait | portrait, swimwear, pool, summer |
| `image-garden-floral-portrait` | Garden Floral Portrait | portrait, floral, garden, outdoor |
| `image-lip-gloss-product-shot` | Lip Gloss Product Shot | product, beauty, cosmetics, close-up |
| `image-sedan-poster` | Sedan Poster | poster, automotive, sedan, product |
| `image-coconut-cooler-poster` | Coconut Cooler Poster | poster, beverage, product, summer |
| `image-character-reference-sheet` | Character Reference Sheet | illustration, character design, reference, concept art |
| `image-sofa-cat-portrait` | Sofa With Cat | portrait, lifestyle, pet, home |
| `image-gym-pose-pink` | Gym Pose Portrait | portrait, fitness, gym, athletic |
| `image-anime-style-illustration` | Anime-Style Illustration | illustration, anime style, scenic, character |
| `image-own-the-move-poster` | Own The Move Poster | poster, sport, apparel, editorial |
| `image-hairstyle-options-sheet` | Hairstyle Options Sheet | reference, beauty, hairstyle, grid |
| `image-athletic-field-portrait` | Athletic Field Portrait | portrait, fitness, outdoor, golden hour |
| `image-anime-couple-illustration` | Anime-Style Couple Illustration | illustration, anime style, couple, sky |
| `image-earbuds-product-poster` | Earbuds Product Poster | poster, product, audio, tech |
| `image-streetwear-character-figure` | Streetwear Character Figure | illustration, character design, streetwear, concept art |
| `image-soccer-jersey-portrait` | Soccer Jersey Portrait | portrait, sport, fashion, jersey |
| `image-beauty-hand-on-face` | Beauty Portrait, Hand On Face | portrait, beauty, studio, elegant |
| `image-casual-mirror-selfie` | Casual Mirror Selfie | portrait, casual, selfie, lifestyle |
| `image-studio-portrait-arms-up` | Studio Portrait, Arms Raised | portrait, studio, beauty, editorial |
| `image-cozy-sweater-selfie` | Cozy Sweater Selfie | portrait, casual, cozy, lifestyle |
| `image-golden-hour-sunglasses-portrait` | Golden Hour Sunglasses Portrait | portrait, beauty, sunglasses, golden hour |
| `image-silver-sports-car-poster` | Silver Sports Car Poster | poster, automotive, sports car, product |
| `image-casual-bedroom-selfie` | Casual Bedroom Selfie | portrait, casual, lifestyle, selfie |
| `image-los-angeles-travel-poster` | Los Angeles Travel Poster | poster, illustration, travel, city |
| `image-car-lean-portrait` | Car Lean Portrait | portrait, automotive, lifestyle, moody |
| `image-soft-portrait-white-blouse` | Soft Portrait, White Blouse | portrait, beauty, soft, editorial |
| `image-dramatic-male-portrait` | Dramatic Male Portrait | portrait, moody, editorial, dark |
| `image-striped-wall-portrait` | Striped Wall Portrait | portrait, colorful, studio, fashion |
| `image-extreme-closeup-beauty` | Extreme Close-Up Beauty | portrait, beauty, close-up, editorial |
| `image-pink-floral-portrait` | Pink Floral Portrait | portrait, floral, playful, pastel |
| `image-blue-blazer-coastal-portrait` | Blue Blazer Coastal Portrait | portrait, fashion, coastal, editorial |
| `image-snack-beverage-grid` | Snack And Beverage Grid | product, food, beverage, grid |
| `image-automotive-poster-series` | Automotive Poster Series | poster, automotive, product, editorial |
| `image-studio-portrait-warm` | Studio Portrait, Warm Tone | portrait, studio, warm, editorial |

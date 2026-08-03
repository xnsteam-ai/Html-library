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

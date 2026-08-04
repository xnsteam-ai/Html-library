<!-- GENERATED — do not edit. Copied from skills/html-library/ by
     packages/mcp-server/scripts/sync-core.mjs. Edit the original and
     re-run `npm run build:mcp`. -->

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

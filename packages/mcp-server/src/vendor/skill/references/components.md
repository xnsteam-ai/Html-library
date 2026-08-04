<!-- GENERATED — do not edit. Copied from skills/html-library/ by
     packages/mcp-server/scripts/sync-core.mjs. Edit the original and
     re-run `npm run build:mcp`. -->

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
| `chat-welcome` | Chat Welcome | element | chat, empty state, composer, welcome | portable |
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

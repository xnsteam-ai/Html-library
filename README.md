# HTML Library

An open-source component library where every component is **plain HTML + Tailwind CSS**, and **GitHub is the registry**.

No package to install, no framework to adopt. Copy the markup, or fetch it over HTTP from the registry that ships inside this repo.

- **50 components** — 6 mobile app screens, 17 site pages and page sections, 19 agent-interface elements, 8 general UI primitives
- **Genuinely interactive, with zero JavaScript** — menus open, tabs switch panels, checkboxes tick, alerts dismiss, switches flip. Built on `<details>`/`<summary>` and hidden radios/checkboxes driving `peer-checked:` / `has-checked:` / `group-has-[…]:`
- **Light and dark** — every component carries `dark:` variants
- **Self-contained** — no scripts, no external stylesheets, inline SVG icons
- **Browsable** — a React docs app with live previews, search (⌘K), per-component copy, a gallery view for whole screens, and an **Open in new tab** control that renders any component full screen with no docs chrome (`#/preview/<name>`)

```
registry/<category>/<name>/component.html   source of truth
registry/<category>/<name>/meta.json        title, description, tags, preview settings
public/r/<name>.json                        generated registry item  ← curl this
public/r/index.json                         generated index
src/                                        the docs frontend (Vite + React + Tailwind v4)
```

## Use a component

```bash
# GitHub Pages (canonical)
curl -s https://xnsteam-ai.github.io/Html-library/r/agent-chat.json \
  | jq -r '.files[0].content' > agent-chat.html

# raw.githubusercontent.com (fallback — works without Pages)
curl -s https://raw.githubusercontent.com/xnsteam-ai/Html-library/main/public/r/agent-chat.json \
  | jq -r '.files[0].content' > agent-chat.html
```

Then make sure Tailwind scans wherever you put it:

```css
@source "./components/**/*.html";
```

Grab everything at once:

```bash
curl -s https://xnsteam-ai.github.io/Html-library/r/index.json \
  | jq -r '.items[] | .url' \
  | xargs -I{} sh -c 'curl -s {} | jq -r ".files[0].content" > "$(basename {} .json).html"'
```

## Registry format

Each item is a single JSON file. `files[0].content` is the complete markup — that is the only field you need.

```json
{
  "name": "agent-chat",
  "title": "Agent Chat",
  "description": "A complete conversation shell…",
  "category": "agent",
  "type": "html",
  "version": "0.1.0",
  "tailwind": "^4.0.0",
  "tags": ["chat", "shell", "conversation"],
  "files": [{ "path": "agent-chat.html", "type": "html", "content": "<div …>" }]
}
```

Items in `apps` and `sites` carry one extra field, `"surface": "app" | "site" | "section"`, naming the chrome the item is drawn in — a phone frame, a browser frame at a fixed page height, or a browser frame that grows with the content, for a marketing section rather than a whole page.

`index.json` lists every component with its Pages URL and raw URL, plus per-category counts.

## Components

**Apps** and **Sites** are separate categories, each browsable as its own gallery — whole screens rather than parts:

- **Apps** (390×844 phone frames) — Onboarding, Content Feed, Wallet, Checkout, Chat Inbox, Profile & Settings
- **Sites** — five full pages at 1280×800 (Landing Page, Pricing Page, Dashboard, Documentation, Sign In) plus twelve reusable marketing sections at 1280 wide with natural height (Hero, Features, Bento Grid, Pricing, Testimonials, FAQ, CTA, Stats, Logo Cloud, Team, Newsletter, Footer)

**Agent Elements** — Agent Chat, Message List, Input Bar, Suggestions, Model Picker, Mode Selector, User Message, Markdown, Send Button, Attachment Button, File Attachment, Text Shimmer, Spiral Loader, Bash Tool, Edit Tool, Search Tool, Todo Tool, Plan Tool, Tool Group

**UI Elements** — Button, Badge, Card, Input, Alert, Tabs, Avatar, Empty State

## Use it from an AI assistant

Two ways, depending on whether your assistant can run a server.

**Agent skill** — one markdown file, works with anything that reads a URL:

```bash
curl -sL https://xnsteam-ai.github.io/Html-library/skill.md \
  -o .claude/skills/html-library/SKILL.md
```

It carries the full index of all components inline, the class-portability
contract, and the CSS-only interactivity rules. See [`skills/html-library/`](./skills/html-library)
and the [Skills page](https://xnsteam-ai.github.io/Html-library/#/skills).

**MCP server** — live queries instead of a static file:

```json
{
  "mcpServers": {
    "html-library": { "command": "npx", "args": ["-y", "html-library-mcp"] }
  }
}
```

Twelve tools covering discovery, retrieval, composition recipes, image prompts,
and — the part a static file cannot do — `check_portability`, which scans markup
for theme tokens that only resolve inside this docs app and hands back corrected
HTML. See [`packages/mcp-server/`](./packages/mcp-server).

## Develop

```bash
npm install
npm run dev              # docs at http://localhost:5173
npm run build:registry   # regenerate public/r after editing registry/
npm run verify:registry  # fail if public/r is stale (runs in CI)
npm run build            # registry + static site into dist/

npm run build:skill      # regenerate SKILL.md, llms.txt, skill.json
npm run build:mcp        # build the MCP server package
npm run verify:mcp       # typecheck + tests for the MCP server
```

The repo ships a [`.mcp.json`](./.mcp.json) pointing at the local build, so the
server is available inside this project once you have run `npm run build:mcp`.

The docs app reads `registry/` directly through `import.meta.glob`, so a new component folder appears in the sidebar as soon as you save it — the site can never drift from what the registry publishes.

Adding a component is two files; see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Deployment

`.github/workflows/pages.yml` verifies the registry on every push and pull request, then deploys `dist/` (site + `/r/` registry) to GitHub Pages from the repository's default branch. Enable Pages with **Source: GitHub Actions** in repository settings.

The published URLs use the repository name exactly (`Html-library`), because GitHub Pages paths are case-sensitive. `raw.githubusercontent.com` is not — either case resolves there.

## License

[MIT](./LICENSE)

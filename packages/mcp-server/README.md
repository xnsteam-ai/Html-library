# html-library-mcp

An MCP server for the [HTML Library](https://xnsteam-ai.github.io/Html-library) registry — **191 copy-paste UI components written in plain HTML + Tailwind CSS**.

Not React. No package to install for the components themselves, no CLI, no build step. A component is a self-contained fragment of markup that works anywhere a `class` attribute does: HTML, Vue, Svelte, Astro, Blade, ERB, Jinja — or JSX, after renaming `class` to `className`.

## Install

The server is hosted at **`https://html-library-mcp.fly.dev/mcp`** — no account,
no API key, nothing to install. Point a client at it and you're done.

**Claude Desktop** — Settings → **Connectors** → **Add custom connector**, paste
the URL. No Client ID, no OAuth step; the server takes unauthenticated
connections.

**Claude Code** — one command:

```bash
claude mcp add --transport http html-library https://html-library-mcp.fly.dev/mcp
```

**Cursor, Windsurf, VS Code, Zed** — anything that takes a `url`. Only the file
it goes in changes (`.cursor/mcp.json`, `~/.cursor/mcp.json`, …):

```json
{
  "mcpServers": {
    "html-library": {
      "url": "https://html-library-mcp.fly.dev/mcp"
    }
  }
}
```

### Running it locally instead

The published npm package is the same server over **stdio**, as a subprocess
rather than an HTTP call — worth it if you want no network dependency on the
hosted instance, or you're pointing it at [your own
registry](#pointing-at-your-own-registry):

```json
{
  "mcpServers": {
    "html-library": {
      "command": "npx",
      "args": ["-y", "html-library-mcp"],
      "env": { "HTML_LIBRARY_SOURCE": "remote" }
    }
  }
}
```

`HTML_LIBRARY_SOURCE` is pinned because a client can launch the subprocess from
an unrelated working directory, and source detection would otherwise depend on
where that happens to be — see [Where the data comes
from](#where-the-data-comes-from).

> Working from a clone? Run `npm run build:mcp`, then point `command` at `node`
> and `args` at `packages/mcp-server/bin/html-library-mcp.mjs`. This repo ships
> exactly that as [`.mcp.json`](../../.mcp.json).

## Where the data comes from

Applies to an instance you run yourself — the hosted URL is already configured
and reads the published registry. The server picks its source automatically and
says which one it chose on stderr at startup.

| Mode | When | Behaviour |
|---|---|---|
| **local** | a `registry/` folder is found in the working directory or up to 3 levels above | reads from disk — instant, and reflects uncommitted edits |
| **remote** | otherwise | fetches the published registry over HTTPS, retrying `raw.githubusercontent.com` if GitHub Pages fails |

Both modes return identical results.

| Variable | Effect |
|---|---|
| `HTML_LIBRARY_SOURCE` | `local` or `remote` — skip auto-detection |
| `HTML_LIBRARY_REGISTRY_DIR` | absolute path to a specific `registry/` folder |
| `HTML_LIBRARY_REGISTRY_URL` | a different hosted registry — a fork, a staging deploy, a self-hosted copy |

### Pointing at your own registry

Fork the library, host `public/r/` anywhere, and give the server the URL:

```json
{
  "mcpServers": {
    "html-library": {
      "command": "npx",
      "args": ["-y", "html-library-mcp"],
      "env": {
        "HTML_LIBRARY_REGISTRY_URL": "https://your-fork.example.com/r/index.json"
      }
    }
  }
}
```

`https://host/r`, `https://host/r/`, and `https://host/r/index.json` all mean the
same thing. Naming a registry takes precedence over finding one on disk, so this
works from inside a checkout too — otherwise pointing at a fork would silently
do nothing. `HTML_LIBRARY_REGISTRY_DIR` still wins over it, since a path is more
specific than a URL.

The registry has to use this library's schema (`/r/index.json` plus one
`/r/<name>.json` per item, each with `files[0].content`). It is not
shadcn-compatible and will not read a shadcn registry — those ship React
components, and every tool here assumes plain HTML.

## Tools

**Guide** — read before generating markup

| Tool | Does |
|---|---|
| `get_design_guide` | The measured design system — palette, type scale, radius rhythm, dark-mode strategy, state vocabulary |
| `get_category_guide` | How one category (apps / sites / agent / ui / images) behaves and looks |

**Discovery**

| Tool | Does |
|---|---|
| `list_components` | List by category, surface or tag, paginated |
| `search_components` | Search names, titles, descriptions and tags |
| `get_categories` | Counts, what each category is for, and the canvas each surface draws at |

**Retrieval**

| Tool | Does |
|---|---|
| `get_component` | One component in full — metadata, markup, portability, image prompt |
| `get_component_markup` | Just the HTML, for up to 20 components at once |

**Portability and linting** — the part with no shadcn equivalent

| Tool | Does |
|---|---|
| `check_portability` | Scan markup for app-only tokens and return **corrected HTML** |
| `get_component_portability` | Is this component safe to paste elsewhere, without fetching it |
| `lint_html` | Validate your own fragment against registry conventions |

**Composition**

| Tool | Does |
|---|---|
| `recommend_components` | Plain-language need → the components to reach for |
| `get_recipe` | Nesting order for a known pattern, and what already contains what |
| `get_interactivity_pattern` | The CSS-only mechanism for tabs, toggles, dropdowns, dismiss, row-select |

**Images**

| Tool | Does |
|---|---|
| `get_image_prompt` | The 7-block recreation brief, including exact framing geometry |

## Why `check_portability` exists

Two class vocabularies live in this registry. Most components use literal Tailwind (`bg-gray-900`) and paste anywhere. **54 of the 191** use theme tokens — `text-muted-foreground`, `bg-background` — that resolve only inside the library's own docs app. Paste one of those into your project and the text renders invisible, with no error to tell you why.

`check_portability` finds them and hands back fixed markup:

```jsonc
// in:  <div class="bg-background text-muted-foreground">
{
  "portable": false,
  "appTokens": ["background", "muted-foreground"],
  "substitutions": [
    { "from": "bg-background", "to": "bg-white dark:bg-neutral-950", "count": 1 },
    { "from": "text-muted-foreground", "to": "text-neutral-500 dark:text-neutral-400", "count": 1 }
  ],
  "fixedHtml": "<div class=\"bg-white dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400\">",
  "fixedIsPortable": true
}
```

Every replacement carries its own `dark:` variant, so the result is correct in both themes.

## The HTTP server

`src/http.ts` is the entrypoint behind the hosted URL — the same tools as the
stdio binary, over the MCP **Streamable HTTP** transport. It's deployed on
Fly.io; this section is for running or self-hosting your own copy.

```bash
npm run build --workspace packages/mcp-server
npm run start:http --workspace packages/mcp-server
```

Listens on `:8787` (`PORT` to change it) and serves `/mcp`. `GET /` is a plain
text health check. `HTML_LIBRARY_SOURCE` defaults to `remote` here rather than
being auto-detected — a deployed container has no repo checkout to find, so the
filesystem probe is skipped instead of failing. No authentication: every request
from any origin is served, which is what Claude's connector config allows via an
optional `authorization_token`. Nothing here is per-user or writable, so there'd
be nothing for an auth layer to protect.

**It is deliberately stateless** — `sessionIdGenerator: undefined`, a fresh
transport per request, no server-side session map. That is not an
implementation shortcut; it's load-bearing. The first version kept sessions in
an in-memory `Map`, which works on one process and fails on two: Fly runs this
app on multiple machines and its proxy balances **per request**, not per
connection, so `initialize` would land on machine A and the next request would
round-robin to machine B, which had never heard of that session and rejected
it — about 9 in 10 real handshakes failed that way. Any horizontally-scaled
deployment has the same shape, so if you fork this, keep it stateless or add
real session affinity. Consequences worth knowing:

- `GET` and `DELETE /mcp` return `405` — stateless mode has no standalone SSE
  stream to open and no session to delete. This is the status the SDK's own
  client treats as "no stream offered" and tolerates.
- An inbound `mcp-session-id` header is ignored, not validated or rejected.
- `RegistryData` is shared at module scope, or a per-request server would
  re-fetch the registry index on every single tool call.

Container build, from the repo root — the workspace layout means the build
context has to be the root, not this directory:

```bash
docker build -f packages/mcp-server/Dockerfile -t html-library-mcp .
docker run -p 8787:8787 html-library-mcp
```

For a Fly deploy, [`fly.toml`](../../fly.toml) at the repo root is the config
this instance uses. It keeps one machine warm (`min_machines_running = 1`)
because a cold start costs 6–7s, and a connector dialog is the worst place to
spend it.

## Development

From the repo root:

```bash
npm run build:mcp     # sync vendored core, compile TypeScript
npm run verify:mcp    # staleness check, typecheck, 48 tests against the real registry
```

Inspect it interactively:

```bash
npm run inspect --workspace packages/mcp-server
```

The registry logic in `src/vendor/` is copied from `scripts/lib/` by `scripts/sync-core.mjs` and must never be hand-edited — `verify` fails if the copy drifts from the original.

## License

MIT

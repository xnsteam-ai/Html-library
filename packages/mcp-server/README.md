# html-library-mcp

An MCP server for the [HTML Library](https://xnsteam-ai.github.io/Html-library) registry — **191 copy-paste UI components written in plain HTML + Tailwind CSS**.

Not React. No package to install for the components themselves, no CLI, no build step. A component is a self-contained fragment of markup that works anywhere a `class` attribute does: HTML, Vue, Svelte, Astro, Blade, ERB, Jinja — or JSX, after renaming `class` to `className`.

## Install

Add it to your MCP client. Nothing to scaffold, no config file to generate — this
is a **local server run over stdio**, not a remote HTTP one, so it is added by
editing a config file, never through a "remote server URL" / OAuth connector
dialog. If a client offers both, use the config-file path below.

**Claude Code** — one command:

```bash
claude mcp add html-library -- npx -y html-library-mcp
```

Equivalent, if you'd rather edit `.mcp.json` in your project directly:

```json
{
  "mcpServers": {
    "html-library": {
      "command": "npx",
      "args": ["-y", "html-library-mcp"]
    }
  }
}
```

**Cursor** — `.cursor/mcp.json` (or `~/.cursor/mcp.json` for every project):

```json
{
  "mcpServers": {
    "html-library": {
      "command": "npx",
      "args": ["-y", "html-library-mcp"]
    }
  }
}
```

**Claude Desktop** — two ways to connect:

- **Remote (fewer steps).** Settings → **Connectors** → **Add custom
  connector**, paste in `https://html-library-mcp.fly.dev/mcp` as the server
  URL. No Client ID, no OAuth step — the server takes unauthenticated
  connections. (Pasting a plain `npx` command into this dialog is what used
  to fail with a sign-in error — that's what this URL is for.)
- **Local (stdio).** Edit the config file directly, same as every other
  client above:

1. Claude menu → **Settings** → **Developer** tab → **Edit Config**. This
   opens the file, creating it if it doesn't exist yet:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the block below (merge into an existing `mcpServers` object if you
   already have other servers configured).
3. Save, then **fully quit** Claude Desktop — not just close the window — and
   reopen it.
4. Confirm it connected via the **+** icon in the message box → **Connectors**
   → **Manage connectors** → `html-library` should be listed with its tools.

Desktop launches with an unrelated working directory, so the source is pinned
explicitly:

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

> Working from a clone instead? Run `npm run build:mcp`, then point `command` at
> `node` and `args` at `packages/mcp-server/bin/html-library-mcp.mjs`. This repo
> already ships that as [`.mcp.json`](../../.mcp.json).

## Where the data comes from

The server picks its source automatically and says which one it chose on stderr at startup.

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

## Remote (HTTP) server

The `npx` install above runs over **stdio** — a local process, one per client.
There's a second entrypoint, `src/http.ts`, that speaks the MCP **Streamable
HTTP** transport instead: a long-running server with one endpoint,
`POST/GET/DELETE /mcp`, sessioned by an `mcp-session-id` header. This is what a
"remote server URL" style connector (Claude Desktop's Settings → Connectors →
Add custom connector, or any other client that wants a URL instead of a
command) needs — the stdio server has no HTTP endpoint at all, so pointing that
dialog at `npx html-library-mcp` is what produces the sign-in-service error
described above.

It ships in this package but is **not deployed anywhere** — running it
publicly is a separate decision (which host, which domain) left to whoever
wants to stand it up. What's here is everything needed to do that.

Run it locally:

```bash
npm run build --workspace packages/mcp-server
npm run start:http --workspace packages/mcp-server
```

Listens on `:8787` by default (`PORT` to change it) and serves `/mcp`. A plain
`GET /` returns a text health check. Unlike the stdio server, `HTML_LIBRARY_SOURCE`
defaults to `remote` here automatically — a deployed instance has no repo
checkout to detect, so this skips that filesystem probe rather than failing it.
No authentication: every request from any origin is served, which matches how
Claude's `mcp_servers` connector config treats `authorization_token` as
optional — this is a read-only registry with no per-user data, so there's
nothing an auth layer would be protecting.

Container build, from the repo root (the workspace layout means the build
context has to be the root, not this directory):

```bash
docker build -f packages/mcp-server/Dockerfile -t html-library-mcp .
docker run -p 8787:8787 html-library-mcp
```

Once a copy of this is deployed somewhere with a public HTTPS URL, that URL is
what goes into Claude Desktop's **Settings → Connectors → Add custom
connector** dialog — no Client ID, no OAuth setup, just the URL ending in
`/mcp`. Until then, use the stdio install above.

## Development

From the repo root:

```bash
npm run build:mcp     # sync vendored core, compile TypeScript
npm run verify:mcp    # staleness check, typecheck, 22 tests against the real registry
```

Inspect it interactively:

```bash
npm run inspect --workspace packages/mcp-server
```

The registry logic in `src/vendor/` is copied from `scripts/lib/` by `scripts/sync-core.mjs` and must never be hand-edited — `verify` fails if the copy drifts from the original.

## License

MIT

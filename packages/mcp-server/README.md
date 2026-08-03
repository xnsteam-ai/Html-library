# html-library-mcp

An MCP server for the [HTML Library](https://xnsteam-ai.github.io/Html-library) registry — **191 copy-paste UI components written in plain HTML + Tailwind CSS**.

Not React. No package to install for the components themselves, no CLI, no build step. A component is a self-contained fragment of markup that works anywhere a `class` attribute does: HTML, Vue, Svelte, Astro, Blade, ERB, Jinja — or JSX, after renaming `class` to `className`.

## Install

Add it to your MCP client. Nothing to scaffold, no config file to generate.

**Claude Code** — `.mcp.json` in your project:

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

**Claude Desktop** — `claude_desktop_config.json`. It launches with an unrelated working directory, so pin the source explicitly:

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

## Tools

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

Two class vocabularies live in this registry. Most components use literal Tailwind (`bg-gray-900`) and paste anywhere. **55 of the 191** use theme tokens — `text-muted-foreground`, `bg-background` — that resolve only inside the library's own docs app. Paste one of those into your project and the text renders invisible, with no error to tell you why.

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

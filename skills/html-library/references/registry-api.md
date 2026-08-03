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

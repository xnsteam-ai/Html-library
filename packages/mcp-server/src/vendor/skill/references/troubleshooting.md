<!-- GENERATED — do not edit. Copied from skills/html-library/ by
     packages/mcp-server/scripts/sync-core.mjs. Edit the original and
     re-run `npm run build:mcp`. -->

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

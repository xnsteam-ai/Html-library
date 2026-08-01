import type { RegistryItem } from '../../registry'

/**
 * Registry snippets are bare Tailwind fragments meant for a project that
 * already has Tailwind configured — pasted into a generic online HTML
 * previewer (which has no stylesheet backing those utility classes) they
 * render unstyled. Wrapping the fragment in a standalone document with the
 * Tailwind Play CDN, configured for the same class-based dark mode this app
 * uses, makes the copied/opened HTML render correctly — colors, spacing and
 * theme intact — anywhere it's pasted or saved.
 */
export function toStandaloneHtml(item: RegistryItem): string {
  const isDark = document.documentElement.classList.contains('dark')

  return `<!doctype html>
<html lang="en"${isDark ? ' class="dark"' : ''}>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${item.title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = { darkMode: 'class' }
</script>
<style>
  html, body { min-height: 100%; margin: 0; }
  body { display: flex; align-items: center; justify-content: center; background: ${
    isDark ? '#0a0a0a' : '#ffffff'
  }; }
</style>
</head>
<body>
${item.html}
</body>
</html>
`
}

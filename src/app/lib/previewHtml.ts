import { PAGES_URL, type RegistryItem } from '../../registry'

/**
 * Registry markup for the Images set points at the deployed GitHub Pages host
 * so a copied snippet keeps working wherever it's pasted — the same reasoning
 * as the Unsplash-hosted photos elsewhere in the registry. That host only
 * exists after a deploy, though, so the in-app preview (served from this same
 * origin, which does ship `public/images/`) needs to rewrite those URLs to a
 * local path. The Code tab and "Copy HTML" keep the original, portable URL —
 * only the rendered preview goes through this.
 */
export function previewHtml(item: RegistryItem): string {
  if (item.category !== 'images') return item.html
  return item.html.replaceAll(`${PAGES_URL}/images/`, `${import.meta.env.BASE_URL}images/`)
}

// One-off generator: adds the `facets` block to each image's meta.json.
//
// Why this exists: "More Inspiration" had no eligibility gate, so every image in
// the library was a candidate and anime illustration, casting headshots, sports
// jerseys and product grids all landed in the same pool. Ranking was fine;
// nothing decided what was allowed to compete in the first place.
//
// Gating on the raw prompt prose does not work — those fields are free text
// (96 distinct `lighting.temperature` values across 110 images), so requiring
// facet overlap on them leaves 91 of 110 images with zero eligible matches.
// This pass collapses that prose into small closed vocabularies, which is what
// makes an overlap gate viable at all: measured against the same 110 images,
// zero-eligible drops from 91 to 3.
//
// Everything is derived from data already in meta.json plus the image header —
// deliberately no new dependency. Dimensions come from the same hand-rolled
// SOF parser gen-images.mjs uses rather than pulling in sharp.
//
//   node scripts/gen-image-facets.mjs
//
// Writes in place and is idempotent, so re-running after editing a tagline or a
// prompt simply refreshes the derived values.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const IMAGES_DIR = 'registry/images'
const ASSET_DIR = 'public/images'

/**
 * Content type, and the wall recommendations may never cross. Derived from the
 * tagline's primary segment — a near-closed 16-value vocabulary — rather than
 * the tag list, where 58 of 140 tags appear exactly once.
 */
const STYLE_BY_PRIMARY = {
  portrait: 'photo',
  fashion: 'photo',
  editorial: 'photo',
  street: 'photo',
  lifestyle: 'photo',
  landscape: 'photo',
  poster: 'graphic',
  cover: 'graphic',
  ad: 'graphic',
  infographic: 'graphic',
  product: 'product',
  grid: 'sheet',
  reference: 'sheet',
  collage: 'sheet',
  illustration: 'art',
  character: 'art',
}

/** Ordered longest-intent-first; the first keyword hit wins. */
const PALETTES = [
  ['mono', 'monochrom-', 'black-and-white', 'greyscale', 'grayscale', 'desaturated'],
  ['warm', 'warm', 'golden', 'amber', 'orange', 'sunlit', 'sepia'],
  ['cool', 'cool', 'blue', 'teal', 'cold', 'silver'],
  ['vivid', 'saturat-', 'vivid', 'bold', 'high-chroma', 'punchy'],
  ['neutral', 'neutral', 'daylight', 'balanced', 'white'],
]

const LIGHTING = [
  ['dramatic', 'dramatic', 'moody', 'low-key', 'chiaroscuro', 'theatrical'],
  ['hard', 'hard', 'harsh', 'direct', 'specular', 'high contrast', 'high-contrast'],
  ['soft', 'soft', 'diffus-', 'even', 'gentle', 'overcast', 'wrap'],
]

const SUBJECTS = [
  ['automotive', 'automotive', 'car', 'coupe', 'sedan', 'vehicle'],
  ['beauty', 'beauty', 'skincare', 'cosmetic', 'makeup', 'lip'],
  ['sport', 'sport', 'fitness', 'athletic', 'gym', 'boxing', 'soccer', 'skate'],
  ['apparel', 'apparel', 'footwear', 'streetwear', 'jacket', 'fashion', 'knit', 'hoodie'],
  ['tech', 'tech', 'device', 'phone', 'headphone', 'audio', 'wearable'],
  ['food', 'food', 'beverage', 'snack', 'coffee', 'soda', 'recipe', 'fruit'],
  ['nature', 'nature', 'outdoor', 'floral', 'flower', 'landscape', 'coastal', 'sky', 'garden'],
  ['people', 'portrait', 'casting', 'headshot', 'selfie', 'character', 'idol'],
]

/**
 * Whole-word match. Substring matching looked fine until `car` claimed
 * "skincare" and filed a serum grid under automotive, so keywords are anchored
 * on word boundaries. Prefixes that should still match inflections keep a
 * trailing wildcard by ending in `-` (e.g. `diffus-` covers diffuse/diffused).
 */
const match = (text, table, fallback) => {
  const hay = String(text ?? '').toLowerCase()
  for (const [value, ...keywords] of table) {
    const hit = keywords.some((keyword) => {
      const stem = keyword.endsWith('-') ? keyword.slice(0, -1) : keyword
      const pattern = keyword.endsWith('-') ? `\\b${stem}` : `\\b${stem}\\b`
      return new RegExp(pattern.replace(/\s+/g, '\\s+')).test(hay)
    })
    if (hit) return value
  }
  return fallback
}

/** Minimal JPEG SOF parser — enough to read intrinsic width/height. */
function jpegSize(buf) {
  let i = 2
  while (i < buf.length) {
    if (buf[i] !== 0xff) {
      i++
      continue
    }
    const marker = buf[i + 1]
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
    }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  throw new Error('no SOF marker')
}

/** No field records the asset name, so it comes back out of the markup. */
function assetFor(dir) {
  const html = readFileSync(path.join(IMAGES_DIR, dir, 'component.html'), 'utf8')
  return html.match(/\/images\/([^"?]+\.jpg)/i)?.[1] ?? null
}

const dirs = readdirSync(IMAGES_DIR)
let written = 0
const noAsset = []
const counts = { style: {}, palette: {}, subject: {}, lighting: {} }

for (const dir of dirs) {
  const metaPath = path.join(IMAGES_DIR, dir, 'meta.json')
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'))
  const prompt = meta.prompt ?? {}

  const [primary = '', secondary = ''] = String(meta.tagline ?? '')
    .split('·')
    .map((part) => part.trim().toLowerCase())

  const facets = {
    style: STYLE_BY_PRIMARY[primary] ?? 'photo',
    palette: match(prompt.lighting?.temperature, PALETTES, 'neutral'),
    // The tagline is curated, so it decides first; tags are the fallback. A
    // fashion-editorial portrait is a portrait, and letting a stray `fashion`
    // tag outrank its own "Portrait" tagline filed it under apparel.
    subject: match(secondary, SUBJECTS, null) ?? match((meta.tags ?? []).join(' '), SUBJECTS, 'other'),
    lighting: match(prompt.lighting?.quality, LIGHTING, 'soft'),
  }

  // Recorded because it is cheap and honest, but not gated on: 90 of the 110
  // images are ~1200px tall, so aspect barely discriminates in this library.
  const asset = assetFor(dir)
  if (asset) {
    try {
      const { w, h } = jpegSize(readFileSync(path.join(ASSET_DIR, asset)))
      facets.aspect = Number((w / h).toFixed(3))
    } catch {
      noAsset.push(meta.name)
    }
  } else {
    noAsset.push(meta.name)
  }

  for (const key of ['style', 'palette', 'subject', 'lighting']) {
    counts[key][facets[key]] = (counts[key][facets[key]] ?? 0) + 1
  }

  // Drop then re-append so the block lands last and the diff reads cleanly.
  const { facets: _drop, ...rest } = meta
  writeFileSync(metaPath, JSON.stringify({ ...rest, facets }, null, 2) + '\n')
  written++
}

console.log(`wrote facets for ${written} images`)
for (const key of ['style', 'palette', 'subject', 'lighting']) {
  const summary = Object.entries(counts[key])
    .sort((a, b) => b[1] - a[1])
    .map(([value, n]) => `${value} ${n}`)
    .join(', ')
  console.log(`  ${key.padEnd(9)} ${summary}`)
}
if (noAsset.length) console.log(`no readable asset for ${noAsset.length}: ${noAsset.join(', ')}`)

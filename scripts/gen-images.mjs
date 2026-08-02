// One-off generator: turns public/images/*.jpg into registry/images/* entries.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const BASE = 'https://xnsteam-ai.github.io/Html-library/images'

const META = [
  ['feathered-motion', 'Feathered Motion', 'Editorial portrait with black feathers caught mid-motion', 'Editorial · Portrait', ['portrait', 'editorial', 'dark', 'fashion']],
  ['weathered-portrait', 'Weathered Portrait', 'Close-up character study with an aqua-toned texture overlay', 'Portrait · Texture', ['portrait', 'character', 'texture', 'cinematic']],
  ['skincare-sheet', 'Skincare Product Sheet', 'Product grid pairing serum bottles with fresh cucumber styling', 'Product · Grid', ['product', 'skincare', 'grid', 'commercial']],
  ['iced-coffee-mockup', 'Iced Coffee Mockup', 'Beverage mockup with ice cubes suspended mid-splash', 'Product · Beverage', ['product', 'beverage', 'mockup', 'splash']],
  ['motion-blur-crowd', 'Motion Blur Crowd', 'Figures crossing a bright frame, rendered in long-exposure blur', 'Editorial · Motion', ['motion', 'blur', 'crowd', 'editorial']],
  ['daisy-displacement', 'Daisy Displacement', 'Portrait broken by a horizontal glitch with a single daisy', 'Portrait · Glitch', ['portrait', 'glitch', 'floral', 'surreal']],
  ['headphone-pop', 'Headphone Pop', 'High-energy portrait in a red cap and cushioned headphones', 'Portrait · Pop', ['portrait', 'music', 'colour', 'youth']],
  ['wildflower-field', 'Wildflower Field', 'Figure standing in a wind-blown field of yellow blooms', 'Lifestyle · Nature', ['nature', 'flowers', 'lifestyle', 'outdoor']],
  ['sky-skate-poster', 'Sky Skate Poster', 'Poster layout with a skater suspended against cloud cover', 'Poster · Sport', ['poster', 'skate', 'sky', 'sport']],
  ['feather-collar', 'Feather Collar', 'Studio portrait framed by a soft white feather collar', 'Portrait · Studio', ['portrait', 'studio', 'feather', 'teal']],
  ['streetwear-collage', 'Streetwear Collage', 'Four-up collage of street looks shot on the same set', 'Collage · Street', ['collage', 'streetwear', 'grid', 'fashion']],
  ['golden-cover', 'Golden Cover', 'Magazine-style cover portrait in a heavy gold treatment', 'Cover · Gold', ['cover', 'magazine', 'gold', 'portrait']],
  ['expression-grid', 'Expression Grid', 'Nine-frame contact sheet of a single subject reacting', 'Grid · Contact sheet', ['grid', 'expressions', 'contact sheet', 'denim']],
  ['plush-toy-set', 'Plush Toy Set', 'Four plush characters shot flat against clean backdrops', 'Product · Toys', ['product', 'plush', 'toys', 'grid']],
  ['summer-twirl', 'Summer Twirl', 'Full-length shot of a white skirt caught against blue sky', 'Fashion · Summer', ['fashion', 'summer', 'sky', 'movement']],
  ['boxing-cover', 'Boxing Cover', 'Sports magazine cover with heavy display typography', 'Cover · Sport', ['cover', 'magazine', 'sport', 'typography']],
  ['flat-lay-fashion', 'Flat Lay Fashion', 'Overhead fashion flat lay in yellow and washed denim', 'Fashion · Flat lay', ['fashion', 'flat lay', 'overhead', 'yellow']],
  ['device-beach-ad', 'Device Beach Ad', 'Phone launch layout with a poolside lifestyle backdrop', 'Ad · Product', ['ad', 'device', 'product', 'lifestyle']],
  ['mascot-hoodie', 'Mascot Hoodie', 'Character mascot standing beside a matching blue hoodie', 'Character · Mascot', ['mascot', 'character', 'blue', 'apparel']],
  ['idol-grid', 'Idol Grid', 'Six-frame idol photo set in a soft green wardrobe', 'Grid · Idol', ['grid', 'idol', 'green', 'portrait']],
  ['newsprint-editorial', 'Newsprint Editorial', 'Editorial layout pairing a purple blazer with newsprint', 'Editorial · Layout', ['editorial', 'layout', 'fashion', 'newsprint']],
  ['portrait-collage', 'Portrait Collage', 'Scattered print collage of one sitting, polaroid style', 'Collage · Portrait', ['collage', 'portrait', 'polaroid', 'print']],
  ['blue-bloom', 'Blue Bloom', 'Silhouette dissolving into blue floral particles', 'Portrait · Surreal', ['portrait', 'surreal', 'floral', 'blue']],
  ['cap-selfie', 'Cap Selfie', 'Street selfie in a bucket cap and white two-piece', 'Street · Selfie', ['street', 'selfie', 'casual', 'youth']],
  ['blossom-grid', 'Blossom Grid', 'Six-frame pastel set shot under blossom and open sky', 'Grid · Pastel', ['grid', 'pastel', 'blossom', 'spring']],
  ['sunlit-hands', 'Sunlit Hands', 'Hands reaching toward the lens through heavy sun flare', 'Portrait · Sunlit', ['portrait', 'sunlight', 'flare', 'warm']],
  ['blue-knit', 'Blue Knit', 'Warm-lit portrait in an oversized cobalt knit', 'Portrait · Knit', ['portrait', 'knit', 'blue', 'warm']],
  ['own-the-sky', 'Own The Sky', 'Bold blue sports poster with stacked display type', 'Poster · Sport', ['poster', 'sport', 'typography', 'blue']],
  ['sunlit-portrait', 'Sunlit Portrait', 'Backlit portrait in a cream dress against open sky', 'Portrait · Natural', ['portrait', 'sunlight', 'sky', 'natural']],
  ['fruit-soda-set', 'Fruit Soda Set', 'Three-up can lineup styled with the fruit in each flavour', 'Product · Beverage', ['product', 'beverage', 'fruit', 'grid']],
  ['ball-cap-portrait', 'Ball Cap Portrait', 'Relaxed studio portrait in a ball cap and blazer', 'Portrait · Casual', ['portrait', 'casual', 'studio', 'neutral']],
]

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

const files = readdirSync('public/images')
  .filter((f) => /\.jpg$/i.test(f))
  .sort()

if (files.length !== META.length) {
  throw new Error(`count mismatch: ${files.length} files vs ${META.length} entries`)
}

files.forEach((file, i) => {
  const [slug, title, desc, tagline, tags] = META[i]
  const { w, h } = jpegSize(readFileSync(path.join('public/images', file)))
  const name = `image-${slug}`
  const dir = path.join('registry', 'images', name)
  mkdirSync(dir, { recursive: true })

  const html = `<!--
  ${title} — ${w}×${h} JPEG from the HTML Library image set.
  The width/height attributes reserve the box so the page does not shift
  while the file downloads.
-->
<figure class="mx-auto w-full max-w-2xl">
  <img
    src="${BASE}/${file}"
    alt="${desc}"
    width="${w}"
    height="${h}"
    class="h-auto w-full rounded-xl"
  />
  <figcaption class="mt-2 text-[12px] text-gray-600 dark:text-gray-400">${title} · ${w}×${h}</figcaption>
</figure>
`

  writeFileSync(path.join(dir, 'component.html'), html)
  writeFileSync(
    path.join(dir, 'meta.json'),
    JSON.stringify(
      {
        name,
        title,
        description: desc,
        category: 'images',
        order: i + 1,
        status: 'new',
        tagline,
        tags,
        previewBg: 'plain',
        previewHeight: 560,
      },
      null,
      2,
    ) + '\n',
  )
})

console.log(`created ${files.length} image components`)

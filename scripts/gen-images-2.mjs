// One-off generator: turns the second image drop (`more/Images 2`) into
// registry/images/* entries, matching the pattern gen-images.mjs established.
//
// Source folder had 100 files. One (`2080867624238322156-1.jpg`) is a
// byte-identical duplicate of an image already registered as
// `image-device-beach-ad` — skipped outright, no new entry.
//
// Of the remaining 99, twenty were excluded from the registry: images that
// depict real, identifiable public figures (athletes, entertainers, a head of
// state) framed with explicit team/brand/name branding, and a few with
// boudoir/bedroom framing that doesn't fit a general-purpose, redistributable
// asset library. Everything else — fashion, product/ad mockups, beauty,
// automotive posters, food, illustration, casting-reference sheets — is in.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import path from 'node:path'

const SRC_DIR = 'more/Images 2'
const DUPLICATE_OF_EXISTING = '2080867624238322156-1.jpg'
const BASE = 'https://xnsteam-ai.github.io/Html-library/images'

// index -> [slug, title, description, tagline, tags[], excludeReason?]
// excludeReason is set only for entries we are deliberately leaving out —
// kept here (rather than just omitted) so the exclusion list stays
// self-documenting instead of a bare array of numbers.
const CATALOG = {
  0: null, // real public figures, explicit event photo — excluded
  1: ['puffer-jacket-pair', 'Puffer Jacket Pair', 'Product flat lay of a quilted puffer jacket shown in two colourways', 'Product · Apparel', ['product', 'apparel', 'jacket', 'flat lay']],
  2: ['day-night-comparison', 'Day And Night Comparison', 'Split portrait comparing the same look under daylight and evening light', 'Portrait · Comparison', ['portrait', 'comparison', 'beauty', 'split']],
  3: ['flat-cap-contact-sheet', 'Flat Cap Contact Sheet', 'Six-frame contact sheet of one subject in a flat cap, shot from varied angles', 'Reference · Contact sheet', ['portrait', 'contact sheet', 'grid', 'casting reference']],
  4: ['phone-spec-diagram', 'Phone Spec Diagram', 'Exploded product diagram calling out a phone’s ports and hardware details', 'Product · Diagram', ['product', 'tech', 'diagram', 'phone']],
  5: ['tailored-coat-street-style', 'Tailored Coat Street Style', 'Street-style menswear shot in a long coat, with the full outfit grid below', 'Fashion · Menswear', ['fashion', 'menswear', 'street', 'lookbook']],
  6: ['mirror-selfie-athletic', 'Mirror Selfie, Athletic Wear', 'Mirror selfie in a cropped top and shorts, gym-adjacent styling', 'Portrait · Lifestyle', ['portrait', 'fitness', 'selfie', 'lifestyle']],
  7: null, // face grid closely resembling real public figures — excluded
  8: ['smart-glasses-badge', 'Smart Glasses Badge', 'Close crop on a pair of smart glasses with a circular product badge overlay', 'Product · Wearable', ['product', 'tech', 'wearable', 'badge']],
  9: ['teal-eyes-portrait', 'Teal Eyes Portrait', 'Close portrait with a cool teal grade and the eyes lit as the focal point', 'Portrait · Beauty', ['portrait', 'beauty', 'teal', 'mood']],
  10: ['roast-chicken-recipe-card', 'Roast Chicken Recipe Card', 'Recipe infographic card laying out ingredients and steps for a roast chicken', 'Infographic · Food', ['infographic', 'food', 'recipe', 'card']],
  11: ['phone-case-exploded-view', 'Phone Case Exploded View', 'Exploded product view of a phone case showing its layered construction', 'Product · Diagram', ['product', 'tech', 'diagram', 'phone case']],
  12: ['performance-shoe-ad', 'Performance Shoe Ad', 'High-contrast running shoe advertisement with bold display type', 'Poster · Footwear', ['poster', 'product', 'footwear', 'sport']],
  13: ['red-sport-poster', 'Red Sport Brand Poster', 'Red-toned sportswear poster built around a single silhouetted figure', 'Poster · Sport', ['poster', 'sport', 'apparel', 'editorial']],
  14: ['backlit-warehouse-portrait', 'Backlit Warehouse Portrait', 'Moody portrait backlit inside an industrial warehouse space', 'Portrait · Moody', ['portrait', 'moody', 'industrial', 'cinematic']],
  15: ['urban-street-portrait', 'Urban Street Portrait', 'Street portrait with visible tattoos and glasses, city backdrop', 'Portrait · Street', ['portrait', 'street', 'urban', 'menswear']],
  16: ['outfit-lineup-grid', 'Outfit Lineup Grid', 'Six-up grid lining up a menswear look across separate outfit changes', 'Fashion · Lookbook', ['fashion', 'lookbook', 'menswear', 'grid']],
  17: ['outdoor-apparel-poster', 'Outdoor Apparel Poster', 'Outdoor apparel poster built around a lone hiking figure', 'Poster · Outdoor', ['poster', 'outdoor', 'apparel', 'editorial']],
  18: null, // multi-panel grid of real public figures — excluded
  19: ['snow-sport-portrait', 'Snow Sport Portrait', 'Winter sport portrait in a blue technical outfit against overcast sky', 'Portrait · Winter', ['portrait', 'winter', 'sport', 'blue']],
  20: ['beauty-close-up-necklace', 'Beauty Close-Up', 'Close beauty portrait framed around a delicate necklace', 'Portrait · Beauty', ['portrait', 'beauty', 'jewelry', 'close-up']],
  21: ['headphones-product-poster', 'Headphones Product Poster', 'Lifestyle product poster for over-ear headphones, worn in frame', 'Poster · Audio', ['poster', 'product', 'audio', 'tech']],
  22: ['yellow-sports-car-poster', 'Yellow Sports Car Poster', 'Automotive poster for a yellow sports car against a dark backdrop', 'Poster · Automotive', ['poster', 'automotive', 'sports car', 'product']],
  23: ['sports-car-spec-sheet', 'Sports Car Spec Sheet', 'Spec-sheet style automotive poster laying out model details', 'Poster · Automotive', ['poster', 'automotive', 'spec sheet', 'product']],
  24: ['skincare-routine-card', 'Skincare Routine Card', 'Infographic card walking through a multi-step skincare routine', 'Infographic · Skincare', ['infographic', 'beauty', 'skincare', 'product']],
  25: ['blue-coupe-poster', 'Blue Coupe Poster', 'Automotive poster for a blue coupe shot low and wide', 'Poster · Automotive', ['poster', 'automotive', 'coupe', 'product']],
  26: ['beach-hat-portrait', 'Beach Hat Portrait', 'Poolside portrait in swimwear and a wide sun hat', 'Portrait · Summer', ['portrait', 'swimwear', 'beach', 'summer']],
  27: ['winter-jacket-ad', 'Winter Jacket Ad', 'Cold-weather jacket advertisement with bold exploration-themed copy', 'Poster · Apparel', ['poster', 'apparel', 'winter', 'editorial']],
  28: ['motion-pose-poster', 'Motion Pose Poster', 'Dance-style motion pose in white, shot against a plain backdrop', 'Poster · Motion', ['poster', 'dance', 'motion', 'editorial']],
  29: ['phone-call-poster', 'Phone Call Poster', 'Red-toned product poster of a subject mid phone call', 'Poster · Product', ['poster', 'product', 'tech', 'portrait']],
  30: null, // bedroom framing, minimal clothing — excluded
  31: ['fitness-pose-portrait', 'Fitness Pose Portrait', 'Gym portrait captured mid stretch, athletic styling', 'Portrait · Fitness', ['portrait', 'fitness', 'gym', 'athletic']],
  32: ['motion-shoe-poster', 'Motion Shoe Poster', 'Running shoe poster with dynamic display type and motion styling', 'Poster · Footwear', ['poster', 'product', 'footwear', 'motion']],
  33: ['coastal-road-trip', 'Coastal Road Trip', 'A van parked on a coastal road lined with wildflowers', 'Landscape · Travel', ['landscape', 'travel', 'coastal', 'van']],
  34: ['casting-reference-sheet-a', 'Casting Reference Sheet A', 'Casting reference sheet pairing headshots with a colour and outfit palette', 'Reference · Casting', ['casting', 'reference', 'grid', 'fashion']],
  35: ['casting-reference-sheet-b', 'Casting Reference Sheet B', 'Casting reference grid of small headshots across multiple expressions', 'Reference · Casting', ['casting', 'reference', 'grid', 'headshots']],
  36: null, // boudoir bedroom framing — excluded
  37: ['sunglasses-product-poster', 'Sunglasses Product Poster', 'Editorial product poster for a pair of sunglasses', 'Poster · Eyewear', ['poster', 'product', 'eyewear', 'editorial']],
  38: ['lakeside-spring-portrait', 'Lakeside Spring Portrait', 'Outdoor portrait beside a lake in soft spring light', 'Portrait · Outdoor', ['portrait', 'outdoor', 'spring', 'lifestyle']],
  39: null, // recognisable copyrighted character art — excluded
  40: null, // real athlete in an official-style brand campaign — excluded
  41: ['casual-outdoor-portrait', 'Casual Outdoor Portrait', 'Relaxed outdoor portrait in casual streetwear', 'Portrait · Casual', ['portrait', 'casual', 'lifestyle', 'outdoor']],
  42: ['short-hair-teal-portrait', 'Short Hair Portrait', 'Beauty portrait with a short hairstyle and cool teal grade', 'Portrait · Beauty', ['portrait', 'beauty', 'teal', 'hairstyle']],
  43: ['athletic-dark-portrait', 'Athletic Dark Portrait', 'Low-key athletic portrait shot against a dark background', 'Portrait · Fitness', ['portrait', 'fitness', 'dark', 'editorial']],
  44: ['headshot-casting-grid-a', 'Headshot Casting Grid A', 'Nine-frame casting grid of consistent headshots for one subject', 'Reference · Casting', ['casting', 'reference', 'grid', 'headshots']],
  45: ['phantom-shoe-ad', 'Phantom Shoe Ad', 'High-energy running shoe advertisement with red display type', 'Poster · Footwear', ['poster', 'product', 'footwear', 'sport']],
  46: ['urban-calm-cover', 'Urban Calm Cover', 'Magazine-style cover treatment pairing an illustrated figure with bold type', 'Poster · Cover', ['poster', 'illustration', 'cover', 'editorial']],
  47: ['headshot-casting-grid-b', 'Headshot Casting Grid B', 'Second nine-frame casting grid, same layout as Casting Grid A', 'Reference · Casting', ['casting', 'reference', 'grid', 'headshots']],
  48: ['ice-cream-flowers-portrait', 'Ice Cream And Flowers', 'Playful portrait pairing an ice cream cone with a bouquet, open sky behind', 'Portrait · Lifestyle', ['portrait', 'lifestyle', 'playful', 'editorial']],
  49: ['shoe-lifestyle-collage', 'Shoe Lifestyle Collage', 'Six-up lifestyle collage built around a single footwear release', 'Product · Collage', ['product', 'footwear', 'collage', 'lifestyle']],
  50: ['gym-set-portrait', 'Gym Set Portrait', 'Evening gym portrait in a matching cropped set', 'Portrait · Fitness', ['portrait', 'fitness', 'gym', 'athletic']],
  51: ['sunlit-car-portrait', 'Sunlit Car Portrait', 'Portrait taken through a car window in warm, low sunlight', 'Portrait · Automotive', ['portrait', 'automotive', 'lifestyle', 'golden hour']],
  52: ['poolside-portrait', 'Poolside Portrait', 'Poolside swimwear portrait with palm trees in the background', 'Portrait · Summer', ['portrait', 'swimwear', 'pool', 'summer']],
  53: null, // boudoir bedroom framing — excluded
  54: ['garden-floral-portrait', 'Garden Floral Portrait', 'Portrait set in a blossoming garden, floral backdrop throughout', 'Portrait · Outdoor', ['portrait', 'floral', 'garden', 'outdoor']],
  55: ['lip-gloss-product-shot', 'Lip Gloss Product Shot', 'Close beauty product shot of a lip gloss applicator', 'Product · Beauty', ['product', 'beauty', 'cosmetics', 'close-up']],
  56: ['sedan-poster', 'Sedan Poster', 'Studio automotive poster for a white sedan', 'Poster · Automotive', ['poster', 'automotive', 'sedan', 'product']],
  57: ['coconut-cooler-poster', 'Coconut Cooler Poster', 'Summer beverage poster for a coconut-flavoured cooler drink', 'Poster · Beverage', ['poster', 'beverage', 'product', 'summer']],
  58: ['character-reference-sheet', 'Character Reference Sheet', 'Illustrated character design sheet with palette, wardrobe and pose studies', 'Illustration · Reference', ['illustration', 'character design', 'reference', 'concept art']],
  59: ['sofa-cat-portrait', 'Sofa With Cat', 'Relaxed lifestyle portrait sitting on a sofa with a cat', 'Portrait · Lifestyle', ['portrait', 'lifestyle', 'pet', 'home']],
  60: ['gym-pose-pink', 'Gym Pose Portrait', 'Gym portrait mid-pose in a pink cropped top', 'Portrait · Fitness', ['portrait', 'fitness', 'gym', 'athletic']],
  61: null, // real athlete in national team kit, name visible — excluded
  62: ['anime-style-illustration', 'Anime-Style Illustration', 'Anime-style illustration of a figure walking through green scenery', 'Illustration · Anime style', ['illustration', 'anime style', 'scenic', 'character']],
  63: ['own-the-move-poster', 'Own The Move Poster', 'Bold sportswear poster built around stacked display type', 'Poster · Sport', ['poster', 'sport', 'apparel', 'editorial']],
  64: ['hairstyle-options-sheet', 'Hairstyle Options Sheet', 'Reference sheet comparing hairstyle options on the same subject', 'Reference · Beauty', ['reference', 'beauty', 'hairstyle', 'grid']],
  65: ['athletic-field-portrait', 'Athletic Field Portrait', 'Outdoor athletic portrait shot in a golden-lit open field', 'Portrait · Fitness', ['portrait', 'fitness', 'outdoor', 'golden hour']],
  66: ['anime-couple-illustration', 'Anime-Style Couple Illustration', 'Anime-style illustration of two figures looking up at passing clouds', 'Illustration · Anime style', ['illustration', 'anime style', 'couple', 'sky']],
  67: null, // real athlete portrait, unmistakable likeness — excluded
  68: null, // real athlete, named magazine-style cover — excluded
  69: null, // real athlete portrait, unmistakable likeness — excluded
  70: ['earbuds-product-poster', 'Earbuds Product Poster', 'Product poster for wireless earbuds with bold display type', 'Poster · Audio', ['poster', 'product', 'audio', 'tech']],
  71: ['streetwear-character-figure', 'Streetwear Character Figure', 'Stylised character figure illustrated in streetwear', 'Illustration · Character', ['illustration', 'character design', 'streetwear', 'concept art']],
  72: ['soccer-jersey-portrait', 'Soccer Jersey Portrait', 'Fashion portrait styled around a soccer jersey and sunglasses', 'Portrait · Sport', ['portrait', 'sport', 'fashion', 'jersey']],
  73: null, // real athlete, national kit and name printed — excluded
  74: null, // real athlete, club-branded card format — excluded
  75: null, // real head of state, named graphic — excluded
  76: null, // real public figure, name printed on poster — excluded
  77: ['beauty-hand-on-face', 'Beauty Portrait, Hand On Face', 'Studio beauty portrait with the hand framing the jawline', 'Portrait · Beauty', ['portrait', 'beauty', 'studio', 'elegant']],
  78: ['casual-mirror-selfie', 'Casual Mirror Selfie', 'Casual mirror selfie in an all-black outfit', 'Portrait · Lifestyle', ['portrait', 'casual', 'selfie', 'lifestyle']],
  79: ['studio-portrait-arms-up', 'Studio Portrait, Arms Raised', 'Studio portrait with arms raised, plain backdrop', 'Portrait · Studio', ['portrait', 'studio', 'beauty', 'editorial']],
  80: ['cozy-sweater-selfie', 'Cozy Sweater Selfie', 'Casual selfie in an oversized, cozy sweater', 'Portrait · Casual', ['portrait', 'casual', 'cozy', 'lifestyle']],
  81: null, // boudoir bedroom framing — excluded
  82: ['golden-hour-sunglasses-portrait', 'Golden Hour Sunglasses Portrait', 'Warm-lit portrait in sunglasses and gold jewellery', 'Portrait · Beauty', ['portrait', 'beauty', 'sunglasses', 'golden hour']],
  83: ['silver-sports-car-poster', 'Silver Sports Car Poster', 'Automotive poster for a silver sports car, studio lit', 'Poster · Automotive', ['poster', 'automotive', 'sports car', 'product']],
  84: ['casual-bedroom-selfie', 'Casual Bedroom Selfie', 'Fully clothed casual selfie taken at home, phone visible in frame', 'Portrait · Casual', ['portrait', 'casual', 'lifestyle', 'selfie']],
  85: ['los-angeles-travel-poster', 'Los Angeles Travel Poster', 'Illustrated travel poster for Los Angeles in a retro palette', 'Poster · Travel', ['poster', 'illustration', 'travel', 'city']],
  86: ['car-lean-portrait', 'Car Lean Portrait', 'Portrait leaning against a car under an overcast sky', 'Portrait · Automotive', ['portrait', 'automotive', 'lifestyle', 'moody']],
  87: ['soft-portrait-white-blouse', 'Soft Portrait, White Blouse', 'Soft-lit portrait in a white blouse, hand near the face', 'Portrait · Beauty', ['portrait', 'beauty', 'soft', 'editorial']],
  88: ['dramatic-male-portrait', 'Dramatic Male Portrait', 'Low-key dramatic portrait, hand resting on the chin', 'Portrait · Moody', ['portrait', 'moody', 'editorial', 'dark']],
  89: ['striped-wall-portrait', 'Striped Wall Portrait', 'Kneeling fashion portrait against a bold striped wall', 'Portrait · Fashion', ['portrait', 'colorful', 'studio', 'fashion']],
  90: ['extreme-closeup-beauty', 'Extreme Close-Up Beauty', 'Extreme close-up beauty portrait focused on the eyes and skin', 'Portrait · Beauty', ['portrait', 'beauty', 'close-up', 'editorial']],
  91: null, // real athlete, named national-team card — excluded
  92: ['pink-floral-portrait', 'Pink Floral Portrait', 'Playful portrait styled in pink with floral props', 'Portrait · Beauty', ['portrait', 'floral', 'playful', 'pastel']],
  93: null, // real athlete portrait, unmistakable likeness — excluded
  94: ['blue-blazer-coastal-portrait', 'Blue Blazer Coastal Portrait', 'Editorial portrait in a blue blazer against a coastal backdrop', 'Portrait · Fashion', ['portrait', 'fashion', 'coastal', 'editorial']],
  95: null, // real athlete, named poster — excluded
  96: ['snack-beverage-grid', 'Snack And Beverage Grid', 'Four-up product grid spanning drinks and packaged snacks', 'Product · Grid', ['product', 'food', 'beverage', 'grid']],
  97: ['automotive-poster-series', 'Automotive Poster Series', 'Multi-panel automotive poster series built around one model', 'Poster · Automotive', ['poster', 'automotive', 'product', 'editorial']],
  98: ['studio-portrait-warm', 'Studio Portrait, Warm Tone', 'Studio portrait lit in a warm orange tone, plain backdrop', 'Portrait · Studio', ['portrait', 'studio', 'warm', 'editorial']],
}

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

const files = readdirSync(SRC_DIR)
  .filter((f) => /\.jpg$/i.test(f) && f !== DUPLICATE_OF_EXISTING)
  .sort()

if (files.length !== Object.keys(CATALOG).length) {
  throw new Error(`count mismatch: ${files.length} files vs ${Object.keys(CATALOG).length} catalog entries`)
}

// Existing entries continue the ordering the first drop left off at.
const EXISTING_MAX_ORDER = 31
let order = EXISTING_MAX_ORDER
let created = 0
let skipped = 0

files.forEach((file, i) => {
  const entry = CATALOG[i]
  if (!entry) {
    skipped++
    return
  }
  const [slug, title, desc, tagline, tags] = entry
  const { w, h } = jpegSize(readFileSync(path.join(SRC_DIR, file)))
  const name = `image-${slug}`
  const dir = path.join('registry', 'images', name)
  mkdirSync(dir, { recursive: true })
  order++

  copyFileSync(path.join(SRC_DIR, file), path.join('public/images', file))

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
        order,
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
  created++
})

console.log(`created ${created} image components, skipped ${skipped} (duplicate/excluded)`)

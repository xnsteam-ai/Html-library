# Images — 110

Ready-to-paste photography. The `<img>` points at a deployed CDN URL and is
portable as-is; do not rewrite it to a relative path.

```bash
BASE=https://xnsteam-ai.github.io/Html-library/r
curl -s $BASE/image-sunlit-portrait.json | jq -r '.files[0].content'   # markup
curl -s $BASE/image-sunlit-portrait.json | jq '.prompt'                # brief
```

## The `prompt` object

Every image carries a structured recreation brief. All fields are optional —
anything not observable in the file is omitted rather than guessed.

| Block | Fields |
|---|---|
| `subject` | age, descent, physical, expression, clothing |
| `composition` | shotType, angle, placement, distance, depthOfField, focus |
| `framing` | subjectScale, subjectBox, anchors, edges, negativeSpace |
| `environment` | setting, background, depth |
| `lighting` | quality, direction, temperature, shadows |
| `camera` | lens, quality, artifacts, aesthetic |
| `atmosphere` | mood, story, micro |

`framing` is the block most prompts omit. It pins subject scale, bounding box,
anchor lines, edge crops and negative space as percentages of the frame, so a
recreation lands at the same size and position instead of being re-centred.

## Catalogue

| Name | Title | Tags |
|---|---|---|
| `image-feathered-motion` | Feathered Motion | portrait, editorial, dark, fashion |
| `image-weathered-portrait` | Weathered Portrait | portrait, character, texture, cinematic |
| `image-skincare-sheet` | Skincare Product Sheet | product, skincare, grid, commercial |
| `image-iced-coffee-mockup` | Iced Coffee Mockup | product, beverage, mockup, splash |
| `image-motion-blur-crowd` | Motion Blur Crowd | motion, blur, crowd, editorial |
| `image-daisy-displacement` | Daisy Displacement | portrait, glitch, floral, surreal |
| `image-headphone-pop` | Headphone Pop | portrait, music, colour, youth |
| `image-wildflower-field` | Wildflower Field | nature, flowers, lifestyle, outdoor |
| `image-sky-skate-poster` | Sky Skate Poster | poster, skate, sky, sport |
| `image-feather-collar` | Feather Collar | portrait, studio, feather, teal |
| `image-streetwear-collage` | Streetwear Collage | collage, streetwear, grid, fashion |
| `image-golden-cover` | Golden Cover | cover, magazine, gold, portrait |
| `image-expression-grid` | Expression Grid | grid, expressions, contact sheet, denim |
| `image-plush-toy-set` | Plush Toy Set | product, plush, toys, grid |
| `image-summer-twirl` | Summer Twirl | fashion, summer, sky, movement |
| `image-boxing-cover` | Boxing Cover | cover, magazine, sport, typography |
| `image-flat-lay-fashion` | Flat Lay Fashion | fashion, flat lay, overhead, yellow |
| `image-device-beach-ad` | Device Beach Ad | ad, device, product, lifestyle |
| `image-mascot-hoodie` | Mascot Hoodie | mascot, character, blue, apparel |
| `image-idol-grid` | Idol Grid | grid, idol, green, portrait |
| `image-newsprint-editorial` | Newsprint Editorial | editorial, layout, fashion, newsprint |
| `image-portrait-collage` | Portrait Collage | collage, portrait, polaroid, print |
| `image-blue-bloom` | Blue Bloom | portrait, surreal, floral, blue |
| `image-cap-selfie` | Cap Selfie | street, selfie, casual, youth |
| `image-blossom-grid` | Blossom Grid | grid, pastel, blossom, spring |
| `image-sunlit-hands` | Sunlit Hands | portrait, sunlight, flare, warm |
| `image-blue-knit` | Blue Knit | portrait, knit, blue, warm |
| `image-own-the-sky` | Own The Sky | poster, sport, typography, blue |
| `image-sunlit-portrait` | Sunlit Portrait | portrait, sunlight, sky, natural |
| `image-fruit-soda-set` | Fruit Soda Set | product, beverage, fruit, grid |
| `image-ball-cap-portrait` | Ball Cap Portrait | portrait, casual, studio, neutral |
| `image-puffer-jacket-pair` | Puffer Jacket Pair | product, apparel, jacket, flat lay |
| `image-day-night-comparison` | Day And Night Comparison | portrait, comparison, beauty, split |
| `image-flat-cap-contact-sheet` | Flat Cap Contact Sheet | portrait, contact sheet, grid, casting reference |
| `image-phone-spec-diagram` | Phone Spec Diagram | product, tech, diagram, phone |
| `image-tailored-coat-street-style` | Tailored Coat Street Style | fashion, menswear, street, lookbook |
| `image-mirror-selfie-athletic` | Mirror Selfie, Athletic Wear | portrait, fitness, selfie, lifestyle |
| `image-smart-glasses-badge` | Smart Glasses Badge | product, tech, wearable, badge |
| `image-teal-eyes-portrait` | Teal Eyes Portrait | portrait, beauty, teal, mood |
| `image-roast-chicken-recipe-card` | Roast Chicken Recipe Card | infographic, food, recipe, card |
| `image-phone-case-exploded-view` | Phone Case Exploded View | product, tech, diagram, phone case |
| `image-performance-shoe-ad` | Performance Shoe Ad | poster, product, footwear, sport |
| `image-red-sport-poster` | Red Sport Brand Poster | poster, sport, apparel, editorial |
| `image-backlit-warehouse-portrait` | Backlit Warehouse Portrait | portrait, moody, industrial, cinematic |
| `image-urban-street-portrait` | Urban Street Portrait | portrait, street, urban, menswear |
| `image-outfit-lineup-grid` | Outfit Lineup Grid | fashion, lookbook, menswear, grid |
| `image-outdoor-apparel-poster` | Outdoor Apparel Poster | poster, outdoor, apparel, editorial |
| `image-snow-sport-portrait` | Snow Sport Portrait | portrait, winter, sport, blue |
| `image-beauty-close-up-necklace` | Beauty Close-Up | portrait, beauty, jewelry, close-up |
| `image-headphones-product-poster` | Headphones Product Poster | poster, product, audio, tech |
| `image-yellow-sports-car-poster` | Yellow Sports Car Poster | poster, automotive, sports car, product |
| `image-sports-car-spec-sheet` | Sports Car Spec Sheet | poster, automotive, spec sheet, product |
| `image-skincare-routine-card` | Skincare Routine Card | infographic, beauty, skincare, product |
| `image-blue-coupe-poster` | Blue Coupe Poster | poster, automotive, coupe, product |
| `image-beach-hat-portrait` | Beach Hat Portrait | portrait, swimwear, beach, summer |
| `image-winter-jacket-ad` | Winter Jacket Ad | poster, apparel, winter, editorial |
| `image-motion-pose-poster` | Motion Pose Poster | poster, dance, motion, editorial |
| `image-phone-call-poster` | Phone Call Poster | poster, product, tech, portrait |
| `image-fitness-pose-portrait` | Fitness Pose Portrait | portrait, fitness, gym, athletic |
| `image-motion-shoe-poster` | Motion Shoe Poster | poster, product, footwear, motion |
| `image-coastal-road-trip` | Coastal Road Trip | landscape, travel, coastal, van |
| `image-casting-reference-sheet-a` | Casting Reference Sheet A | casting, reference, grid, fashion |
| `image-casting-reference-sheet-b` | Casting Reference Sheet B | casting, reference, grid, headshots |
| `image-sunglasses-product-poster` | Sunglasses Product Poster | poster, product, eyewear, editorial |
| `image-lakeside-spring-portrait` | Lakeside Spring Portrait | portrait, outdoor, spring, lifestyle |
| `image-casual-outdoor-portrait` | Casual Outdoor Portrait | portrait, casual, lifestyle, outdoor |
| `image-short-hair-teal-portrait` | Short Hair Portrait | portrait, beauty, teal, hairstyle |
| `image-athletic-dark-portrait` | Athletic Dark Portrait | portrait, fitness, dark, editorial |
| `image-headshot-casting-grid-a` | Headshot Casting Grid A | casting, reference, grid, headshots |
| `image-phantom-shoe-ad` | Phantom Shoe Ad | poster, product, footwear, sport |
| `image-urban-calm-cover` | Urban Calm Cover | poster, illustration, cover, editorial |
| `image-headshot-casting-grid-b` | Headshot Casting Grid B | casting, reference, grid, headshots |
| `image-ice-cream-flowers-portrait` | Ice Cream And Flowers | portrait, lifestyle, playful, editorial |
| `image-shoe-lifestyle-collage` | Shoe Lifestyle Collage | product, footwear, collage, lifestyle |
| `image-gym-set-portrait` | Gym Set Portrait | portrait, fitness, gym, athletic |
| `image-sunlit-car-portrait` | Sunlit Car Portrait | portrait, automotive, lifestyle, golden hour |
| `image-poolside-portrait` | Poolside Portrait | portrait, swimwear, pool, summer |
| `image-garden-floral-portrait` | Garden Floral Portrait | portrait, floral, garden, outdoor |
| `image-lip-gloss-product-shot` | Lip Gloss Product Shot | product, beauty, cosmetics, close-up |
| `image-sedan-poster` | Sedan Poster | poster, automotive, sedan, product |
| `image-coconut-cooler-poster` | Coconut Cooler Poster | poster, beverage, product, summer |
| `image-character-reference-sheet` | Character Reference Sheet | illustration, character design, reference, concept art |
| `image-sofa-cat-portrait` | Sofa With Cat | portrait, lifestyle, pet, home |
| `image-gym-pose-pink` | Gym Pose Portrait | portrait, fitness, gym, athletic |
| `image-anime-style-illustration` | Anime-Style Illustration | illustration, anime style, scenic, character |
| `image-own-the-move-poster` | Own The Move Poster | poster, sport, apparel, editorial |
| `image-hairstyle-options-sheet` | Hairstyle Options Sheet | reference, beauty, hairstyle, grid |
| `image-athletic-field-portrait` | Athletic Field Portrait | portrait, fitness, outdoor, golden hour |
| `image-anime-couple-illustration` | Anime-Style Couple Illustration | illustration, anime style, couple, sky |
| `image-earbuds-product-poster` | Earbuds Product Poster | poster, product, audio, tech |
| `image-streetwear-character-figure` | Streetwear Character Figure | illustration, character design, streetwear, concept art |
| `image-soccer-jersey-portrait` | Soccer Jersey Portrait | portrait, sport, fashion, jersey |
| `image-beauty-hand-on-face` | Beauty Portrait, Hand On Face | portrait, beauty, studio, elegant |
| `image-casual-mirror-selfie` | Casual Mirror Selfie | portrait, casual, selfie, lifestyle |
| `image-studio-portrait-arms-up` | Studio Portrait, Arms Raised | portrait, studio, beauty, editorial |
| `image-cozy-sweater-selfie` | Cozy Sweater Selfie | portrait, casual, cozy, lifestyle |
| `image-golden-hour-sunglasses-portrait` | Golden Hour Sunglasses Portrait | portrait, beauty, sunglasses, golden hour |
| `image-silver-sports-car-poster` | Silver Sports Car Poster | poster, automotive, sports car, product |
| `image-casual-bedroom-selfie` | Casual Bedroom Selfie | portrait, casual, lifestyle, selfie |
| `image-los-angeles-travel-poster` | Los Angeles Travel Poster | poster, illustration, travel, city |
| `image-car-lean-portrait` | Car Lean Portrait | portrait, automotive, lifestyle, moody |
| `image-soft-portrait-white-blouse` | Soft Portrait, White Blouse | portrait, beauty, soft, editorial |
| `image-dramatic-male-portrait` | Dramatic Male Portrait | portrait, moody, editorial, dark |
| `image-striped-wall-portrait` | Striped Wall Portrait | portrait, colorful, studio, fashion |
| `image-extreme-closeup-beauty` | Extreme Close-Up Beauty | portrait, beauty, close-up, editorial |
| `image-pink-floral-portrait` | Pink Floral Portrait | portrait, floral, playful, pastel |
| `image-blue-blazer-coastal-portrait` | Blue Blazer Coastal Portrait | portrait, fashion, coastal, editorial |
| `image-snack-beverage-grid` | Snack And Beverage Grid | product, food, beverage, grid |
| `image-automotive-poster-series` | Automotive Poster Series | poster, automotive, product, editorial |
| `image-studio-portrait-warm` | Studio Portrait, Warm Tone | portrait, studio, warm, editorial |

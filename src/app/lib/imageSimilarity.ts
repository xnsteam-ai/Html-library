import type { RegistryItem } from '../../registry'

/**
 * "More inspiration" for the Images gallery.
 *
 * Counting shared tags was the obvious approach and it was wrong: `product`
 * covers 27 images and `automotive` covers 8, but both scored 1, so asking for
 * images like a sports-car poster returned plush toys and snack grids. Two
 * fixes, both classical IR:
 *
 *   - Rare terms carry more signal, so every term is IDF-weighted. Sharing
 *     `automotive` now says far more than sharing `product`.
 *   - Vectors are L2-normalised and compared by cosine, so an image with a
 *     long descriptive prompt does not out-score a terse one just by having
 *     more words.
 *
 * The signal is split into channels rather than one flat bag, because "looks
 * alike" and "is about the same thing" are different questions and deserve
 * different weights — and because the winning channel is what the UI shows as
 * the reason a result appeared.
 *
 * Everything here is derived from `meta.json`: curated tags plus the structured
 * `prompt` brief, which already describes the picture in exactly these terms
 * (`lighting.temperature` is palette, `camera.aesthetic` is style). Note this
 * is a *lexical* embedding over that text, not a neural one over pixels — good
 * enough to rank aesthetics, but it can only see what the prompt bothered to
 * write down.
 */

export interface SimilarImage {
  item: RegistryItem
  score: number
  /** Which channel contributed most — shown to explain the match. */
  reason: string
}

/** Filler that appears in most prompts and so carries no discriminating signal. */
const STOP_WORDS = new Set(
  `a an the and or of to in on at with for from by as is are was were be been it its this that those these
   than then so such not no none very more most much many few some any each per into onto over under above
   below up down out off across along around through between within without near behind front back side
   left right top bottom middle centre center look looks looking like but also just only still even same
   other another one two three four five photographed shot taken image picture frame framing scene subject
   background foreground slight slightly`
    .split(/\s+/)
    .filter(Boolean),
)

function tokenize(value: unknown): string[] {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word) && !/^\d+$/.test(word))
}

type Source = [terms: string[], weight: number]

interface Channel {
  label: string
  weight: number
  sourcesOf: (item: RegistryItem) => Source[]
}

/**
 * Weights are a judgement about what makes two pictures feel related: curated
 * tags lead because a human chose them, then what the picture is *about*, then
 * what it *looks like*, then how it was *made*.
 */
const CHANNELS: Record<string, Channel> = {
  tags: {
    label: 'Shared tags',
    weight: 0.3,
    sourcesOf: (item) => [[(item.tags ?? []).flatMap(tokenize), 1]],
  },
  theme: {
    label: 'Same theme',
    weight: 0.2,
    sourcesOf: (item) => {
      const prompt = item.prompt
      return [
        [tokenize(prompt?.environment?.setting), 1.4],
        [tokenize(prompt?.environment?.background), 1.0],
        [tokenize(prompt?.atmosphere?.mood), 1.2],
        [tokenize(prompt?.atmosphere?.story), 0.8],
        [tokenize(prompt?.subject?.clothing), 0.8],
        [tokenize(prompt?.subject?.expression), 0.6],
      ]
    },
  },
  visual: {
    label: 'Similar look',
    weight: 0.25,
    sourcesOf: (item) => {
      const prompt = item.prompt
      return [
        // Temperature is the closest thing the brief has to a palette.
        [tokenize(prompt?.lighting?.temperature), 1.5],
        [tokenize(prompt?.lighting?.quality), 1.2],
        [tokenize(prompt?.composition?.shotType), 1.2],
        [tokenize(prompt?.lighting?.direction), 0.8],
        [tokenize(prompt?.lighting?.shadows), 0.8],
        [tokenize(prompt?.composition?.depthOfField), 0.6],
        [tokenize(prompt?.composition?.angle), 0.6],
      ]
    },
  },
  craft: {
    label: 'Same technique',
    weight: 0.15,
    sourcesOf: (item) => {
      const prompt = item.prompt
      return [
        [tokenize(prompt?.camera?.aesthetic), 1.6],
        [tokenize(prompt?.camera?.lens), 1.0],
        [tokenize(prompt?.camera?.quality), 0.8],
        [tokenize(prompt?.camera?.artifacts), 0.5],
      ]
    },
  },
}

/** Every channel pooled into one vector, which catches resonance no single channel sees. */
const EMBEDDING_WEIGHT = 0.1

/** Keep a result only if it clears both a share of the best match and a hard floor. */
const RELATIVE_FLOOR = 0.18
const ABSOLUTE_FLOOR = 0.04
const MAX_RESULTS = 24

type Vector = Map<string, number>

function buildBag(sources: Source[]): Vector {
  const bag: Vector = new Map()
  for (const [terms, weight] of sources) {
    for (const term of terms) bag.set(term, (bag.get(term) ?? 0) + weight)
  }
  return bag
}

/** TF-IDF over the corpus, L2-normalised so cosine is a plain dot product. */
function buildVectors(items: RegistryItem[], bagOf: (item: RegistryItem) => Vector) {
  const bags = new Map(items.map((item) => [item.name, bagOf(item)]))

  const documentFrequency = new Map<string, number>()
  for (const bag of bags.values()) {
    for (const term of bag.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
    }
  }

  const total = items.length
  const vectors = new Map<string, Vector>()
  for (const [name, bag] of bags) {
    const vector: Vector = new Map()
    let norm = 0
    for (const [term, weight] of bag) {
      const value = weight * Math.log(total / (documentFrequency.get(term) ?? total))
      // A term in every document has zero IDF and is dropped rather than kept at 0.
      if (value > 0) {
        vector.set(term, value)
        norm += value * value
      }
    }
    norm = Math.sqrt(norm) || 1
    for (const [term, value] of vector) vector.set(term, value / norm)
    vectors.set(name, vector)
  }
  return vectors
}

function cosine(a: Vector | undefined, b: Vector | undefined): number {
  if (!a || !b) return 0
  // Walk the shorter vector; the result is identical and the cost is bounded by it.
  const [small, large] = a.size < b.size ? [a, b] : [b, a]
  let total = 0
  for (const [term, value] of small) {
    const other = large.get(term)
    if (other) total += value * other
  }
  return total
}

interface Index {
  channels: Record<string, Map<string, Vector>>
  embedding: Map<string, Vector>
}

// The registry is static, so the index is built once and reused. Keyed on the
// item set so a changed library rebuilds instead of serving a stale index.
let cached: { key: string; index: Index } | null = null

function getIndex(items: RegistryItem[]): Index {
  const key = `${items.length}:${items.map((item) => item.name).join(',')}`
  if (cached?.key === key) return cached.index

  const channels: Record<string, Map<string, Vector>> = {}
  for (const [name, channel] of Object.entries(CHANNELS)) {
    channels[name] = buildVectors(items, (item) => buildBag(channel.sourcesOf(item)))
  }
  const embedding = buildVectors(items, (item) =>
    buildBag(Object.values(CHANNELS).flatMap((channel) => channel.sourcesOf(item))),
  )

  const index = { channels, embedding }
  cached = { key, index }
  return index
}

/**
 * Images related to `target`, best first. Returns an empty array when nothing
 * clears the floor — which the caller must be able to tell apart from "nothing
 * selected", so the empty state can say the right thing.
 */
export function findSimilarImages(items: RegistryItem[], target: RegistryItem): SimilarImage[] {
  const index = getIndex(items)

  const scored = items
    .filter((item) => item.name !== target.name)
    .map((item) => {
      let score = 0
      let bestChannel = ''
      let bestContribution = 0

      for (const [name, channel] of Object.entries(CHANNELS)) {
        const contribution =
          cosine(index.channels[name].get(target.name), index.channels[name].get(item.name)) *
          channel.weight
        score += contribution
        if (contribution > bestContribution) {
          bestContribution = contribution
          bestChannel = name
        }
      }

      score += cosine(index.embedding.get(target.name), index.embedding.get(item.name)) * EMBEDDING_WEIGHT

      return {
        item,
        score,
        reason: bestChannel ? CHANNELS[bestChannel].label : 'Related',
      }
    })
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))

  const best = scored[0]?.score ?? 0
  // Relative to the best match as well as absolute: a distinctive image has a
  // few strong neighbours, a generic one has many weak ones, and a single fixed
  // cutoff serves one of those badly.
  const floor = Math.max(ABSOLUTE_FLOOR, best * RELATIVE_FLOOR)

  return scored.filter((entry) => entry.score >= floor).slice(0, MAX_RESULTS)
}

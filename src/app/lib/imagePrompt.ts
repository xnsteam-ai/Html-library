import type { ImagePromptSpec, RegistryItem } from '../../registry'

/**
 * Renders an image's analysis as the library's MASTER PROMPT TEMPLATE — the
 * text an image model receives when someone wants this exact shot back with a
 * different subject in it.
 *
 * Two rules drive the whole file:
 *
 *  1. Anything derivable from the asset itself (filename, URL, pixel size,
 *     aspect) is computed here rather than stored, so it can never drift from
 *     the markup it describes.
 *  2. Anything *not* observable is omitted, not filled in. No invented EXIF
 *     dates, no guessed demographics. A field that isn't there is a field we
 *     genuinely could not read off the image.
 */

interface AssetFacts {
  id: string
  mediaUrl: string
  width?: number
  height?: number
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/** Pulls src/width/height straight out of the component markup. */
export function assetFacts(item: RegistryItem): AssetFacts {
  const src = item.html.match(/src="([^"]+)"/)?.[1] ?? ''
  const width = Number(item.html.match(/width="(\d+)"/)?.[1]) || undefined
  const height = Number(item.html.match(/height="(\d+)"/)?.[1]) || undefined
  const id = src.split('/').pop()?.split('?')[0] ?? item.name
  return { id, mediaUrl: src, width, height }
}

function aspect(width?: number, height?: number): string | undefined {
  if (!width || !height) return undefined
  const divisor = gcd(width, height)
  return `${width}×${height} (${width / divisor}:${height / divisor})`
}

/**
 * The canvas line is derived rather than authored — orientation and ratio are
 * facts about the file, and stating them up front stops a model defaulting to
 * a square or landscape frame for what is actually a tall portrait crop.
 */
function canvas(width?: number, height?: number): string | undefined {
  if (!width || !height) return undefined
  const divisor = gcd(width, height)
  const ratio = `${width / divisor}:${height / divisor}`
  const shape = width / height < 0.95 ? 'Vertical / portrait' : width / height > 1.05 ? 'Horizontal / landscape' : 'Square'
  return `${shape} canvas, ${ratio} — compose for this exact aspect, do not letterbox or re-crop`
}

/** `- Label: value`, or nothing at all when the value is missing. */
function line(label: string, value?: string): string[] {
  return value ? [`- ${label}: ${value}`] : []
}

/**
 * A section renders only if it has at least one populated field, so an image
 * with no people in it simply has no SUBJECT block rather than a wall of
 * "N/A".
 */
function section(heading: string, lines: string[]): string[] {
  return lines.length ? [`### ${heading}`, ...lines, ''] : []
}

const RECREATION_DIRECTIVE =
  'Recreate this exact composition, lighting, camera characteristics, environment, ' +
  'technical quality, and atmosphere. Match the canvas aspect and the frame geometry ' +
  'first: place the subject at the stated scale, bounding box and anchor lines, and ' +
  'reproduce the stated edge crops rather than re-centring, adding headroom, or fitting ' +
  'the whole subject inside the frame. Only change the SUBJECT block when instructed. ' +
  'Do not invent new background elements, alter the lighting setup, change the framing, ' +
  'or modify the technical aesthetic unless explicitly asked. Preserve the original ' +
  'quality exactly as described.'

export function buildPromptTemplate(item: RegistryItem): string {
  const spec: ImagePromptSpec = item.prompt ?? {}
  const { id, mediaUrl, width, height } = assetFacts(item)
  const { subject, composition, framing, environment, lighting, camera, atmosphere } = spec

  const out: string[] = [
    '### MEDIA_ASSET',
    ...line('ID', id),
    '- Type: image',
    ...line('Media URL', mediaUrl),
    ...line('Resolution / Aspect', aspect(width, height)),
    ...line('Source', 'Synthetic / generated stock — no photographer attribution'),
    ...line('Date Created', 'Unknown — no EXIF retained in the delivered file'),
    ...line('Tags', item.tags?.join(', ')),
    '',

    ...section('SUBJECT (replaceable)', [
      ...line('Age / apparent range', subject?.age),
      ...line('Ethnicity / descent cues', subject?.descent),
      ...line('Hair, features, body, posture', subject?.physical),
      ...line('Expression / emotional state', subject?.expression),
      ...line('Clothing / accessories / surface details', subject?.clothing),
    ]),

    // Geometry sits directly under shot type: a model reads top-down, and
    // placement has to land before lighting or mood get a chance to drift it.
    ...section('COMPOSITION & FRAMING', [
      ...line('Shot type', composition?.shotType),
      ...line('Canvas & orientation', canvas(width, height)),
      ...line('Subject scale in frame', framing?.subjectScale),
      ...line('Subject bounding box', framing?.subjectBox),
      ...line('Key anchor lines', framing?.anchors),
      ...line('Edge crops', framing?.edges),
      ...line('Negative space / margins', framing?.negativeSpace),
      ...line('Camera angle', composition?.angle),
      ...line('Subject placement', composition?.placement),
      ...line('Distance to subject', composition?.distance),
      ...line('Depth of field', composition?.depthOfField),
      ...line('Focus point', composition?.focus),
      '- Motion: N/A — still image',
    ]),

    ...section('ENVIRONMENT & BACKGROUND', [
      ...line('Setting', environment?.setting),
      ...line('Background elements', environment?.background),
      ...line('Depth layers', environment?.depth),
    ]),

    ...section('LIGHTING & COLOR', [
      ...line('Light quality', lighting?.quality),
      ...line('Light direction & sources', lighting?.direction),
      ...line('Color temperature / mood', lighting?.temperature),
      ...line('Shadows & highlights', lighting?.shadows),
    ]),

    ...section('CAMERA & TECHNICAL AESTHETIC', [
      ...line('Lens / focal length feel', camera?.lens),
      ...line('Image quality traits', camera?.quality),
      ...line('Artifacts present', camera?.artifacts),
      ...line('Overall aesthetic keywords', camera?.aesthetic),
    ]),

    ...section('ATMOSPHERE & NARRATIVE CUES', [
      ...line('Mood / emotional tone', atmosphere?.mood),
      ...line('Implied story', atmosphere?.story),
      ...line('Micro-expressions to preserve', atmosphere?.micro),
    ]),

    '### RECREATION DIRECTIVE',
    RECREATION_DIRECTIVE,
    '',
    '---',
    'Distributed via HTML Library. Attribution line only — not part of the recreation prompt.',
  ]

  return out.join('\n')
}

/** True once an image carries enough analysis for the template to say anything. */
export function hasPromptSpec(item: RegistryItem): boolean {
  return Boolean(item.prompt && Object.keys(item.prompt).length > 0)
}

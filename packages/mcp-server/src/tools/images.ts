import { z } from 'zod'

import { closestNames, type RegistryData } from '../data.js'
import { fail, json, type ToolDef } from './shared.js'

const BLOCKS = [
  'subject',
  'composition',
  'framing',
  'environment',
  'lighting',
  'camera',
  'atmosphere',
] as const

export function imageTools(data: RegistryData): ToolDef[] {
  return [
    {
      name: 'get_image_prompt',
      config: {
        title: 'Get image prompt',
        description:
          'Get the structured recreation brief for an image component — subject, composition, framing geometry, environment, lighting, camera and atmosphere — ready to hand to an image model.',
        inputSchema: {
          name: z.string().min(1).describe('Image component name, e.g. "image-sunlit-portrait".'),
        },
      },
      handler: async ({ name }) => {
        const component = await data.get(name)
        if (!component) {
          const images = (await data.summaries())
            .filter((c) => c.category === 'images')
            .map((c) => c.name)
          return fail(`No component named "${name}".`, {
            didYouMean: closestNames(images, name),
            hint: 'Call list_components with category "images" to browse all 110.',
          })
        }
        if (!component.prompt) {
          return fail(
            `"${name}" has no prompt — recreation briefs exist only on images category items, and this is ${component.category}.`,
            { category: component.category },
          )
        }

        const present = BLOCKS.filter((block) => component.prompt?.[block])
        return json({
          name: component.name,
          title: component.title,
          tags: component.tags,
          prompt: component.prompt,
          blocksPresent: present,
          blocksOmitted: BLOCKS.filter((block) => !component.prompt?.[block]),
          note: 'Fields not observable in the source image are omitted rather than guessed. The framing block pins subject scale, bounding box, anchors, edge crops and negative space as percentages of the frame, so a recreation lands at the same size and position instead of being re-centred.',
        })
      },
    },
  ]
}

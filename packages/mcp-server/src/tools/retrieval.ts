import { z } from 'zod'

import { closestNames, toRegistryItemJson, type RegistryData } from '../data.js'
import { type GuideSession } from './guide.js'
import { fail, json, type ToolDef } from './shared.js'

/**
 * Markup is where not knowing the design language actually costs something, so
 * the first time an agent takes some without having read the guide, say so.
 * Once per session: a client that ignored the server instructions gets one
 * correction, and one that did not is never nagged.
 */
function guideNudge(session: GuideSession): { designGuide: string } | Record<string, never> {
  if (session.read || session.nudged) return {}
  session.nudged = true
  return {
    designGuide:
      'You have not read the design guide this session. Call get_design_guide before adapting this markup — it carries the palette, type scale, radius rhythm and dark-mode strategy this component assumes.',
  }
}

export function retrievalTools(data: RegistryData, session: GuideSession): ToolDef[] {
  return [
    {
      name: 'get_component',
      config: {
        title: 'Get component',
        description:
          'Get one component in full — metadata, the complete HTML in files[0].content, portability, and (for images) its recreation prompt. Pair with get_design_guide before adapting the markup.',
        inputSchema: {
          name: z.string().min(1).describe('Exact component name, e.g. "switch" or "agent-chat".'),
        },
      },
      handler: async ({ name }) => {
        const component = await data.get(name)
        if (!component) {
          const suggestions = closestNames(await data.names(), name)
          return fail(`No component named "${name}".`, {
            didYouMean: suggestions,
            hint: 'Call search_components or list_components to find the right name.',
          })
        }
        return json({
          ...toRegistryItemJson(component),
          ...guideNudge(session),
          portability: {
            portable: component.portable,
            appTokens: component.appTokens,
            ...(component.portable
              ? {}
              : {
                  warning:
                    'This markup uses tokens that only resolve inside the html-library docs app. Run check_portability on files[0].content before pasting it elsewhere.',
                }),
          },
          hasScopedStyle: component.hasStyle,
        })
      },
    },

    {
      name: 'get_component_markup',
      config: {
        title: 'Get component markup',
        description:
          'Get just the copy-paste HTML for one or more components. This is the whole install step — there is no CLI and nothing to npm install. Call get_design_guide first if you will restyle or extend what you get back.',
        inputSchema: {
          names: z
            .array(z.string().min(1))
            .min(1)
            .max(20)
            .describe('Component names, e.g. ["switch", "agent-chat"].'),
        },
      },
      handler: async ({ names }) => {
        const results = []
        const notFound = []
        for (const name of names as string[]) {
          const component = await data.get(name)
          if (!component) {
            notFound.push(name)
            continue
          }
          results.push({
            name: component.name,
            html: component.html,
            portable: component.portable,
            ...(component.portable ? {} : { appTokens: component.appTokens }),
          })
        }

        const impure = results.filter((r) => !r.portable).map((r) => r.name)
        return json({
          results,
          notFound,
          ...guideNudge(session),
          ...(notFound.length > 0
            ? { didYouMean: closestNames(await data.names(), notFound[0]) }
            : {}),
          ...(impure.length > 0
            ? {
                warning: `${impure.join(', ')} use app-only tokens and will render wrong outside the docs app. Pass the html to check_portability to get the corrected markup.`,
              }
            : {}),
          reminder:
            'Paste as-is into any HTML file, template or framework that accepts a class attribute. Do not convert class to className unless you are porting to JSX. Never add JavaScript — interactivity here is CSS-only.',
        })
      },
    },
  ]
}

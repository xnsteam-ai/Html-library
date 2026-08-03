import { z } from 'zod'

import { closestNames, toRegistryItemJson, type RegistryData } from '../data.js'
import { fail, json, type ToolDef } from './shared.js'

export function retrievalTools(data: RegistryData): ToolDef[] {
  return [
    {
      name: 'get_component',
      config: {
        title: 'Get component',
        description:
          'Get one component in full — metadata, the complete HTML in files[0].content, portability, and (for images) its recreation prompt.',
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
          'Get just the copy-paste HTML for one or more components. This is the whole install step — there is no CLI and nothing to npm install.',
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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { RegistryData } from './data.js'
import { resolveSource, type Source } from './source.js'
import { compositionTools } from './tools/composition.js'
import { discoveryTools } from './tools/discovery.js'
import { imageTools } from './tools/images.js'
import { portabilityTools } from './tools/portability.js'
import { retrievalTools } from './tools/retrieval.js'
import { fail, type ToolDef } from './tools/shared.js'

export const SERVER_NAME = 'html-library'
export const SERVER_VERSION = '0.1.0'

const INSTRUCTIONS = `The HTML Library registry: 191 copy-paste UI components written in plain HTML + Tailwind CSS.

This is not React. There is no package to install, no CLI, and no build step. A component is a self-contained fragment of markup; "installing" it means pasting files[0].content into any file that accepts a class attribute — HTML, Vue, Svelte, Astro, Blade, ERB, Jinja, or JSX after renaming class to className.

Rules that prevent almost every mistake:
1. It is class, never className. These are HTML files.
2. Never add JavaScript. Interactivity is CSS-only — hidden radios and checkboxes driving peer-checked:, group-has-[...]: and :has(). Call get_interactivity_pattern rather than reaching for a script.
3. 55 of the 191 components use theme tokens that only resolve inside the docs app and render invisible anywhere else. Always run check_portability on markup before pasting it into another project.
4. Every colour utility needs its dark: partner.
5. Re-namespace id / for / name if you paste a component twice — CSS-only state is keyed on them.
6. Keep any <style> block; it carries keyframes or a scoped theme that utilities cannot express.

Start with recommend_components when you know the goal, search_components when you know the keyword, or get_categories to browse.`

export function buildServer(source: Source = resolveSource()): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
  )

  const data = new RegistryData(source)

  const tools: ToolDef[] = [
    ...discoveryTools(data),
    ...retrievalTools(data),
    ...portabilityTools(data),
    ...compositionTools(data),
    ...imageTools(data),
  ]

  for (const tool of tools) {
    server.registerTool(tool.name, tool.config as never, (async (args: unknown) => {
      try {
        return await tool.handler(args)
      } catch (error) {
        // A throw here would tear down the stdio session and take every other
        // tool with it, so failures are returned as results instead.
        const message = error instanceof Error ? error.message : String(error)
        return fail(`${tool.name} failed: ${message}`)
      }
    }) as never)
  }

  return server
}

export const TOOL_NAMES = [
  'list_components',
  'search_components',
  'get_categories',
  'get_component',
  'get_component_markup',
  'check_portability',
  'get_component_portability',
  'lint_html',
  'recommend_components',
  'get_recipe',
  'get_interactivity_pattern',
  'get_image_prompt',
] as const

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'

import { buildServer } from '../dist/server.js'

const here = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.resolve(here, '../../..')
export const REGISTRY_DIR = path.join(REPO_ROOT, 'registry')

/**
 * A real client talking to a real server over a linked in-memory transport —
 * so the tests exercise the zod schemas and the SDK wiring, not just the
 * handler functions underneath.
 */
export async function connect(source = { mode: 'local', registryDir: REGISTRY_DIR }) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const server = buildServer(source)
  const client = new Client({ name: 'html-library-mcp-test', version: '0.0.0' })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  return {
    client,
    async close() {
      await client.close()
      await server.close()
    },
  }
}

/** Tool results are JSON in a text block; give tests the parsed object. */
export async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args })
  const text = result.content?.[0]?.text ?? '{}'
  return { isError: Boolean(result.isError), data: JSON.parse(text) }
}

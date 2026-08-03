#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { buildServer, SERVER_VERSION } from './server.js'
import { describeSource, resolveSource } from './source.js'

async function main(): Promise<void> {
  if (process.argv.includes('--version') || process.argv.includes('-v')) {
    process.stdout.write(`${SERVER_VERSION}\n`)
    return
  }

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.stdout.write(
      [
        'html-library-mcp — MCP server for the HTML Library registry',
        '',
        'Runs as a stdio MCP server. Point your client at it rather than running it by hand.',
        '',
        'Environment:',
        '  HTML_LIBRARY_SOURCE=local|remote   force a data source (default: auto-detect)',
        '  HTML_LIBRARY_REGISTRY_DIR=<path>   use a specific registry/ folder',
        '',
        'With no override it reads registry/ from the current checkout if it can find one,',
        'and otherwise falls back to the hosted registry over HTTPS.',
        '',
      ].join('\n'),
    )
    return
  }

  const source = resolveSource()
  // stdout is the JSON-RPC channel — anything human-readable must go to stderr.
  process.stderr.write(`html-library-mcp ${SERVER_VERSION}: ${describeSource(source)}\n`)

  const server = buildServer(source)
  await server.connect(new StdioServerTransport())
}

main().catch((error) => {
  process.stderr.write(`html-library-mcp: ${error instanceof Error ? error.stack : String(error)}\n`)
  process.exit(1)
})

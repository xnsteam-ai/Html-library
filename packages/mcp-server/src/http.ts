#!/usr/bin/env node
/**
 * Remote transport for the same server the stdio binary runs.
 *
 * `buildServer()` already creates a fresh McpServer/RegistryData/GuideSession on
 * every call — nothing here needed to change for that; it was already safe to
 * call once per incoming session. This file only adds the HTTP plumbing: route
 * `/mcp`, keep one StreamableHTTPServerTransport per session, and hand each
 * request to the transport that owns its session.
 *
 * Deliberately Node-only. The vendored skill docs are read off disk (see
 * tools/guide.ts), which is correct for any real Node process but means this
 * does not run on a filesystem-less edge runtime without first moving those
 * reads to bundled string imports — a separate piece of work, not started here.
 */
import { randomUUID } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import { buildServer, SERVER_VERSION } from './server.js'
import { resolveSource } from './source.js'

const PORT = Number(process.env.PORT) || 8787
const PATH = '/mcp'

// A deployed instance has no repo checkout to detect, and detection itself
// costs an fs stat per candidate directory for no benefit here.
if (!process.env.HTML_LIBRARY_SOURCE) process.env.HTML_LIBRARY_SOURCE = 'remote'

const sessions = new Map<string, StreamableHTTPServerTransport>()

function setCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, mcp-session-id, mcp-protocol-version',
  )
  // Without this a browser-based client (the Inspector's web UI, or any future
  // browser-side MCP client) can send the session id but never read it back
  // from the initialize response, and every request after the first 400s.
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id')
}

function sendJsonRpcError(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message }, id: null }))
}

async function startSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      sessions.set(id, transport)
    },
    onsessionclosed: (id) => {
      sessions.delete(id)
    },
  })

  // Belt and braces alongside onsessionclosed: not every disconnect reaches the
  // MCP-level close callback (a client that vanishes mid-request will not send
  // a DELETE), so the transport's own close event is the backstop that actually
  // frees the entry.
  transport.onclose = () => {
    if (transport.sessionId) sessions.delete(transport.sessionId)
  }

  const server = buildServer(resolveSource())
  await server.connect(transport)
  await transport.handleRequest(req, res)
}

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = req.headers['mcp-session-id']
  const id = Array.isArray(sessionId) ? sessionId[0] : sessionId

  if (id) {
    const transport = sessions.get(id)
    if (!transport) {
      sendJsonRpcError(res, 400, 'Invalid or expired session ID')
      return
    }
    await transport.handleRequest(req, res)
    return
  }

  // No session header: only a POST can be the initialize call that starts one.
  if (req.method !== 'POST') {
    sendJsonRpcError(res, 400, 'Missing mcp-session-id header')
    return
  }
  await startSession(req, res)
}

const server = createServer(async (req, res) => {
  setCors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Strip the query string and any trailing slash before matching. A pasted
  // "…/mcp/" is the same endpoint as "…/mcp", and 404ing it surfaces in a
  // client as "the URL is not a valid MCP server" — an unhelpful way to report
  // a stray character.
  const pathname = (req.url ?? '/').split('?')[0].replace(/\/+$/, '') || '/'
  const isRoot = pathname === '/'

  // Root serves the health check, except when a session header proves the
  // caller is a client that opened its session here (see below) and is now
  // asking for its SSE stream.
  if (isRoot && req.method === 'GET' && !req.headers['mcp-session-id']) {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(`html-library-mcp ${SERVER_VERSION}\nMCP endpoint: POST ${PATH}\n`)
    return
  }

  // Root also speaks MCP, so pasting the bare origin into a connector dialog
  // works instead of failing with a bare 404 that names no cause.
  if (pathname !== PATH && !isRoot) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end(`Not found. The MCP endpoint is ${PATH} — try POST ${PATH}.\n`)
    return
  }

  if (req.method === 'POST' || req.method === 'GET' || req.method === 'DELETE') {
    try {
      await handleMcp(req, res)
    } catch (error) {
      // A throw here would otherwise crash the whole process and every other
      // session with it — the stdio server has the same guard for the same
      // reason, just with more sessions at stake.
      console.error('html-library-mcp: request failed:', error)
      if (!res.headersSent) sendJsonRpcError(res, 500, 'Internal server error')
    }
    return
  }

  res.writeHead(405)
  res.end()
})

server.listen(PORT, () => {
  console.log(`html-library-mcp ${SERVER_VERSION}: listening on :${PORT}${PATH}`)
  console.log(`  source: ${process.env.HTML_LIBRARY_SOURCE}`)
})

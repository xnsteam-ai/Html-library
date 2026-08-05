#!/usr/bin/env node
/**
 * Remote transport for the same server the stdio binary runs.
 *
 * Stateless by design: one StreamableHTTPServerTransport per request, no
 * server-side session map at all (`sessionIdGenerator: undefined`, the SDK's
 * own documented stateless mode). This is deployed on Fly with two machines
 * and no session affinity — a stateful in-memory session map only works if
 * every request in a handshake lands on the machine that started it, and
 * fly-proxy balances per request, not per connection. The first version of
 * this file kept sessions in a `Map` and failed ~90% of real handshakes as a
 * result: `initialize` would land on machine A, and the very next request
 * (the SSE stream, or `notifications/initialized`) would round-robin to
 * machine B, which had never heard of that session, and reject it. Stateless
 * mode makes the machine that answers irrelevant, since there is nothing for
 * a second machine to have missed.
 *
 * `RegistryData` and the `GuideSession` are shared at module scope rather
 * than rebuilt per request, so a fresh transport per call does not mean a
 * fresh network fetch of the registry index per call — see the comments on
 * `sharedData`/`sharedGuideSession` below for why each is safe to share.
 *
 * Deliberately Node-only. The vendored skill docs are read off disk (see
 * tools/guide.ts), which is correct for any real Node process but means this
 * does not run on a filesystem-less edge runtime without first moving those
 * reads to bundled string imports — a separate piece of work, not started here.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import { buildServer, SERVER_VERSION } from './server.js'
import { resolveSource } from './source.js'
import { newGuideSession } from './tools/guide.js'
import { RegistryData } from './data.js'

const PORT = Number(process.env.PORT) || 8787
const PATH = '/mcp'

// A deployed instance has no repo checkout to detect, and detection itself
// costs an fs stat per candidate directory for no benefit here.
if (!process.env.HTML_LIBRARY_SOURCE) process.env.HTML_LIBRARY_SOURCE = 'remote'

// One cache for the process, not one per request. `RegistryData` holds only
// `loaded`/`partial`/`fetched` — read-through caches of an immutable published
// registry, nothing session-specific — so sharing it is safe, and not sharing
// it means every `get_component` call re-fetches the ~100KB index.json from
// GitHub Pages, every time, forever.
const sharedData = new RegistryData(resolveSource())

// One nudge state for the process rather than one per request. The nudge
// (`tools/retrieval.ts`) exists to tell a client, once, that it pulled markup
// without reading the design guide first — firing it on every request instead
// of once per conversation would make it noise instead of a hint. Sharing it
// process-wide means the first caller after each boot gets the nudge and
// everyone after does not, which undersells it a little; the alternative,
// truly stateless, means it fires on every call, which is worse.
const sharedGuideSession = newGuideSession()

function setCors(req: IncomingMessage, res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  // Echo whatever the browser asked to send, falling back to the headers this
  // server actually reads. A hardcoded list 404s any preflight for a header a
  // future client adds; echoing is what actually keeps the Inspector's web UI
  // (and any other browser-based client) unblocked without hand-maintaining it.
  const requested = req.headers['access-control-request-headers']
  res.setHeader(
    'Access-Control-Allow-Headers',
    requested ?? 'Content-Type, Accept, mcp-session-id, mcp-protocol-version',
  )
}

function sendJsonRpcError(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message }, id: null }))
}

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Stateless mode has no SSE stream to open and nothing a session id would
  // select between, so GET/DELETE have nothing to do. 405 (not 400/404) is
  // the status the SDK's own client treats as "this endpoint offers no
  // standalone stream" and tolerates silently — anything else it throws on.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    sendJsonRpcError(res, 405, 'This server is stateless: only POST is supported.')
    return
  }

  // A client sending exactly `Accept: */*` is spec-valid (it matches both
  // required types) but the transport's own check is a literal substring
  // match against `application/json` and `text/event-stream`, so `*/*` alone
  // fails it. Normalising here is cheaper than special-casing every client
  // that takes the RFC's word for what `*/*` means.
  const accept = req.headers.accept
  if (!accept || accept.trim() === '*/*') {
    req.headers.accept = 'application/json, text/event-stream'
  }

  // A fresh transport and server per request, wired to the shared caches
  // above. No session id is ever generated or checked, so it does not matter
  // which of the two Fly machines answers this request or the next one.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  const server = buildServer(resolveSource(), sharedData, sharedGuideSession)

  res.on('close', () => {
    void transport.close()
    void server.close()
  })

  await server.connect(transport)
  await transport.handleRequest(req, res)
}

const server = createServer(async (req, res) => {
  setCors(req, res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Cheap and unconditional: with no session state to inspect, this is the
  // only record of what actually reached the process, and it is what turns
  // "a client can't connect" from a guessing game into a five-minute fix.
  console.log(
    `${req.method} ${req.url} accept=${req.headers.accept ?? '-'} ua=${req.headers['user-agent'] ?? '-'}`,
  )

  // Strip the query string and any trailing slash before matching. A pasted
  // "…/mcp/" is the same endpoint as "…/mcp", and 404ing it surfaces in a
  // client as "the URL is not a valid MCP server" — an unhelpful way to report
  // a stray character.
  const pathname = (req.url ?? '/').split('?')[0].replace(/\/+$/, '') || '/'
  const isRoot = pathname === '/'

  if (isRoot && req.method === 'GET') {
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

  try {
    await handleMcp(req, res)
  } catch (error) {
    // A throw here would otherwise crash the whole process and every other
    // in-flight request with it.
    console.error('html-library-mcp: request failed:', error)
    if (!res.headersSent) sendJsonRpcError(res, 500, 'Internal server error')
  }
})

server.listen(PORT, () => {
  console.log(`html-library-mcp ${SERVER_VERSION}: listening on :${PORT}${PATH} (stateless)`)
  console.log(`  source: ${process.env.HTML_LIBRARY_SOURCE}`)
})

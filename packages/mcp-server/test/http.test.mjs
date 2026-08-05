import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

import { REPO_ROOT } from './helpers.mjs'

/**
 * The in-memory tests (guide.test.mjs, tools.integration.test.mjs, …) prove
 * the tools work; they say nothing about the HTTP transport itself — routing,
 * CORS, and statelessness are all plumbing that only exists in http.ts and is
 * invisible to InMemoryTransport. This drives a real server process over real
 * HTTP, the same path a deployed instance and Claude's connector take.
 *
 * The transport is deliberately stateless (see the comment atop http.ts): no
 * server-side session map, so no test here should assume one request's session
 * id is required by, or even present on, a later request.
 */

/**
 * Spawns its own instance of the real HTTP server on a random port and
 * resolves once it is listening. Shared state (like the guide-read nudge — see
 * the last test in this file) lives at process scope now that the transport is
 * stateless, so a test that cares about "the first call in a fresh process"
 * needs a process nothing else in the suite has already touched, not the
 * shared one every other test in this file reuses.
 */
async function spawnServer() {
  const { spawn } = await import('node:child_process')
  const port = 8700 + Math.floor(Math.random() * 300) // avoid clashing with a parallel run
  const url = `http://127.0.0.1:${port}`

  const proc = spawn(
    process.execPath,
    [path.join(REPO_ROOT, 'packages/mcp-server/bin/html-library-mcp-http.mjs')],
    { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] },
  )

  // Wait for the "listening" line rather than a fixed delay, so this is not
  // flaky under load and does not sleep longer than it has to.
  await new Promise((resolve, reject) => {
    let buf = ''
    const onData = (chunk) => {
      buf += chunk.toString()
      if (buf.includes('listening on')) {
        proc.stdout.off('data', onData)
        resolve()
      }
    }
    proc.stdout.on('data', onData)
    proc.once('error', reject)
    setTimeout(() => reject(new Error(`server did not start:\n${buf}`)), 8000)
  })

  return { url, kill: () => proc.kill() }
}

let child
let baseUrl

test.before(async () => {
  const server = await spawnServer()
  child = { kill: server.kill }
  baseUrl = server.url
})

test.after(() => {
  child?.kill()
})

async function connectHttp(url = baseUrl) {
  const transport = new StreamableHTTPClientTransport(new URL(`${url}/mcp`))
  const client = new Client({ name: 'http-test', version: '0.0.0' })
  await client.connect(transport)
  return { client, close: () => client.close() }
}

async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args })
  const text = result.content?.[0]?.text ?? '{}'
  return { isError: Boolean(result.isError), data: JSON.parse(text) }
}

test('GET / answers a plain health check', async () => {
  const res = await fetch(`${baseUrl}/`)
  assert.equal(res.status, 200)
  assert.match(await res.text(), /html-library-mcp/)
})

test('a real client handshakes over HTTP with no session issued', async () => {
  const { client, close } = await connectHttp()
  try {
    // No mcp-session-id anywhere: this server never generates one, which is
    // exactly what makes it safe to run behind two Fly machines with no
    // sticky routing — there is no session for a second machine to have missed.
    assert.equal(client.transport.sessionId, undefined, 'stateless mode issues no session id')

    const instructions = client.getInstructions()
    const stats = JSON.parse(
      await readFile(path.join(REPO_ROOT, 'public', 'skill.json'), 'utf8'),
    ).stats
    assert.match(
      instructions,
      new RegExp(`${stats.needsTokenSubstitution} of the ${stats.components} components`),
    )
  } finally {
    await close()
  }
})

test('tools/list returns all 14 tools over HTTP, same as stdio', async () => {
  const { client, close } = await connectHttp()
  try {
    const { tools } = await client.listTools()
    assert.equal(tools.length, 14)
    assert.ok(tools.some((t) => t.name === 'get_design_guide'))
  } finally {
    await close()
  }
})

test('a real tool call returns real registry data over HTTP', async () => {
  const { client, close } = await connectHttp()
  try {
    const { data } = await call(client, 'get_component', { name: 'switch' })
    assert.equal(data.name, 'switch')
    assert.ok(data.files[0].content.length > 100)
  } finally {
    await close()
  }
})

test('resources/list serves the skill over HTTP', async () => {
  const { client, close } = await connectHttp()
  try {
    const { resources } = await client.listResources()
    assert.equal(resources.length, 8)
    assert.ok(resources.some((r) => r.uri === 'skill://html-library/design-system'))
  } finally {
    await close()
  }
})

test('a trailing slash or bare origin still reaches the endpoint', async () => {
  // Both are ordinary paste mistakes in a connector dialog, and a 404 there
  // reads as "this is not an MCP server" rather than "you have a stray
  // character", so each has to route like /mcp does.
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } },
  })
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  }

  for (const path of ['/mcp/', '/', '/mcp?foo=1']) {
    const res = await fetch(`${baseUrl}${path}`, { method: 'POST', headers, body })
    assert.equal(res.status, 200, `POST ${path} should initialize`)
    await res.text()
  }

  // A genuinely wrong path still 404s, and says where to go.
  const missing = await fetch(`${baseUrl}/nope`, { method: 'POST', headers, body })
  assert.equal(missing.status, 404)
  assert.match(await missing.text(), /\/mcp/)

  // The health check must survive sharing its path with the MCP endpoint.
  const health = await fetch(`${baseUrl}/`)
  assert.equal(health.status, 200)
  assert.match(await health.text(), /html-library-mcp/)
})

test('a stale or bogus mcp-session-id header is ignored, not rejected', async () => {
  // Stateless mode performs no session validation at all (that's the SDK's
  // own documented behaviour) — a client that still sends the header, e.g.
  // one caching a session id from a previous connect against the old stateful
  // build, must not be punished for it.
  const res = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'mcp-session-id': 'this-session-does-not-exist-anywhere',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } },
    }),
  })
  assert.equal(res.status, 200)
  await res.text()

  const health = await fetch(`${baseUrl}/`)
  assert.equal(health.status, 200)
})

test('GET and DELETE are refused, not hung on — stateless mode has no stream or session to offer', async () => {
  const get = await fetch(`${baseUrl}/mcp`, { headers: { Accept: 'text/event-stream' } })
  assert.equal(get.status, 405)
  assert.match(get.headers.get('allow') ?? '', /POST/)

  const del = await fetch(`${baseUrl}/mcp`, { method: 'DELETE' })
  assert.equal(del.status, 405)

  const health = await fetch(`${baseUrl}/`)
  assert.equal(health.status, 200)
})

test('OPTIONS preflight carries the CORS headers a browser client needs', async () => {
  const res = await fetch(`${baseUrl}/mcp`, { method: 'OPTIONS' })
  assert.equal(res.status, 204)
  assert.equal(res.headers.get('access-control-allow-origin'), '*')
  assert.match(res.headers.get('access-control-allow-headers') ?? '', /content-type/i)
})

test('OPTIONS preflight echoes back whatever headers the browser asked to send', async () => {
  // A hardcoded allow-list 404s any preflight for a header a future client
  // adds; echoing access-control-request-headers is what keeps a browser
  // client unblocked without hand-maintaining the list.
  const res = await fetch(`${baseUrl}/mcp`, {
    method: 'OPTIONS',
    headers: { 'Access-Control-Request-Headers': 'x-totally-made-up-header' },
  })
  assert.equal(res.status, 204)
  assert.match(res.headers.get('access-control-allow-headers') ?? '', /x-totally-made-up-header/)
})

test('the guide-read nudge fires once per process, not once per connection', async () => {
  // The old stateful build isolated the nudge per session (GuideSession was
  // created fresh inside buildServer() every time a session opened). Stateless
  // mode shares one GuideSession across every request in the process instead
  // — necessary because there is no session left to key per-connection state
  // on — so the nudge now fires for the first caller after boot and stays
  // quiet for everyone after, regardless of which HTTP connection they arrive
  // on. Needs its own fresh server: the shared suite server has already spent
  // its nudge in an earlier test (get_component nudges too, and "a real tool
  // call returns real registry data over HTTP" already called it).
  const server = await spawnServer()
  try {
    const a = await connectHttp(server.url)
    const b = await connectHttp(server.url)
    try {
      const first = await call(a.client, 'get_component_markup', { names: ['switch'] })
      assert.ok(first.data.designGuide, 'the first call in a fresh process carries the nudge')

      const second = await call(b.client, 'get_component_markup', { names: ['button'] })
      assert.equal(
        second.data.designGuide,
        undefined,
        'a second connection does not get its own nudge — the state is process-wide now',
      )
    } finally {
      await a.close()
      await b.close()
    }
  } finally {
    server.kill()
  }
})

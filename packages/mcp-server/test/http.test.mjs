import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

import { REPO_ROOT } from './helpers.mjs'

/**
 * The in-memory tests (guide.test.mjs, tools.integration.test.mjs, …) prove
 * the tools work; they say nothing about the HTTP transport itself — session
 * routing, CORS, and the concurrent-session isolation are all plumbing that
 * only exists in http.ts and is invisible to InMemoryTransport. This drives a
 * real server process over real HTTP, the same path a deployed instance and
 * Claude's connector would actually take.
 */

let child
let baseUrl

test.before(async () => {
  const { spawn } = await import('node:child_process')
  const port = 8700 + Math.floor(Math.random() * 200) // avoid clashing with a parallel run
  baseUrl = `http://127.0.0.1:${port}`

  child = spawn(
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
        child.stdout.off('data', onData)
        resolve()
      }
    }
    child.stdout.on('data', onData)
    child.once('error', reject)
    setTimeout(() => reject(new Error(`server did not start:\n${buf}`)), 8000)
  })
})

test.after(() => {
  child?.kill()
})

async function connectHttp() {
  const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`))
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

test('a real client handshakes over HTTP and gets a session', async () => {
  const { client, close } = await connectHttp()
  try {
    // StreamableHTTPClientTransport exposes the negotiated session id, so this
    // confirms the server actually issued one rather than silently going
    // stateless.
    assert.ok(client.transport.sessionId, 'server assigned a session id')

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

test('an unknown session id is rejected, not crashed on', async () => {
  const res = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'mcp-session-id': 'this-session-does-not-exist',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  })
  assert.equal(res.status, 400)

  // The server process, and every other session on it, must still be alive.
  const health = await fetch(`${baseUrl}/`)
  assert.equal(health.status, 200)
})

test('OPTIONS preflight carries the CORS headers a browser client needs', async () => {
  const res = await fetch(`${baseUrl}/mcp`, { method: 'OPTIONS' })
  assert.equal(res.status, 204)
  assert.equal(res.headers.get('access-control-allow-origin'), '*')
  assert.match(res.headers.get('access-control-allow-headers') ?? '', /mcp-session-id/)
  // Without this exposed, a browser client can receive the header but never
  // read it via the Fetch API, and every request after the first would 400.
  assert.match(res.headers.get('access-control-expose-headers') ?? '', /mcp-session-id/)
})

test('two concurrent sessions do not leak the guide-read nudge into each other', async () => {
  // This is the exact bug class the per-session GuideSession threading in
  // guide.ts/retrieval.ts already fixed for two in-process servers — this
  // proves it also holds when the sessions are two real HTTP connections to
  // one running process, which is the situation a deployed server is actually
  // in.
  const a = await connectHttp()
  const b = await connectHttp()
  try {
    assert.notEqual(a.client.transport.sessionId, b.client.transport.sessionId)

    const first = await call(a.client, 'get_component_markup', { names: ['switch'] })
    assert.ok(first.data.designGuide, 'first call on a fresh session carries the nudge')

    const untouched = await call(b.client, 'get_component_markup', { names: ['button'] })
    assert.ok(untouched.data.designGuide, 'a different session still gets its own first nudge')

    const second = await call(a.client, 'get_component_markup', { names: ['card'] })
    assert.equal(second.data.designGuide, undefined, 'the same session does not repeat it')
  } finally {
    await a.close()
    await b.close()
  }
})

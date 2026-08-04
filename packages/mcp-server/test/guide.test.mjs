import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

import { REPO_ROOT, call, connect } from './helpers.mjs'

test('instructions are served, and carry the live count rather than a typed one', async () => {
  const { client, close } = await connect()
  try {
    const instructions = client.getInstructions()
    assert.ok(instructions, 'server sends instructions')

    // The figure must match the registry, not a number someone remembered.
    const stats = JSON.parse(
      await readFile(path.join(REPO_ROOT, 'public', 'skill.json'), 'utf8'),
    ).stats
    assert.match(
      instructions,
      new RegExp(`${stats.needsTokenSubstitution} of the ${stats.components} components`),
      'instructions quote the generated portability count',
    )

    // It has to actually point at the guide, or the tiering achieves nothing.
    assert.match(instructions, /get_design_guide/)
    // …and carry enough design language to be useful before any tool call.
    for (const needle of ['alpha-on-white', 'rounded-lg', '390×844', 'Fluent', 'Astryx']) {
      assert.ok(instructions.includes(needle), `instructions mention ${needle}`)
    }
    // Compact enough to sit in a system prompt every session.
    assert.ok(instructions.length < 6000, `instructions are ${instructions.length} chars`)
  } finally {
    await close()
  }
})

test('the skill is readable as MCP resources', async () => {
  const { client, close } = await connect()
  try {
    const { resources } = await client.listResources()
    const uris = resources.map((r) => r.uri)
    assert.ok(resources.length >= 8, `expected the skill docs, got ${resources.length}`)
    assert.ok(uris.includes('skill://html-library/design-system'))
    assert.ok(uris.includes('skill://html-library/conventions'))

    const read = await client.readResource({ uri: 'skill://html-library/design-system' })
    const text = read.contents[0].text
    assert.match(text, /# Design system/)
    assert.match(text, /alpha-on-white/)
    assert.equal(read.contents[0].mimeType, 'text/markdown')
  } finally {
    await close()
  }
})

test('get_design_guide returns real content and defaults to the design system', async () => {
  const { client, close } = await connect()
  try {
    const result = await client.callTool({ name: 'get_design_guide', arguments: {} })
    const text = result.content[0].text
    assert.match(text, /# Design system/)
    // The measured tables must survive into what the agent actually receives.
    assert.match(text, /text-\[13px\]/)
    assert.match(text, /rounded-full/)

    const conventions = await client.callTool({
      name: 'get_design_guide',
      arguments: { topic: 'conventions' },
    })
    assert.match(conventions.content[0].text, /class/)
  } finally {
    await close()
  }
})

test('served docs carry no vendoring banner', async () => {
  const { client, close } = await connect()
  try {
    // The banner tells a reader to re-run a build script they do not have if
    // they installed over npx, so it must not reach a client by any route.
    const viaTool = (await client.callTool({ name: 'get_design_guide', arguments: {} }))
      .content[0].text
    const viaResource = (
      await client.readResource({ uri: 'skill://html-library/design-system' })
    ).contents[0].text

    for (const [route, text] of [['tool', viaTool], ['resource', viaResource]]) {
      assert.ok(!text.includes('GENERATED — do not edit'), `${route} leaks the banner`)
      assert.ok(!text.includes('npm run build:mcp'), `${route} leaks build instructions`)
      assert.match(text.slice(0, 40), /^# Design system/, `${route} starts at the heading`)
    }

    assert.ok(!client.getInstructions().includes('GENERATED'), 'instructions leak the banner')
  } finally {
    await close()
  }
})

test('get_category_guide answers how each category looks and behaves', async () => {
  const { client, close } = await connect()
  try {
    const apps = await call(client, 'get_category_guide', { category: 'apps' })
    assert.match(apps.data.canvas, /390×844/)
    const appRules = apps.data.rules.join(' ')
    assert.match(appRules, /rounded-2xl/)
    assert.match(appRules, /borderless/i)

    const agent = await call(client, 'get_category_guide', { category: 'agent' })
    assert.match(agent.data.rules.join(' '), /rounded-br-md/)

    const ui = await call(client, 'get_category_guide', { category: 'ui' })
    assert.match(ui.data.rules.join(' '), /rounded-lg/)

    // Every category repeats the non-negotiables.
    assert.match(apps.data.sharedContract.join(' '), /className/)

    const bad = await call(client, 'get_category_guide', { category: 'apps' })
    assert.ok(bad.data.seeAlso.includes('get_design_guide'))
  } finally {
    await close()
  }
})

test('the guide nudge fires once, then stops', async () => {
  // Fresh server per connection, so this exercises a session that never read
  // the guide followed by one that did.
  const first = await connect()
  try {
    const a = await call(first.client, 'get_component_markup', { names: ['switch'] })
    assert.ok(a.data.designGuide, 'first markup call without the guide carries the pointer')
    assert.match(a.data.designGuide, /get_design_guide/)

    const b = await call(first.client, 'get_component_markup', { names: ['button'] })
    assert.equal(b.data.designGuide, undefined, 'it does not repeat')
  } finally {
    await first.close()
  }

  const second = await connect()
  try {
    await second.client.callTool({ name: 'get_design_guide', arguments: {} })
    const after = await call(second.client, 'get_component_markup', { names: ['switch'] })
    assert.equal(after.data.designGuide, undefined, 'reading the guide suppresses the nudge')
  } finally {
    await second.close()
  }
})

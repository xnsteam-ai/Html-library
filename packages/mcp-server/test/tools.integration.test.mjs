import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

import { TOOL_NAMES } from '../dist/server.js'
import { referencedComponentNames } from '../dist/tools/composition.js'
import { readRegistryItems } from '../dist/vendor/registry-data.mjs'
import { REGISTRY_DIR, REPO_ROOT, call, connect } from './helpers.mjs'

test('every declared tool is registered and discoverable', async () => {
  const { client, close } = await connect()
  try {
    const { tools } = await client.listTools()
    const names = tools.map((t) => t.name).sort()
    assert.deepEqual(names, [...TOOL_NAMES].sort())
    for (const tool of tools) {
      assert.ok(tool.description && tool.description.length > 20, `${tool.name} has a description`)
      assert.ok(tool.inputSchema, `${tool.name} has an input schema`)
    }
  } finally {
    await close()
  }
})

test('recipes.json only references components that exist', async () => {
  const { items } = await readRegistryItems(REGISTRY_DIR)
  const real = new Set(items.map((item) => item.meta.name))
  const missing = referencedComponentNames().filter((name) => !real.has(name))
  assert.deepEqual(missing, [], 'recipe data references components that no longer exist')
})

test('get_component matches the published registry JSON', async () => {
  const { client, close } = await connect()
  try {
    for (const name of ['switch', 'agent-chat', 'image-sunlit-portrait']) {
      const published = JSON.parse(
        await readFile(path.join(REPO_ROOT, 'public', 'r', `${name}.json`), 'utf8'),
      )
      const { data } = await call(client, 'get_component', { name })
      assert.equal(data.name, published.name)
      assert.equal(data.category, published.category)
      assert.equal(data.files[0].content, published.files[0].content, `${name} markup`)
      assert.equal(data.surface, published.surface, `${name} surface`)
      assert.equal(typeof data.portability.portable, 'boolean')
    }
  } finally {
    await close()
  }
})

test('the three category shapes come back correctly', async () => {
  const { client, close } = await connect()
  try {
    const plain = await call(client, 'get_component', { name: 'switch' })
    assert.equal(plain.data.surface, undefined, 'ui elements omit surface')
    assert.equal(plain.data.prompt, undefined)

    // agent-chat is an element and carries no surface; chat-landing is the
    // agent item that is a whole page.
    const surfaced = await call(client, 'get_component', { name: 'chat-landing' })
    assert.equal(surfaced.data.surface, 'site')

    const image = await call(client, 'get_component', { name: 'image-sunlit-portrait' })
    assert.ok(image.data.prompt, 'images carry a prompt')
  } finally {
    await close()
  }
})

test('unknown names fail gracefully with suggestions, never a crash', async () => {
  const { client, close } = await connect()
  try {
    const { isError, data } = await call(client, 'get_component', { name: 'swtich' })
    assert.equal(isError, true)
    assert.ok(data.error.includes('swtich'))
    assert.ok(Array.isArray(data.didYouMean))
    assert.ok(data.didYouMean.includes('switch'), 'suggests the near miss')

    // The session must survive the error.
    const after = await call(client, 'get_categories')
    assert.equal(after.data.total, 191)
  } finally {
    await close()
  }
})

test('list_components filters and paginates', async () => {
  const { client, close } = await connect()
  try {
    const ui = await call(client, 'list_components', { category: 'ui', limit: 5 })
    assert.equal(ui.data.returned, 5)
    assert.ok(ui.data.total >= 20)
    assert.ok(ui.data.items.every((i) => i.category === 'ui'))

    const page2 = await call(client, 'list_components', { category: 'ui', limit: 5, offset: 5 })
    assert.notEqual(ui.data.items[0].name, page2.data.items[0].name, 'offset actually moves')

    const apps = await call(client, 'list_components', { surface: 'app' })
    assert.ok(apps.data.items.every((i) => i.surface === 'app'))
  } finally {
    await close()
  }
})

test('search_components finds by keyword and tag', async () => {
  const { client, close } = await connect()
  try {
    const chat = await call(client, 'search_components', { query: 'chat' })
    assert.ok(chat.data.matches.length > 0)
    assert.ok(chat.data.matches.some((m) => m.name === 'agent-chat'))

    const nothing = await call(client, 'search_components', { query: 'zzzznotathing' })
    assert.deepEqual(nothing.data.matches, [])
    assert.ok(nothing.data.hint, 'empty result explains what to do next')
  } finally {
    await close()
  }
})

test('get_component_markup batches and warns about impure markup', async () => {
  const { client, close } = await connect()
  try {
    const { data } = await call(client, 'get_component_markup', {
      names: ['switch', 'agent-chat', 'does-not-exist'],
    })
    assert.equal(data.results.length, 2)
    assert.deepEqual(data.notFound, ['does-not-exist'])
    assert.ok(data.results.every((r) => r.html.length > 0))
    assert.ok(data.reminder.includes('CSS-only'))
  } finally {
    await close()
  }
})

test('recommend_components maps plain language to real components', async () => {
  const { client, close } = await connect()
  try {
    const pricing = await call(client, 'recommend_components', { need: 'a pricing page' })
    const named = pricing.data.matches.flatMap((m) => m.components.map((c) => c.name))
    assert.ok(named.includes('site-pricing'), `expected site-pricing, got ${named.join(', ')}`)

    const chat = await call(client, 'recommend_components', { need: 'chat UI' })
    const chatNames = chat.data.matches.flatMap((m) => m.components.map((c) => c.name))
    assert.ok(chatNames.includes('agent-chat'))
  } finally {
    await close()
  }
})

test('get_recipe returns a composition ladder with live descriptions', async () => {
  const { client, close } = await connect()
  try {
    const { data } = await call(client, 'get_recipe', { recipe: 'marketing-landing-page' })
    assert.equal(data.recipe, 'marketing-landing-page')
    assert.ok(data.composed.length > 5)
    assert.ok(data.composed.every((step) => !step.missing), 'no dangling component references')
    assert.ok(data.composed[0].title, 'joined in a live title')
    assert.ok(data.warning.includes('do not also paste'))
  } finally {
    await close()
  }
})

test('get_interactivity_pattern steers away from JavaScript', async () => {
  const { client, close } = await connect()
  try {
    const { data } = await call(client, 'get_interactivity_pattern', { need: 'toggle' })
    assert.match(data.mechanism, /peer-checked/)
    assert.ok(data.exampleComponents.some((c) => c.name === 'switch'))
    assert.match(data.rule, /never replace it with a JavaScript handler/)
  } finally {
    await close()
  }
})

test('get_image_prompt returns the structured brief, and refuses non-images', async () => {
  const { client, close } = await connect()
  try {
    const { data } = await call(client, 'get_image_prompt', { name: 'image-sunlit-portrait' })
    assert.ok(data.prompt.framing, 'framing block present')
    assert.ok(data.blocksPresent.includes('subject'))
    assert.ok(Array.isArray(data.blocksOmitted))

    const wrong = await call(client, 'get_image_prompt', { name: 'switch' })
    assert.equal(wrong.isError, true)
    assert.ok(wrong.data.error.includes('images'))
  } finally {
    await close()
  }
})

test('get_component_portability reports both verdicts with substitutions', async () => {
  const { items } = await readRegistryItems(REGISTRY_DIR)
  const clean = items.find((i) => i.portable)
  const impure = items.find((i) => !i.portable)

  const { client, close } = await connect()
  try {
    const good = await call(client, 'get_component_portability', { name: clean.meta.name })
    assert.equal(good.data.portable, true)
    assert.deepEqual(good.data.appTokens, [])

    const bad = await call(client, 'get_component_portability', { name: impure.meta.name })
    assert.equal(bad.data.portable, false)
    assert.ok(bad.data.appTokens.length > 0)
    assert.ok(bad.data.substitutions.length > 0, 'offers the replacement inline')
  } finally {
    await close()
  }
})

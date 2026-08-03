import assert from 'node:assert/strict'
import { test } from 'node:test'

import { SUBSTITUTIONS, readRegistryItems, scanPortability } from '../dist/vendor/registry-data.mjs'
import { REGISTRY_DIR, call, connect } from './helpers.mjs'

test('flags an app-only token and leaves literal Tailwind alone', () => {
  assert.deepEqual(scanPortability('<div class="text-muted-foreground">'), {
    portable: false,
    appTokens: ['muted-foreground'],
  })
  assert.deepEqual(scanPortability('<div class="text-neutral-500 dark:text-neutral-400">'), {
    portable: true,
    appTokens: [],
  })
})

test('every token found in the registry has a substitution', async () => {
  const { items } = await readRegistryItems(REGISTRY_DIR)
  const used = new Set(items.flatMap((item) => item.appTokens))
  assert.ok(used.size > 0, 'the registry really does contain app-only tokens')

  for (const token of used) {
    const covered = Object.keys(SUBSTITUTIONS).some((utility) => utility.endsWith(`-${token}`))
    assert.ok(covered, `no substitution covers "${token}"`)
  }
})

test('check_portability fixes real markup so it round-trips as portable', async () => {
  const { items } = await readRegistryItems(REGISTRY_DIR)
  const impure = items.filter((item) => !item.portable)
  assert.ok(impure.length > 0)

  const { client, close } = await connect()
  try {
    // Cover several real components rather than a hand-written string, so this
    // exercises markup the registry actually ships.
    for (const item of impure.slice(0, 5)) {
      const { data } = await call(client, 'check_portability', { html: item.html })
      assert.equal(data.portable, false, `${item.meta.name} reported impure`)
      assert.equal(data.fixedIsPortable, true, `${item.meta.name} fixed markup is portable`)
      assert.deepEqual(
        scanPortability(data.fixedHtml),
        { portable: true, appTokens: [] },
        `${item.meta.name} fixed markup rescans clean`,
      )
      assert.ok(data.substitutions.length > 0)
    }
  } finally {
    await close()
  }
})

test('substitution does not corrupt a longer token that shares a prefix', async () => {
  const { client, close } = await connect()
  try {
    const { data } = await call(client, 'check_portability', {
      html: '<div class="bg-primary text-primary-foreground">',
    })
    // `bg-primary` must not eat the `primary` inside `text-primary-foreground`.
    assert.match(data.fixedHtml, /bg-neutral-900 dark:bg-neutral-100/)
    assert.match(data.fixedHtml, /text-white dark:text-neutral-900/)
    assert.equal(data.fixedIsPortable, true)
  } finally {
    await close()
  }
})

test('lint_html enforces the registry conventions', async () => {
  const { client, close } = await connect()
  try {
    const bad = await call(client, 'lint_html', {
      html: '<div class="p-4"><script>alert(1)</script><span className="x"></span></div>',
      id: 'my-widget',
    })
    assert.equal(bad.data.valid, false)
    assert.ok(bad.data.errors.some((e) => e.includes('<script>')))
    assert.ok(bad.data.errors.some((e) => e.includes('className')))

    const dupes = await call(client, 'lint_html', {
      html: '<input id="a"><input id="a">',
    })
    assert.equal(dupes.data.valid, false)
    assert.ok(dupes.data.errors.some((e) => e.includes('duplicate id')))

    const orphanLabel = await call(client, 'lint_html', {
      html: '<label for="nope">x</label>',
    })
    assert.equal(orphanLabel.data.valid, false)

    const clean = await call(client, 'lint_html', {
      html: '<div class="rounded-lg bg-white p-4 dark:bg-neutral-950">ok</div>',
    })
    assert.equal(clean.data.valid, true)
    assert.deepEqual(clean.data.errors, [])
  } finally {
    await close()
  }
})

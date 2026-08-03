import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'

import { readRegistryItems } from '../dist/vendor/registry-data.mjs'
import { REGISTRY_DIR, REPO_ROOT } from './helpers.mjs'

const skillStats = JSON.parse(
  await readFile(path.join(REPO_ROOT, 'public', 'skill.json'), 'utf8'),
).stats

test('reads every component the published skill manifest counts', async () => {
  const { items, errors } = await readRegistryItems(REGISTRY_DIR)
  assert.equal(errors.length, 0)
  assert.equal(items.length, skillStats.components)

  for (const [category, expected] of Object.entries(skillStats.byCategory)) {
    const actual = items.filter((item) => item.meta.category === category).length
    assert.equal(actual, expected, `${category} count`)
  }
})

test('portability totals agree with the published manifest', async () => {
  const { items } = await readRegistryItems(REGISTRY_DIR)
  const portable = items.filter((item) => item.portable).length
  const impure = items.length - portable

  assert.equal(portable, skillStats.portable)
  assert.equal(impure, skillStats.needsTokenSubstitution)
  // Guards the arithmetic itself, so a drifting snapshot cannot hide a bug.
  assert.equal(portable + impure, items.length)
})

test('markup matches the generated registry JSON byte for byte', async () => {
  const { items } = await readRegistryItems(REGISTRY_DIR)
  for (const name of ['switch', 'agent-chat', 'image-sunlit-portrait']) {
    const item = items.find((entry) => entry.meta.name === name)
    assert.ok(item, `${name} exists in registry/`)
    const published = JSON.parse(
      await readFile(path.join(REPO_ROOT, 'public', 'r', `${name}.json`), 'utf8'),
    )
    assert.equal(item.html, published.files[0].content, `${name} markup`)
  }
})

test('validation passes on the real registry', async () => {
  const { errors } = await readRegistryItems(REGISTRY_DIR, { validate: true })
  assert.deepEqual(errors, [])
})

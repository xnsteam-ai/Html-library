import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { describeSource, resolveSource } from '../dist/source.js'
import { REGISTRY_DIR, REPO_ROOT, call, connect } from './helpers.mjs'

const VARS = ['HTML_LIBRARY_SOURCE', 'HTML_LIBRARY_REGISTRY_DIR', 'HTML_LIBRARY_REGISTRY_URL']

afterEach(() => {
  for (const name of VARS) delete process.env[name]
})

test('finds the checkout it is launched inside', () => {
  const source = resolveSource(REPO_ROOT)
  assert.equal(source.mode, 'local')
  assert.equal(source.registryDir, REGISTRY_DIR)
})

test('falls back to the hosted registry outside a checkout', () => {
  const source = resolveSource('/')
  assert.equal(source.mode, 'remote')
  assert.match(source.baseUrl, /^https:\/\//)
  assert.notEqual(source.baseUrl, source.rawBaseUrl, 'keeps the raw fallback host')
})

test('HTML_LIBRARY_SOURCE forces the mode', () => {
  process.env.HTML_LIBRARY_SOURCE = 'remote'
  assert.equal(resolveSource(REPO_ROOT).mode, 'remote', 'remote wins inside a checkout')

  process.env.HTML_LIBRARY_SOURCE = 'local'
  assert.equal(resolveSource(REPO_ROOT).mode, 'local')
})

test('local mode with no registry fails loudly rather than silently going remote', () => {
  process.env.HTML_LIBRARY_SOURCE = 'local'
  assert.throws(() => resolveSource('/'), /no registry was found/)
})

test('every URL form points at the same registry', () => {
  const forms = [
    'https://example.com/r',
    'https://example.com/r/',
    'https://example.com/r/index.json',
    '  https://example.com/r/index.json  ',
  ]
  for (const form of forms) {
    process.env.HTML_LIBRARY_REGISTRY_URL = form
    const source = resolveSource('/')
    assert.equal(source.mode, 'remote')
    assert.equal(source.baseUrl, 'https://example.com/r', `form: ${JSON.stringify(form)}`)
  }
})

test('a named registry beats a checkout on disk', () => {
  // Otherwise pointing at a fork from inside this repo would silently do nothing.
  process.env.HTML_LIBRARY_REGISTRY_URL = 'https://example.com/r'
  const source = resolveSource(REPO_ROOT)
  assert.equal(source.mode, 'remote')
  assert.equal(source.baseUrl, 'https://example.com/r')
  assert.match(describeSource(source), /custom registry/)
})

test('an explicit local directory still beats a named registry', () => {
  process.env.HTML_LIBRARY_REGISTRY_URL = 'https://example.com/r'
  process.env.HTML_LIBRARY_REGISTRY_DIR = REGISTRY_DIR
  const source = resolveSource('/')
  assert.equal(source.mode, 'local')
  assert.equal(source.registryDir, REGISTRY_DIR)
})

test('an unreachable registry reports the URL it tried, without crashing', async () => {
  const { client, close } = await connect({
    mode: 'remote',
    baseUrl: 'https://registry.invalid.example/r',
    rawBaseUrl: 'https://registry.invalid.example/r',
  })
  try {
    const { isError, data } = await call(client, 'get_categories')
    assert.equal(isError, true)
    assert.match(data.error, /registry\.invalid\.example/)
    // Identical hosts must be collapsed, not retried as if they were two.
    assert.equal((data.error.match(/registry\.invalid\.example/g) ?? []).length, 1)
  } finally {
    await close()
  }
})

// Functional check for the bundled PaperLocus skill.
//
// It exercises the same two things the bundle patch relies on:
//   1. the Skill root resolves from the DSH profile's module resolution root;
//   2. the isolated filesystem provider discovers `paperlocus` there and loads it.
//
// The provider module belongs to the DSH installation rather than to this
// package, so point the test at it explicitly:
//
//   DSH_SKILL_FILESYSTEM_PATH=/path/to/@deepseek-ai/dsh-skill-filesystem/lib/index.js \
//   DSH_PROFILE_BASE_URL=$DSH_HOME/profiles/web/package.json \
//   node --test test/skill-discovery.test.mjs
//
// Without DSH_SKILL_FILESYSTEM_PATH the provider assertions are skipped and only
// the package-local resolution check runs.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

import { PACKAGE_NAME, resolvePaperlocusSkillRoot } from '../lib/index.js'

const providerLib = process.env.DSH_SKILL_FILESYSTEM_PATH

function profileBaseUrl() {
  if (process.env.DSH_PROFILE_BASE_URL) return process.env.DSH_PROFILE_BASE_URL
  const home = process.env.DSH_HOME ?? join(process.env.HOME ?? '', '.dsh')
  return join(home, 'profiles', process.env.DSH_PROFILE ?? 'web', 'package.json')
}

test('resolvePaperlocusSkillRoot rejects a missing profile base url', () => {
  assert.throws(() => resolvePaperlocusSkillRoot(''), /missing DSH profile baseUrl/)
})

test('the skill root resolves from the DSH profile and holds a valid skill', (t) => {
  const baseUrl = profileBaseUrl()
  if (!existsSync(baseUrl)) {
    t.skip(`no DSH profile manifest at ${baseUrl}`)
    return
  }
  const manifest = createRequire(baseUrl).resolve(`${PACKAGE_NAME}/package.json`)
  const root = resolvePaperlocusSkillRoot(baseUrl)
  assert.equal(root, join(dirname(manifest), 'skills'))

  const skillFile = join(root, 'paperlocus', 'SKILL.md')
  assert.ok(existsSync(skillFile), `${skillFile} must exist`)
  assert.ok(existsSync(join(root, 'paperlocus', 'references', 'paper_type_examples.md')))
  const body = readFileSync(skillFile, 'utf8')
  assert.match(body, /^---\nname: paperlocus\n/)
  assert.match(body, /\ndescription: /)
  assert.match(body, /\nwhenToUse: /)
})

test('the isolated filesystem provider discovers and loads paperlocus', { skip: providerLib ? false : 'set DSH_SKILL_FILESYSTEM_PATH to the installed @deepseek-ai/dsh-skill-filesystem lib/index.js' }, async () => {
  const baseUrl = profileBaseUrl()
  const { FileSystemSkillProvider } = await import(pathToFileURL(providerLib).href)

  const ctx = {
    logger: { warn() {}, info() {}, debug() {}, error() {} },
    on() {},
    get() { return undefined },
    effect() {},
  }
  const controller = new AbortController()
  const provider = new FileSystemSkillProvider(ctx, { invalidate() {}, signal: controller.signal }, {
    providerName: 'paperlocus-plugin',
    includeDefaultRoots: false,
    bundledSkillDir: resolvePaperlocusSkillRoot(baseUrl),
  })

  try {
    const listed = await provider.list({ cwd: process.cwd() })
    const candidates = Array.isArray(listed) ? listed : listed.candidates
    const candidate = candidates.find((entry) => entry.name === 'paperlocus')
    assert.ok(candidate, 'paperlocus must be discovered by the bundled root')
    assert.equal(candidate.rank, 600)
    assert.equal(candidate.source, 'bundled')

    const loaded = await provider.get(candidate, { signal: controller.signal })
    assert.equal(loaded.name, 'paperlocus')
    assert.equal(typeof loaded.whenToUse, 'string')
    assert.deepEqual(loaded.invocation, { modelInvocable: true, userInvocable: true })
    assert.match(loaded.content, /## Output Template/)
  } finally {
    await provider.dispose?.()
  }
})

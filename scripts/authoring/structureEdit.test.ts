// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { newProject, formatAndSave } from './tsutil.ts'
import { ensureLevel, ensureModule } from './structureEdit.ts'

const tmpDirs: string[] = []

function seedStructure(body: string): { dir: string; file: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-struct-'))
  tmpDirs.push(dir)
  const file = path.join(dir, 'structure.ts')
  fs.writeFileSync(file, body)
  return { dir, file }
}

const BASE = `export const structure = [
  {
    id: 'beginner',
    title: 'Beginner',
    order: 1,
    modules: [
      { code: 'B1', slug: 'basics', title: 'The Basics', order: 1 },
    ],
  },
]
`

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

test('ensureLevel appends a new level with the next order and empty modules', () => {
  const { file } = seedStructure(BASE)
  const project = newProject()
  const sf = project.addSourceFileAtPath(file)
  ensureLevel(sf, { id: 'intermediate', title: 'Intermediate' })
  formatAndSave(sf)
  const out = fs.readFileSync(file, 'utf8')
  expect(out).toContain("id: 'intermediate'")
  expect(out).toContain('order: 2')
  expect(out).toContain('modules: []')
})

test('ensureLevel is idempotent (returns existing, adds nothing)', () => {
  const { file } = seedStructure(BASE)
  const project = newProject()
  const sf = project.addSourceFileAtPath(file)
  ensureLevel(sf, { id: 'beginner', title: 'Beginner' })
  formatAndSave(sf)
  const out = fs.readFileSync(file, 'utf8')
  expect(out.match(/id: 'beginner'/g)?.length).toBe(1)
})

test('ensureModule appends a module with the next order within its level', () => {
  const { file } = seedStructure(BASE)
  const project = newProject()
  const sf = project.addSourceFileAtPath(file)
  const level = ensureLevel(sf, { id: 'beginner', title: 'Beginner' })
  ensureModule(level, { code: 'B2', slug: 'sessions', title: 'Sessions and Context' })
  formatAndSave(sf)
  const out = fs.readFileSync(file, 'utf8')
  expect(out).toContain("code: 'B2'")
  expect(out).toContain("slug: 'sessions'")
  // B1 has order 1, so B2 must be order 2
  expect(out).toMatch(/code: 'B2'[^}]*order: 2/)
})

test('ensureModule into a newly created (empty) level gets order 1', () => {
  const { file } = seedStructure(BASE)
  const project = newProject()
  const sf = project.addSourceFileAtPath(file)
  const level = ensureLevel(sf, { id: 'advanced', title: 'Advanced' })
  ensureModule(level, { code: 'A1', slug: 'power', title: 'Power User' })
  formatAndSave(sf)
  const out = fs.readFileSync(file, 'utf8')
  expect(out).toMatch(/code: 'A1'[^}]*order: 1/)
})

test('ensureModule is idempotent', () => {
  const { file } = seedStructure(BASE)
  const project = newProject()
  const sf = project.addSourceFileAtPath(file)
  const level = ensureLevel(sf, { id: 'beginner', title: 'Beginner' })
  ensureModule(level, { code: 'B1', slug: 'basics', title: 'The Basics' })
  formatAndSave(sf)
  const out = fs.readFileSync(file, 'utf8')
  expect(out.match(/code: 'B1'/g)?.length).toBe(1)
})

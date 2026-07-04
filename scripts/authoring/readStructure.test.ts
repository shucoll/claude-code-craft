// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Project } from 'ts-morph'
import { readStructure } from './readStructure.ts'

function seedStructure(dir: string): void {
  fs.writeFileSync(
    path.join(dir, 'structure.ts'),
    `export const structure = [
  { id: 'beginner', title: 'Beginner', order: 1, modules: [
    { code: 'B1', slug: 'basics', title: 'The Basics', order: 1 },
  ] },
  { id: 'intermediate', title: 'Intermediate', order: 2, modules: [
    { code: 'I1', slug: 'workflows', title: 'Workflows', order: 1 },
  ] },
]
`,
  )
}

test('readStructure round-trips a seeded structure.ts into LevelDef[]', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-'))
  try {
    seedStructure(dir)
    const project = new Project({ skipAddingFilesFromTsConfig: true })
    const levels = readStructure(project, dir)
    expect(levels).toEqual([
      { id: 'beginner', title: 'Beginner', order: 1, modules: [{ code: 'B1', slug: 'basics', title: 'The Basics', order: 1 }] },
      { id: 'intermediate', title: 'Intermediate', order: 2, modules: [{ code: 'I1', slug: 'workflows', title: 'Workflows', order: 1 }] },
    ])
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('readStructure throws on a malformed structure.ts (missing order) rather than silently coercing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-'))
  try {
    fs.writeFileSync(
      path.join(dir, 'structure.ts'),
      `export const structure = [
  { id: 'beginner', title: 'Beginner', modules: [] },
]
`,
    )
    const project = new Project({ skipAddingFilesFromTsConfig: true })
    expect(() => readStructure(project, dir)).toThrow(/order/)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { readAllLessonMeta } from './frontmatter.ts'

function tmpLessons(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-fm-'))
  const dir = path.join(root, 'beginner')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'what-is-cc.mdx'),
    `---\nid: "B1.1"\nslug: "what-is-cc"\ntitle: "What is Claude Code?"\ntype: "core"\norder: 1\nvolatility: "stable"\n---\n\n# What is Claude Code?\n`,
  )
  return root
}

test('readAllLessonMeta parses frontmatter and derives levelDir', () => {
  const root = tmpLessons()
  const metas = readAllLessonMeta(root)
  expect(metas).toHaveLength(1)
  expect(metas[0]).toMatchObject({
    dottedId: 'B1.1',
    slug: 'what-is-cc',
    title: 'What is Claude Code?',
    type: 'core',
    order: 1,
    volatility: 'stable',
    levelDir: 'beginner',
  })
})

test('readAllLessonMeta does not throw when a lesson is missing id frontmatter', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-fm-'))
  const dir = path.join(root, 'beginner')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'no-id.mdx'),
    `---\ntitle: "Missing Id Lesson"\n---\n\n# Missing Id Lesson\n`,
  )
  let metas: ReturnType<typeof readAllLessonMeta> = []
  expect(() => {
    metas = readAllLessonMeta(root)
  }).not.toThrow()
  expect(metas).toHaveLength(1)
  expect(metas[0].dottedId).toBeUndefined()
})

test('readAllLessonMeta returns [] when the lessons directory does not exist', () => {
  // A fresh repo (or one whose last lesson was just removed) has no lessons dir;
  // the reader must bootstrap from empty rather than throwing ENOENT.
  expect(readAllLessonMeta(path.join(os.tmpdir(), 'ccc-does-not-exist-xyz'))).toEqual([])
})

test('readAllLessonMeta sorts multiple lessons by dottedId', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-fm-'))
  const dir = path.join(root, 'beginner')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'second.mdx'),
    `---\nid: "B1.2"\nslug: "second"\ntitle: "Second Lesson"\n---\n\n# Second Lesson\n`,
  )
  fs.writeFileSync(
    path.join(dir, 'first.mdx'),
    `---\nid: "B1.1"\nslug: "first"\ntitle: "First Lesson"\n---\n\n# First Lesson\n`,
  )
  const metas = readAllLessonMeta(root)
  expect(metas.map((m) => m.dottedId)).toEqual(['B1.1', 'B1.2'])
})

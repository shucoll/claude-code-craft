// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { nextLessonId } from './nextId.ts'

const tmpDirs: string[] = []

function seed(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-nextid-'))
  tmpDirs.push(dir)
  fs.mkdirSync(path.join(dir, 'lessons/beginner'), { recursive: true })
  return dir
}

function writeLesson(dir: string, level: string, slug: string, id: string, order: number): void {
  const body = `---\nid: "${id}"\nslug: "${slug}"\ntitle: "T"\ntype: "core"\norder: ${order}\n---\n\n# T\n`
  fs.writeFileSync(path.join(dir, 'lessons', level, `${slug}.mdx`), body)
}

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

test('returns .1 for an empty module', () => {
  const dir = seed()
  expect(nextLessonId(dir, 'B1')).toEqual({ dottedId: 'B1.1', order: 1 })
})

test('returns max order + 1 for a populated module', () => {
  const dir = seed()
  writeLesson(dir, 'beginner', 'a', 'B1.1', 1)
  writeLesson(dir, 'beginner', 'b', 'B1.2', 2)
  expect(nextLessonId(dir, 'B1')).toEqual({ dottedId: 'B1.3', order: 3 })
})

test('ignores lessons from other modules', () => {
  const dir = seed()
  fs.mkdirSync(path.join(dir, 'lessons/intermediate'), { recursive: true })
  writeLesson(dir, 'beginner', 'a', 'B1.1', 1)
  writeLesson(dir, 'intermediate', 'x', 'I1.5', 5)
  expect(nextLessonId(dir, 'B1')).toEqual({ dottedId: 'B1.2', order: 2 })
})

// @vitest-environment node
import { emitCurriculum } from './emit.ts'
import type { LessonMeta } from './frontmatter.ts'
import type { LevelDef } from '../../../src/content/structure.ts'

const structure: LevelDef[] = [
  { id: 'beginner', title: 'Beginner', order: 1, modules: [{ code: 'B1', slug: 'basics', title: 'The Basics', order: 1 }] },
]
const metas: LessonMeta[] = [
  { dottedId: 'B1.2', slug: 'first-edit', title: 'Your First Edit', type: 'core', order: 2, volatility: 'stable', levelDir: 'beginner', file: 'x' },
  { dottedId: 'B1.1', slug: 'what-is-cc', title: 'What is Claude Code?', type: 'core', order: 1, volatility: 'stable', levelDir: 'beginner', file: 'x' },
]

test('emits a literal import() per lesson (code-splitting invariant)', () => {
  const src = emitCurriculum(structure, metas)
  expect(src).toContain("content: () => import('./lessons/beginner/what-is-cc.mdx')")
  expect(src).toContain("content: () => import('./lessons/beginner/first-edit.mdx')")
})

test('orders lessons within a module by order', () => {
  const src = emitCurriculum(structure, metas)
  expect(src.indexOf('what-is-cc')).toBeLessThan(src.indexOf('first-edit'))
})

test('emits the lessonPathById map keyed by dotted id', () => {
  const src = emitCurriculum(structure, metas)
  expect(src).toContain("'B1.1': '/learn/beginner/basics/what-is-cc'")
})

test('carries dottedId and metadata onto the runtime lesson', () => {
  const src = emitCurriculum(structure, metas)
  expect(src).toContain("dottedId: 'B1.1'")
  expect(src).toContain("volatility: 'stable'")
})

test('emits empty containers as [] (no elision hole that types as undefined[])', () => {
  const partial: LevelDef[] = [
    { id: 'beginner', title: 'Beginner', order: 1, modules: [{ code: 'B1', slug: 'basics', title: 'The Basics', order: 1 }] },
    { id: 'intermediate', title: 'Intermediate', order: 2, modules: [] },
  ]
  const src = emitCurriculum(partial, metas)
  expect(src).toContain('modules: [],') // level with no modules
  expect(src).not.toMatch(/\[\s*,/) // never an array that starts with a hole
})

test('re-exports types and includes the generated header', () => {
  const src = emitCurriculum(structure, metas)
  expect(src).toContain('DO NOT EDIT')
  expect(src).toContain("from './curriculum.types'")
})

test('emits array and interactive fields as single-quoted, not JSON.stringify', () => {
  const metasWithArrays: LessonMeta[] = [
    {
      dottedId: 'B1.1',
      slug: 'what-is-cc',
      title: 'What is Claude Code?',
      type: 'core',
      order: 1,
      volatility: 'stable',
      levelDir: 'beginner',
      file: 'x',
      prerequisites: ['B1.1'],
      teaches: ['x'],
      references: ['B1.2'],
      docsSources: ['https://d'],
      interactive: [{ kind: 'diagram', spec: 'agentic-loop-diagram' }],
    },
  ]
  const src = emitCurriculum(structure, metasWithArrays)
  expect(src).toContain("prerequisites: ['B1.1']")
  expect(src).toContain("teaches: ['x']")
  expect(src).toContain("references: ['B1.2']")
  expect(src).toContain("docsSources: ['https://d']")
  expect(src).toContain("interactive: [{ kind: 'diagram', spec: 'agentic-loop-diagram' }]")
  expect(src).not.toMatch(/"kind"/)
  expect(src).not.toMatch(/prerequisites: \["/)
})

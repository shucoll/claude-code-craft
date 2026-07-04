import fs from 'node:fs'
import { fileURLToPath, URL as NodeURL } from 'node:url'
import { curriculum, lessonPathById } from './curriculum'

test('generated curriculum exposes the migrated lessons', () => {
  const beginner = curriculum.find((l) => l.id === 'beginner')
  expect(beginner?.modules[0].lessons.map((l) => l.id)).toEqual(['what-is-cc', 'first-edit', 'review-changes'])
})

test('lessonPathById resolves dotted ids to routes', () => {
  expect(lessonPathById['B1.1']).toBe('/learn/beginner/basics/what-is-cc')
  expect(lessonPathById['A1.1']).toBe('/learn/advanced/power/subagents')
})

test('every lesson carries a dotted id', () => {
  const all = curriculum.flatMap((l) => l.modules.flatMap((m) => m.lessons))
  expect(all.every((l) => l.dottedId != null && /^[BIA]\d+\.\d+$/.test(l.dottedId))).toBe(true)
})

test('every lesson is a literal import (code-splitting guard)', () => {
  // Uses Node's URL explicitly (not the jsdom-provided global) because jsdom's
  // URL implementation resolves relative URLs against `window.location` and
  // discards a `file:` base, which would otherwise turn this into an
  // `http://localhost:3000/...` URL instead of a path back to curriculum.ts.
  const src = fs.readFileSync(fileURLToPath(new NodeURL('./curriculum.ts', import.meta.url)), 'utf8')
  const all = curriculum.flatMap((l) => l.modules.flatMap((m) => m.lessons))
  const literalImports = src.match(/content: \(\) => import\('\.\/lessons\/[^']+\.mdx'\)/g) ?? []
  expect(literalImports).toHaveLength(all.length)
  expect(src).not.toMatch(/import\([^'"]/) // no computed imports
})

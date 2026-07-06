import fs from 'node:fs'
import { fileURLToPath, URL as NodeURL } from 'node:url'
import { curriculum, lessonPathById } from './curriculum'
import { flattenLessons, lessonPath } from '../lib/curriculumNav'

// These guard the generator's output shape without hardcoding lesson content, so
// authoring or removing lessons never breaks them (content-specific behavior is
// covered elsewhere against a synthetic fixture).

test('generated curriculum exposes at least one lesson', () => {
  expect(flattenLessons(curriculum).length).toBeGreaterThan(0)
})

test('lessonPathById round-trips every lesson dotted id to its route', () => {
  const locs = flattenLessons(curriculum)
  for (const loc of locs) {
    const dotted = loc.lesson.dottedId!
    expect(lessonPathById[dotted]).toBe(lessonPath(loc))
  }
  // exactly one path entry per lesson
  expect(Object.keys(lessonPathById)).toHaveLength(locs.length)
})

test('every lesson carries a well-formed dotted id', () => {
  const all = flattenLessons(curriculum).map((l) => l.lesson)
  expect(all.every((l) => l.dottedId != null && /^[BIA]\d+\.\d+$/.test(l.dottedId))).toBe(true)
})

test('every lesson is a literal import (code-splitting guard)', () => {
  // Uses Node's URL explicitly (not the jsdom-provided global) because jsdom's
  // URL implementation resolves relative URLs against `window.location` and
  // discards a `file:` base, which would otherwise turn this into an
  // `http://localhost:3000/...` URL instead of a path back to curriculum.ts.
  const src = fs.readFileSync(fileURLToPath(new NodeURL('./curriculum.ts', import.meta.url)), 'utf8')
  const all = flattenLessons(curriculum).map((l) => l.lesson)
  const literalImports = src.match(/content: \(\) => import\('\.\/lessons\/[^']+\.mdx'\)/g) ?? []
  expect(literalImports).toHaveLength(all.length)
  expect(src).not.toMatch(/import\([^'"]/) // no computed imports
})

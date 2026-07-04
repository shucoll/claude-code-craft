// @vitest-environment node
import { validateContent } from './validate.ts'
import type { LessonMeta } from './frontmatter.ts'
import type { LevelDef } from '../../../src/content/structure.ts'

const structure: LevelDef[] = [
  { id: 'beginner', title: 'Beginner', order: 1, modules: [{ code: 'B1', slug: 'basics', title: 'The Basics', order: 1 }] },
]

function meta(over: Partial<LessonMeta>): LessonMeta {
  return {
    dottedId: 'B1.1', slug: 'a', title: 'A', type: 'core', order: 1,
    volatility: 'stable', levelDir: 'beginner', file: '/x/a.mdx', ...over,
  }
}

const charts = new Set<string>(['demo'])

test('valid content produces no errors', () => {
  expect(validateContent({ structure, metas: [meta({})], knownChartIds: charts })).toEqual([])
})

test('flags duplicate dotted ids and slugs', () => {
  const errors = validateContent({
    structure,
    metas: [meta({ dottedId: 'B1.1', slug: 'a', order: 1 }), meta({ dottedId: 'B1.1', slug: 'a', order: 2, file: '/x/b.mdx' })],
    knownChartIds: charts,
  })
  expect(errors.some((e) => e.includes('duplicate id'))).toBe(true)
  expect(errors.some((e) => e.includes('duplicate slug'))).toBe(true)
})

test('flags a module not present in structure', () => {
  const errors = validateContent({ structure, metas: [meta({ dottedId: 'B9.1' })], knownChartIds: charts })
  expect(errors.some((e) => e.includes('not found in structure'))).toBe(true)
})

test('flags a level-letter / directory mismatch', () => {
  const errors = validateContent({ structure, metas: [meta({ dottedId: 'I1.1', levelDir: 'beginner' })], knownChartIds: charts })
  expect(errors.some((e) => e.includes('implies level'))).toBe(true)
})

test('flags unresolved prerequisites and references', () => {
  const errors = validateContent({ structure, metas: [meta({ prerequisites: ['B1.9'], references: ['B1.8'] })], knownChartIds: charts })
  expect(errors.some((e) => e.includes('prerequisite "B1.9"'))).toBe(true)
  expect(errors.some((e) => e.includes('reference "B1.8"'))).toBe(true)
})

test('flags an interactive spec missing from the chart registry', () => {
  const errors = validateContent({ structure, metas: [meta({ interactive: [{ kind: 'diagram', spec: 'nope' }] })], knownChartIds: charts })
  expect(errors.some((e) => e.includes('interactive spec "nope"'))).toBe(true)
})

test('requires docsSources when volatility is not stable', () => {
  const errors = validateContent({ structure, metas: [meta({ volatility: 'evolving' })], knownChartIds: charts })
  expect(errors.some((e) => e.includes('requires docsSources'))).toBe(true)
})

test('flags a missing order field', () => {
  const errors = validateContent({ structure, metas: [meta({ order: undefined })], knownChartIds: charts })
  expect(errors.some((e) => e.includes('missing required field "order"'))).toBe(true)
})

test('requires contiguous order within a module', () => {
  const errors = validateContent({
    structure,
    metas: [meta({ dottedId: 'B1.1', slug: 'a', order: 1 }), meta({ dottedId: 'B1.2', slug: 'b', order: 3, file: '/x/b.mdx' })],
    knownChartIds: charts,
  })
  expect(errors.some((e) => e.includes('contiguous'))).toBe(true)
})

test('flags a slug that does not match the file name', () => {
  const errors = validateContent({ structure, metas: [meta({ slug: 'bar', file: '/x/foo.mdx' })], knownChartIds: charts })
  expect(errors.some((e) => e.includes('must match the file name'))).toBe(true)
})

test('requires verifiedAgainstDocsAt to be an ISO YYYY-MM-DD date', () => {
  const bad = validateContent({ structure, metas: [meta({ verifiedAgainstDocsAt: '2026/07/03' })], knownChartIds: charts })
  expect(bad.some((e) => e.includes('must be an ISO date'))).toBe(true)
  const good = validateContent({ structure, metas: [meta({ verifiedAgainstDocsAt: '2026-07-03' })], knownChartIds: charts })
  expect(good.some((e) => e.includes('must be an ISO date'))).toBe(false)
})

test('flags a list-shaped field given a non-list value (does not crash)', () => {
  const errors = validateContent({
    structure,
    metas: [meta({ prerequisites: 'B1.1' as unknown as string[] })],
    knownChartIds: charts,
  })
  expect(errors.some((e) => e.includes('"prerequisites" must be a list'))).toBe(true)
})

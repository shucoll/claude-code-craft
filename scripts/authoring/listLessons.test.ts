// @vitest-environment node
import { selectLessons } from './listLessons.ts'
import type { LessonMeta } from './generate/frontmatter.ts'
import type { LevelDef } from '../../src/content/structure.ts'

const structure: LevelDef[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    order: 1,
    modules: [
      { code: 'B1', slug: 'b1', title: 'B1', order: 1 },
      { code: 'B3', slug: 'b3', title: 'B3', order: 3 },
    ],
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    order: 2,
    modules: [{ code: 'I1', slug: 'i1', title: 'I1', order: 1 }],
  },
]

const meta = (dottedId: string, order: number, volatility?: string): LessonMeta => ({
  dottedId,
  slug: dottedId.toLowerCase().replace('.', '-'),
  title: dottedId,
  order,
  volatility,
  levelDir: dottedId[0] === 'B' ? 'beginner' : 'intermediate',
  file: `/lessons/${dottedId}.mdx`,
})

test('orders by level, then module, then lesson order — not lexical id', () => {
  // Deliberately shuffled input, including a two-digit order that a string sort
  // would misplace (B3.10 before B3.9).
  const metas = [meta('I1.1', 1), meta('B3.10', 10), meta('B3.9', 9), meta('B1.1', 1), meta('B3.2', 2)]
  expect(selectLessons(structure, metas).map((l) => l.id)).toEqual(['B1.1', 'B3.2', 'B3.9', 'B3.10', 'I1.1'])
})

test('filters to a single volatility, preserving order', () => {
  const metas = [meta('B1.1', 1, 'stable'), meta('B3.2', 2, 'volatile'), meta('B3.9', 9, 'volatile'), meta('I1.1', 1, 'evolving')]
  expect(selectLessons(structure, metas, { volatility: 'volatile' }).map((l) => l.id)).toEqual(['B3.2', 'B3.9'])
})

test('projects the fields the orchestrator needs', () => {
  const metas = [{ ...meta('B1.1', 1, 'stable'), verifiedAgainstDocsAt: '2026-07-09' }]
  expect(selectLessons(structure, metas)).toEqual([
    { id: 'B1.1', slug: 'b1-1', title: 'B1.1', file: '/lessons/B1.1.mdx', volatility: 'stable', verifiedAgainstDocsAt: '2026-07-09' },
  ])
})

test('modules missing from structure sort last, deterministically', () => {
  const metas = [meta('Z9.1', 1), meta('B1.1', 1)]
  expect(selectLessons(structure, metas).map((l) => l.id)).toEqual(['B1.1', 'Z9.1'])
})

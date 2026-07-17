import fs from 'node:fs'
import path from 'node:path'
import GithubSlugger from 'github-slugger'
import { curriculum } from '../curriculum'
import { findLesson } from '../../lib/curriculumNav'
import { chartIds } from './chartIds'
import { getChart, registeredChartIds } from './index'
import type { ChartCard } from './types'

/**
 * The heading ids `rehype-slug` will generate for a lesson, derived from its MDX
 * source the same way the build does: in document order, skipping fenced code
 * blocks, with GithubSlugger's de-duplication.
 */
function headingIds(levelId: string, lessonId: string): string[] {
  const file = path.join('src/content/lessons', levelId, `${lessonId}.mdx`)
  const src = fs.readFileSync(file, 'utf8')
  const slugger = new GithubSlugger()
  const ids: string[] = []
  let inFence = false
  for (const line of src.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence
    if (inFence) continue
    const heading = /^#{1,6}\s+(.*)$/.exec(line)
    if (heading) ids.push(slugger.slug(heading[1].trim()))
  }
  return ids
}

/** Every clickable card/node/segment across every row kind of a chart. */
function targetsOf(chartId: string): ChartCard[] {
  return getChart(chartId)!.rows.flatMap((row) => {
    if (row.kind === 'cards') return row.cards
    if (row.kind === 'flow') return row.nodes
    if (row.kind === 'bar') return row.segments
    if (row.kind === 'grid') return row.items
    if (row.kind === 'ledger') return row.entries
    return []
  })
}

// ChartEmbed silently no-ops when a lesson target does not resolve (`if (!loc) return`),
// so a typo'd or stale ref ships as a dead click with nothing to catch it. This is that
// something.
test('every chart lesson target resolves against the real curriculum', () => {
  const dead: string[] = []
  for (const id of registeredChartIds) {
    for (const card of targetsOf(id)) {
      if (card.target?.kind !== 'lesson') continue
      const { level, module, lesson } = card.target.ref
      if (!findLesson(curriculum, level, module, lesson)) {
        dead.push(`${id}/${card.id} -> ${level}/${module}/${lesson}`)
      }
    }
  }
  expect(dead).toEqual([])
})

// An anchor that does not match a heading scrolls nowhere: the lesson opens at the
// top and the entry silently loses its precision.
test('every chart lesson anchor matches a real heading in that lesson', () => {
  const broken: string[] = []
  for (const id of registeredChartIds) {
    for (const card of targetsOf(id)) {
      if (card.target?.kind !== 'lesson') continue
      const { level, lesson, anchor } = card.target.ref
      if (!anchor) continue
      if (!headingIds(level, lesson).includes(anchor)) {
        broken.push(`${id}/${card.id} -> ${lesson}#${anchor}`)
      }
    }
  }
  expect(broken).toEqual([])
})

test('chartIds stays in sync with the real chart registry', () => {
  expect([...registeredChartIds].sort()).toEqual([...chartIds].sort())
})

test('getChart returns the demo chart by id', () => {
  const chart = getChart('demo')
  expect(chart?.id).toBe('demo')
  expect(chart?.rows.length).toBeGreaterThanOrEqual(3)
})

test('getChart returns undefined for an unknown id', () => {
  expect(getChart('nope')).toBeUndefined()
})

test('demo exercises all three card kinds and a connector', () => {
  const rows = getChart('demo')!.rows
  const cards = rows.flatMap((r) => (r.kind === 'cards' ? r.cards : []))
  expect(cards.some((c) => c.target?.kind === 'lesson')).toBe(true)
  expect(cards.some((c) => c.target?.kind === 'popup')).toBe(true)
  expect(cards.some((c) => c.target === undefined)).toBe(true)
  expect(rows.some((r) => r.kind === 'connector')).toBe(true)
})

test('registers the two flow dogfood charts, each with a flow row', () => {
  for (const id of ['agentic-loop-diagram', 'clear-compact-new-tree']) {
    const rows = getChart(id)?.rows
    expect(rows?.some((r) => r.kind === 'flow')).toBe(true)
  }
})

test('the agentic loop has a back-edge (cycle)', () => {
  const flow = getChart('agentic-loop-diagram')!.rows.find((r) => r.kind === 'flow')!
  if (flow.kind !== 'flow') throw new Error('expected flow row')
  expect(flow.edges.some((e) => e.to === 'gather')).toBe(true)
})

test('the decision tree exercises labeled edges, a lesson link, and a popup leaf', () => {
  const flow = getChart('clear-compact-new-tree')!.rows.find((r) => r.kind === 'flow')!
  if (flow.kind !== 'flow') throw new Error('expected flow row')
  expect(flow.edges.every((e) => Boolean(e.label))).toBe(true)
  expect(flow.nodes.some((n) => n.target?.kind === 'lesson')).toBe(true)
  expect(flow.nodes.some((n) => n.target?.kind === 'popup')).toBe(true)
})

test('the decision tree opts into guided traversal with a single root question', () => {
  const flow = getChart('clear-compact-new-tree')!.rows.find((r) => r.kind === 'flow')!
  if (flow.kind !== 'flow') throw new Error('expected flow row')
  expect(flow.guided).toBe(true)
  const targets = new Set(flow.edges.map((e) => e.to))
  const roots = flow.nodes.filter((n) => !targets.has(n.id))
  expect(roots).toHaveLength(1)
  expect(roots[0].role).toBe('question')
  // undo? -> still relevant? -> same setup?, resolving to four leaves
  expect(flow.nodes.filter((n) => n.role === 'question')).toHaveLength(3)
  expect(flow.nodes.filter((n) => n.role === 'leaf')).toHaveLength(4)
})

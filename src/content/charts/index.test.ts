import { chartIds } from './chartIds'
import { getChart, registeredChartIds } from './index'

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

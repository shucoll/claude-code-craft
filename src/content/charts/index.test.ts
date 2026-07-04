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

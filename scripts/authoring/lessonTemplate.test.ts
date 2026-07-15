import { test, expect } from 'vitest'
import { renderLesson } from './lessonTemplate.ts'

const base = {
  id: 'B2.3',
  slug: 'review-changes',
  title: 'Reviewing Changes',
  type: 'core' as const,
  order: 3,
  volatility: 'stable',
  verifiedAgainstDocsAt: '2026-07-03',
}

test('emits a frontmatter block with keys in canonical order and no level/module', () => {
  const out = renderLesson(base)
  expect(out.startsWith('---\n')).toBe(true)
  expect(out).toContain('id: "B2.3"')
  expect(out).toContain('slug: "review-changes"')
  expect(out).toContain('type: "core"')
  expect(out).toContain('order: 3')
  expect(out).toContain('volatility: "stable"')
  expect(out).not.toContain('level:')
  expect(out).not.toContain('module:')
  // id precedes slug precedes title precedes type
  expect(out.indexOf('id:')).toBeLessThan(out.indexOf('slug:'))
  expect(out.indexOf('slug:')).toBeLessThan(out.indexOf('title:'))
  expect(out.indexOf('title:')).toBeLessThan(out.indexOf('type:'))
})

test('renders arrays as flow sequences and interactive as a block sequence', () => {
  const out = renderLesson({
    ...base,
    prerequisites: ['B2.2'],
    references: ['B2.1'],
    docsSources: ['https://code.claude.com/docs/en/x.md'],
    interactive: [{ kind: 'diagram', spec: 'demo' }],
  })
  expect(out).toContain('prerequisites: ["B2.2"]')
  expect(out).toContain('references: ["B2.1"]')
  expect(out).toContain('docsSources: ["https://code.claude.com/docs/en/x.md"]')
  expect(out).toContain('interactive:')
  expect(out).toContain('- kind: "diagram"')
  expect(out).toContain('spec: "demo"')
})

test('core body carries the anatomy section headings in order', () => {
  const out = renderLesson(base)
  const idxOf = (h: string) => out.indexOf(h)
  expect(idxOf('# Reviewing Changes')).toBeGreaterThan(0)
  expect(idxOf('## The problem')).toBeGreaterThan(idxOf('# Reviewing Changes'))
  expect(idxOf('## The concept')).toBeGreaterThan(idxOf('## The problem'))
  expect(idxOf('## How it works')).toBeGreaterThan(idxOf('## The concept'))
  expect(idxOf('## Walkthrough')).toBeGreaterThan(idxOf('## How it works'))
  expect(idxOf('## Pitfalls')).toBeGreaterThan(idxOf('## Walkthrough'))
  expect(idxOf('## Try It')).toBeGreaterThan(idxOf('## Pitfalls'))
  expect(idxOf('## FAQ')).toBeGreaterThan(idxOf('## Try It'))
  expect(idxOf('## Where next')).toBeGreaterThan(idxOf('## FAQ'))
})

test('resolver body carries the resolver anatomy headings', () => {
  const out = renderLesson({ ...base, type: 'resolver' })
  expect(out).toContain('## The confusion')
  expect(out).toContain('## Side-by-side')
  expect(out).toContain('## Decision tree')
  expect(out).toContain('## Scenario walkthroughs')
  expect(out).toContain('## Edge cases')
})

test('checkpoint and milestone bodies carry their headings', () => {
  const cp = renderLesson({ ...base, type: 'checkpoint' })
  expect(cp).toContain('## The exercise')
  expect(cp).toContain('## Self-check')
  const ms = renderLesson({ ...base, type: 'milestone' })
  expect(ms).toContain('## Goal for this stage')
  expect(ms).toContain('## Reasoning recap')
})

test('overview body carries the level-entry anatomy headings and no Try It', () => {
  const out = renderLesson({ ...base, type: 'overview' })
  expect(out).toContain('## You are here')
  expect(out).toContain('## The gap')
  expect(out).toContain('## The map')
  expect(out).toContain('## How it fits together')
  expect(out).toContain('## Suggested route')
  expect(out).toContain("## What you'll build")
  expect(out).not.toContain('## Try It')
  expect(out).not.toContain('## Pitfalls')
})

test('overview body embeds its interactive stack map under The map', () => {
  const out = renderLesson({ ...base, type: 'overview', interactive: [{ kind: 'diagram', spec: 'intermediate-stack-map' }] })
  const mapIdx = out.indexOf('## The map')
  const chartIdx = out.indexOf('<ChartEmbed id="intermediate-stack-map" />')
  expect(chartIdx).toBeGreaterThan(mapIdx)
  expect(out.indexOf('## How it fits together')).toBeGreaterThan(chartIdx)
})

test('snippets/prompts are opt-in: absent by default, present when requested', () => {
  expect(renderLesson(base)).not.toContain('<Snippet')
  expect(renderLesson(base)).not.toContain('<TryPrompt')
  const withOpts = renderLesson(base, { snippets: ['review-example'], prompts: ['review-it'] })
  expect(withOpts).toContain('<Snippet id="review-example" />')
  expect(withOpts).toContain('<TryPrompt id="review-it" />')
})

test('interactive core lesson embeds the chart via ChartEmbed', () => {
  const out = renderLesson({ ...base, interactive: [{ kind: 'diagram', spec: 'agentic-loop' }] })
  expect(out).toContain('<ChartEmbed id="agentic-loop" />')
})

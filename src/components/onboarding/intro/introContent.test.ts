import { INTRO_CONTENT } from './introContent'

test('INTRO_CONTENT carries the opening line, title, and crawl paragraphs', () => {
  expect(INTRO_CONTENT.openingLine.toLowerCase()).toContain('long, long ago')
  expect(INTRO_CONTENT.title).toBe('Claude Code Craft')
  expect(INTRO_CONTENT.paragraphs.length).toBeGreaterThanOrEqual(3)
  expect(INTRO_CONTENT.paragraphs.every((p) => p.length > 0)).toBe(true)
})

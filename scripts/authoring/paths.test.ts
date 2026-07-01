// @vitest-environment node
import { DEFAULT_CONTENT_DIR, DEFAULT_LANGUAGE, STUB, curriculumFile, packFile, packsIndexFile, snippetsDir } from './paths.ts'

test('STUB and default language are the agreed constants', () => {
  expect(STUB).toBe('@@TODO@@')
  expect(DEFAULT_LANGUAGE).toBe('javascript')
})

test('DEFAULT_CONTENT_DIR points at src/content', () => {
  expect(DEFAULT_CONTENT_DIR.replace(/\\/g, '/')).toMatch(/\/src\/content$/)
})

test('path derivations join under the given content dir', () => {
  expect(curriculumFile('/x').replace(/\\/g, '/')).toBe('/x/curriculum.ts')
  expect(snippetsDir('/x').replace(/\\/g, '/')).toBe('/x/snippets')
  expect(packFile('/x', 'python').replace(/\\/g, '/')).toBe('/x/snippets/python.ts')
  expect(packsIndexFile('/x').replace(/\\/g, '/')).toBe('/x/snippets/index.ts')
})

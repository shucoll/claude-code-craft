import { DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_PACKS, languageLabel } from './index'

test('registry contains javascript and python', () => {
  expect(Object.keys(LANGUAGE_PACKS).sort()).toEqual(['javascript', 'python'])
})

test('default language exists in the registry', () => {
  expect(LANGUAGE_PACKS[DEFAULT_LANGUAGE]).toBeDefined()
})

test('each pack meta.id matches its registry key', () => {
  for (const [key, pack] of Object.entries(LANGUAGE_PACKS)) {
    expect(pack.meta.id).toBe(key)
  }
})

test('the two packs ship identical key sets', () => {
  const js = LANGUAGE_PACKS.javascript
  const py = LANGUAGE_PACKS.python
  expect(Object.keys(py.snippets).sort()).toEqual(Object.keys(js.snippets).sort())
  expect(Object.keys(py.prompts).sort()).toEqual(Object.keys(js.prompts).sort())
})

test('LANGUAGES lists every pack meta', () => {
  expect(LANGUAGES.map((m) => m.id).sort()).toEqual(['javascript', 'python'])
})

test('languageLabel returns the label, or the id when unknown', () => {
  expect(languageLabel('python')).toBe('Python')
  expect(languageLabel('ruby')).toBe('ruby')
})

import type { LanguagePack } from '../content/types'
import { resolveEntryFrom, resolvePrompt, resolveSnippet } from './resolveContent'

const packs: Record<string, LanguagePack> = {
  en: { meta: { id: 'en', label: 'English' }, snippets: { a: { code: 'A-en' } }, prompts: { p: 'P-en' } },
  fr: { meta: { id: 'fr', label: 'French' }, snippets: { a: { code: 'A-fr' } }, prompts: {} },
}
const snippets = (p: LanguagePack) => p.snippets
const prompts = (p: LanguagePack) => p.prompts

test('returns the active value when present (no fallback)', () => {
  expect(resolveEntryFrom(packs, 'en', snippets, 'fr', 'a')).toEqual({
    value: { code: 'A-fr' }, lang: 'fr', fellBack: false,
  })
})

test('falls back to the default when missing in the active pack', () => {
  expect(resolveEntryFrom(packs, 'en', prompts, 'fr', 'p')).toEqual({
    value: 'P-en', lang: 'en', fellBack: true,
  })
})

test('no fallback flag when the active pack IS the default', () => {
  expect(resolveEntryFrom(packs, 'en', snippets, 'en', 'a')).toEqual({
    value: { code: 'A-en' }, lang: 'en', fellBack: false,
  })
})

test('an unknown language falls back to the default', () => {
  expect(resolveEntryFrom(packs, 'en', snippets, 'ruby', 'a')).toEqual({
    value: { code: 'A-en' }, lang: 'en', fellBack: true,
  })
})

test('returns null when the key is missing everywhere', () => {
  expect(resolveEntryFrom(packs, 'en', snippets, 'fr', 'zzz')).toBeNull()
})

test('registry-bound resolvers read the real packs', () => {
  const s = resolveSnippet('python', 'hello-world')
  expect(s?.value.code).toContain('greet')
  expect(s?.fellBack).toBe(false)
  const p = resolvePrompt('python', 'first-edit')
  expect(p?.value).toContain('is_even')
  expect(p?.fellBack).toBe(false)
})

import { DEFAULT_LANGUAGE, LANGUAGE_PACKS } from '../content/snippets'
import type { LanguagePack } from '../content/types'
import { findMissingKeys } from './checkMissingKeys'

const packs: Record<string, LanguagePack> = {
  base: { meta: { id: 'base', label: 'Base' }, snippets: { a: { code: '' }, b: { code: '' } }, prompts: { x: '' } },
  partial: { meta: { id: 'partial', label: 'Partial' }, snippets: { a: { code: '' } }, prompts: {} },
}

test('reports keys missing from a non-default pack', () => {
  expect(findMissingKeys(packs, 'base')).toEqual([
    { lang: 'partial', missingSnippets: ['b'], missingPrompts: ['x'] },
  ])
})

test('excludes the default pack from the report', () => {
  expect(findMissingKeys(packs, 'base').find((r) => r.lang === 'base')).toBeUndefined()
})

test('the shipped packs are complete (no missing keys)', () => {
  expect(findMissingKeys(LANGUAGE_PACKS, DEFAULT_LANGUAGE)).toEqual([
    { lang: 'python', missingSnippets: [], missingPrompts: [] },
  ])
})

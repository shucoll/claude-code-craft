import type { LanguageMeta, LanguagePack } from '../types'
import javascript from './javascript'
import python from './python'

export const LANGUAGE_PACKS: Record<string, LanguagePack> = {
  javascript,
  python,
}

export const DEFAULT_LANGUAGE = 'javascript'

export const LANGUAGES: LanguageMeta[] = Object.values(LANGUAGE_PACKS).map((p) => p.meta)

export function languageLabel(id: string): string {
  return LANGUAGE_PACKS[id]?.meta.label ?? id
}

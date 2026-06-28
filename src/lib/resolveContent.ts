import { DEFAULT_LANGUAGE, LANGUAGE_PACKS } from '../content/snippets'
import type { LanguageId, LanguagePack, SnippetValue } from '../content/types'

export interface Resolved<T> {
  value: T
  lang: LanguageId
  fellBack: boolean
}

export function resolveEntryFrom<T>(
  packs: Record<string, LanguagePack>,
  defaultId: LanguageId,
  section: (pack: LanguagePack) => Record<string, T> | undefined,
  lang: LanguageId,
  id: string,
): Resolved<T> | null {
  const active = packs[lang]
  const fromActive = active ? section(active)?.[id] : undefined
  if (fromActive !== undefined) {
    return { value: fromActive, lang, fellBack: false }
  }
  const fallback = packs[defaultId]
  const fromDefault = fallback ? section(fallback)?.[id] : undefined
  if (fromDefault !== undefined) {
    return { value: fromDefault, lang: defaultId, fellBack: lang !== defaultId }
  }
  return null
}

export function resolveSnippet(lang: LanguageId, id: string): Resolved<SnippetValue> | null {
  return resolveEntryFrom(LANGUAGE_PACKS, DEFAULT_LANGUAGE, (p) => p.snippets, lang, id)
}

export function resolvePrompt(lang: LanguageId, id: string): Resolved<string> | null {
  return resolveEntryFrom(LANGUAGE_PACKS, DEFAULT_LANGUAGE, (p) => p.prompts, lang, id)
}

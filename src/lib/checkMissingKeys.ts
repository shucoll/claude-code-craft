import type { LanguagePack } from '../content/types'

export interface MissingReport {
  lang: string
  missingSnippets: string[]
  missingPrompts: string[]
}

export function findMissingKeys(
  packs: Record<string, LanguagePack>,
  defaultId: string,
): MissingReport[] {
  const base = packs[defaultId]
  if (!base) return []
  const snippetKeys = Object.keys(base.snippets)
  const promptKeys = Object.keys(base.prompts)
  return Object.entries(packs)
    .filter(([id]) => id !== defaultId)
    .map(([id, pack]) => ({
      lang: id,
      missingSnippets: snippetKeys.filter((k) => !(k in pack.snippets)),
      missingPrompts: promptKeys.filter((k) => !(k in pack.prompts)),
    }))
}

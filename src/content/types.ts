export interface SnippetValue {
  code: string
  filename?: string
}

export interface LanguageMeta {
  id: string
  label: string
  icon?: string
}

export interface LanguagePack {
  meta: LanguageMeta
  snippets: Record<string, SnippetValue>
  prompts: Record<string, string>
  /** Optional longer per-key prose overrides; reserved for future components. */
  blocks?: Record<string, string>
}

export type LanguageId = string

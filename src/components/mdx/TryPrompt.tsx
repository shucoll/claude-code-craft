import { languageLabel } from '../../content/snippets'
import { useLanguage } from '../../context/LanguageContext'
import { resolvePrompt } from '../../lib/resolveContent'

export function TryPrompt({ id }: { id: string }) {
  const { language } = useLanguage()
  const result = resolvePrompt(language, id)

  if (!result) {
    return (
      <div
        role="alert"
        className="my-4 rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
      >
        Missing prompt: <code>{id}</code>
      </div>
    )
  }

  const { value, lang, fellBack } = result
  return (
    <aside className="my-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700/60 dark:bg-amber-950/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Try this 👉
      </p>
      <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{value}</p>
      {fellBack && (
        <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-400/80">
          Prompt shown for {languageLabel(lang)}.
        </p>
      )}
    </aside>
  )
}

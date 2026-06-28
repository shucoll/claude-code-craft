import { languageLabel } from '../../content/snippets'
import { useLanguage } from '../../context/LanguageContext'
import { resolveSnippet } from '../../lib/resolveContent'

export function Snippet({ id }: { id: string }) {
  const { language } = useLanguage()
  const result = resolveSnippet(language, id)

  if (!result) {
    return (
      <div
        role="alert"
        className="my-4 rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
      >
        Missing snippet: <code>{id}</code>
      </div>
    )
  }

  const { value, lang, fellBack } = result
  return (
    <figure className="my-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
      {value.filename && (
        <figcaption className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {value.filename}
        </figcaption>
      )}
      <pre className="overflow-x-auto bg-slate-950 p-4 text-sm text-slate-100">
        <code>{value.code}</code>
      </pre>
      {fellBack && (
        <p className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Example shown in {languageLabel(lang)}.
        </p>
      )}
    </figure>
  )
}

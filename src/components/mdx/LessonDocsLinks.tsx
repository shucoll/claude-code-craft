interface LessonDocsLinksProps {
  /** Official docs URLs verified during authoring (frontmatter `docsSources`). */
  urls: string[]
}

const linkClass = 'text-link underline underline-offset-2 hover:text-primary'

/** A readable label from a docs URL: its last path segment, minus a `.md` suffix. */
function docLabel(url: string): string {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    return last ? last.replace(/\.md$/, '') : url
  } catch {
    return url
  }
}

export function LessonDocsLinks({ urls }: LessonDocsLinksProps) {
  if (urls.length === 0) return null

  return (
    <nav aria-label="Official docs" className="mt-10 border-t-2 border-border pt-6">
      <h2 className="mb-2 font-mono text-lg font-semibold">Official docs</h2>
      <p className="mb-2 text-sm text-muted-foreground">
        Claude Code ships fast — when in doubt, the docs win.
      </p>
      <ul className="space-y-1">
        {urls.map((url) => (
          <li key={url} className="leading-relaxed">
            <a href={url} target="_blank" rel="noreferrer noopener" className={linkClass}>
              {docLabel(url)}
            </a>
            <span aria-hidden="true"> ↗</span>
          </li>
        ))}
      </ul>
    </nav>
  )
}

import { Fragment } from 'react'
import { LessonLink } from './LessonLink'

interface LessonRefLinksProps {
  label: string
  /** Dotted ids of the referenced lessons. */
  ids: string[]
  variant: 'inline' | 'list'
}

export function LessonRefLinks({ label, ids, variant }: LessonRefLinksProps) {
  if (ids.length === 0) return null

  if (variant === 'inline') {
    return (
      <p className="mb-6 text-sm text-muted-foreground">
        <span className="font-semibold">{label}:</span>{' '}
        {ids.map((id, i) => (
          <Fragment key={id}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            <LessonLink id={id} />
          </Fragment>
        ))}
      </p>
    )
  }

  return (
    <nav aria-label={label} className="mt-10 border-t-2 border-border pt-6">
      <h2 className="mb-2 font-mono text-lg font-semibold">{label}</h2>
      <ul className="space-y-1">
        {ids.map((id) => (
          <li key={id} className="leading-relaxed">
            <span aria-hidden="true">→ </span>
            <LessonLink id={id} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

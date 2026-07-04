import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { findByDottedId, lessonPath } from '../../lib/curriculumNav'

interface LessonLinkProps {
  /** Canonical dotted id of the target lesson, e.g. "B2.3". */
  id: string
  children?: ReactNode
}

const linkClass = 'text-link underline underline-offset-2 hover:text-primary'

export function LessonLink({ id, children }: LessonLinkProps) {
  const loc = findByDottedId(curriculum, id)
  if (!loc) return <span>{children ?? id}</span>
  return (
    <Link to={lessonPath(loc)} className={linkClass}>
      {children ?? loc.lesson.title}
    </Link>
  )
}

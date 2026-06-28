import { MDXProvider } from '@mdx-js/react'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { mdxComponents } from '../components/mdx/mdxComponents'
import { curriculum } from '../content/curriculum'
import { useProgress } from '../context/ProgressContext'
import { findLesson } from '../lib/curriculumNav'

export function LessonPage() {
  const { levelId, moduleId, lessonId } = useParams()
  const { markVisited } = useProgress()

  const location = useMemo(
    () =>
      levelId && moduleId && lessonId
        ? findLesson(curriculum, levelId, moduleId, lessonId)
        : undefined,
    [levelId, moduleId, lessonId],
  )

  useEffect(() => {
    if (location) markVisited(location.lesson.id)
  }, [location, markVisited])

  const LessonContent = useMemo(() => (location ? lazy(location.lesson.content) : null), [location])

  if (!location || !LessonContent) return <Navigate to="/" replace />

  return (
    <article className="mx-auto max-w-2xl p-8">
      <MDXProvider components={mdxComponents}>
        <Suspense fallback={<p>Loading…</p>}>
          <LessonContent />
        </Suspense>
      </MDXProvider>
    </article>
  )
}

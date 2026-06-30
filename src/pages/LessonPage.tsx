import { MDXProvider } from '@mdx-js/react'
import { motion, useReducedMotion } from 'framer-motion'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useBackTarget } from '../lib/useBackTarget'
import { mdxComponents } from '../components/mdx/mdxComponents'
import { Button } from '../components/ui/Button'
import { curriculum } from '../content/curriculum'
import { useProgress } from '../context/ProgressContext'
import { findLesson, lessonPath, nextLesson } from '../lib/curriculumNav'
import { setLastLesson } from '../lib/onboarding'

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 8H3M7 4L3 8l4 4" />
    </svg>
  )
}

export function LessonPage() {
  const { levelId, moduleId, lessonId } = useParams()
  const { markCompleted, markVisited } = useProgress()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const back = useBackTarget()
  const { hash } = useLocation()

  const location = useMemo(
    () =>
      levelId && moduleId && lessonId
        ? findLesson(curriculum, levelId, moduleId, lessonId)
        : undefined,
    [levelId, moduleId, lessonId],
  )

  useEffect(() => {
    if (location) {
      markVisited(location.lesson.id)
      setLastLesson(lessonPath(location))
    }
  }, [location, markVisited])

  useEffect(() => {
    if (!hash) return
    let frame = 0
    let cancelled = false
    const deadline = Date.now() + 2000
    const tryScroll = () => {
      if (cancelled) return
      let el: Element | null = null
      try {
        el = document.querySelector(hash)
      } catch {
        el = null // hash is not a valid CSS selector; nothing to scroll to
      }
      if (el) {
        el.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
        return
      }
      if (Date.now() < deadline) {
        frame = requestAnimationFrame(tryScroll)
      }
    }
    frame = requestAnimationFrame(tryScroll)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [hash, location, reduce])

  const LessonContent = useMemo(() => (location ? lazy(location.lesson.content) : null), [location])
  const next = useMemo(() => (location ? nextLesson(curriculum, location.lesson.id) : undefined), [location])

  if (!location || !LessonContent) return <Navigate to="/" replace />

  const handleComplete = () => {
    markCompleted(location.lesson.id)
    if (next) {
      navigate(`/learn/${next.levelId}/${next.moduleId}/${next.lesson.id}`, {
        state: { from: lessonPath(location) },
      })
    }
  }

  return (
    <motion.article
      key={location.lesson.id}
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl px-6 py-10"
    >
      {back && (
        <div className="mb-6">
          <Button variant="secondary" size="sm" leadingIcon={<ArrowLeftIcon />} onClick={() => navigate(back)}>
            Back
          </Button>
        </div>
      )}

      <MDXProvider components={mdxComponents}>
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <LessonContent />
        </Suspense>
      </MDXProvider>

      <footer className="mt-12 flex justify-end border-t-2 border-border pt-6">
        <Button onClick={handleComplete} trailingIcon={next ? <ArrowRightIcon /> : undefined}>
          {next ? 'Mark complete & continue' : 'Mark complete'}
        </Button>
      </footer>
    </motion.article>
  )
}

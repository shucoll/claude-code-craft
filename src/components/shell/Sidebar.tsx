import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { curriculum } from '../../content/curriculum'
import { useProgress } from '../../context/ProgressContext'
import { levelPercent } from '../../lib/progressMath'
import { Badge } from '../ui/Badge'
import { ProgressGlyph, type LessonStatus as GlyphStatus } from './ProgressGlyph'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('h-4 w-4 shrink-0 transition-transform duration-150', open && 'rotate-90')}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  )
}

function glyphFor(isActive: boolean, completed: boolean): GlyphStatus {
  if (isActive) return 'current'
  return completed ? 'completed' : 'unvisited'
}

export function Sidebar() {
  const { progress, getStatus } = useProgress()
  const reduce = useReducedMotion()
  const location = useLocation()
  // Preserve any hash/search (e.g. a `#chart-…` anchor) so Back can scroll-restore.
  const from = `${location.pathname}${location.search}${location.hash}`
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(curriculum.map((level) => [level.id, true])),
  )

  return (
    <nav aria-label="Lessons" className="flex flex-col gap-1 p-3">
      {curriculum.map((level) => {
        const pct = levelPercent(level, progress)
        const isOpen = open[level.id]
        return (
          <section key={level.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen((o) => ({ ...o, [level.id]: !o[level.id] }))}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-control px-2 py-2 text-left hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <ChevronIcon open={isOpen} />
                <span className="font-mono text-sm font-semibold">{level.title}</span>
              </span>
              <Badge tone={pct === 100 ? 'success' : 'neutral'}>{pct}%</Badge>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="modules"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mb-2 ml-3 border-l-2 border-border pl-2">
                    {level.modules.map((mod) => (
                      <div key={mod.id} className="mt-1">
                        <p className="px-2 py-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                          {mod.title}
                        </p>
                        <ul className="flex flex-col gap-0.5">
                          {mod.lessons.map((lesson) => {
                            const completed = getStatus(lesson.id) === 'completed'
                            return (
                              <li key={lesson.id}>
                                <NavLink
                                  to={`/learn/${level.id}/${mod.id}/${lesson.id}`}
                                  state={{ from }}
                                  className={({ isActive }) =>
                                    cn(
                                      'flex items-center gap-2 rounded-control px-2 py-1.5 text-sm',
                                      isActive
                                        ? 'bg-accent-soft font-medium text-accent-foreground'
                                        : 'text-foreground hover:bg-muted',
                                    )
                                  }
                                >
                                  {({ isActive }) => (
                                    <>
                                      <ProgressGlyph status={glyphFor(isActive, completed)} />
                                      <span>{lesson.title}</span>
                                    </>
                                  )}
                                </NavLink>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )
      })}
    </nav>
  )
}

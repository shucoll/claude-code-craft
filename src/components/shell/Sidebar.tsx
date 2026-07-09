import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { curriculum } from '../../content/curriculum'
import { useProgress } from '../../context/ProgressContext'
import { levelIdFromPath, moduleIdFromPath } from '../../lib/curriculumNav'
import { levelPercent } from '../../lib/progressMath'
import { Badge } from '../ui/Badge'
import { ProgressGlyph, type LessonStatus as GlyphStatus } from './ProgressGlyph'

function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn(
        'h-4 w-4 shrink-0 transition-transform duration-150',
        open && 'rotate-90',
        className,
      )}
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

  // Only the active level starts expanded: the level of the lesson the user is on.
  // The landing resolver puts new users on their joined level and returning users on
  // their last lesson, so the route already encodes the right level in both cases.
  const routeLevel = levelIdFromPath(location.pathname)
  const activeLevel = curriculum.some((l) => l.id === routeLevel)
    ? routeLevel
    : (curriculum[0]?.id ?? null)

  // Modules follow the same rule, one level down: the route encodes the module the
  // user was last in, so it expands on reopen without any stored state. Module ids
  // are only unique within a level, so the open-state key is level-qualified.
  const activeModule = useMemo(() => {
    const level = curriculum.find((l) => l.id === activeLevel)
    if (!level) return null
    const routeModule = moduleIdFromPath(location.pathname)
    const mod = level.modules.find((m) => m.id === routeModule) ?? level.modules[0]
    return mod ? `${level.id}/${mod.id}` : null
  }, [activeLevel, location.pathname])

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(curriculum.map((level) => [level.id, level.id === activeLevel])),
  )
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() =>
    activeModule ? { [activeModule]: true } : {},
  )

  // Keep the active level open as the user navigates across levels (e.g. via a
  // cross-link or Continue crossing a boundary) without collapsing ones they opened.
  useEffect(() => {
    if (activeLevel) setOpen((o) => (o[activeLevel] ? o : { ...o, [activeLevel]: true }))
  }, [activeLevel])

  useEffect(() => {
    if (activeModule) setOpenModules((o) => (o[activeModule] ? o : { ...o, [activeModule]: true }))
  }, [activeModule])

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
                    {level.modules.map((mod) => {
                      const modKey = `${level.id}/${mod.id}`
                      const modOpen = Boolean(openModules[modKey])
                      return (
                        <div key={mod.id} className="mt-1">
                          <button
                            type="button"
                            aria-expanded={modOpen}
                            onClick={() => setOpenModules((o) => ({ ...o, [modKey]: !o[modKey] }))}
                            className="flex w-full cursor-pointer items-center gap-1.5 rounded-control px-2 py-1 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <ChevronIcon open={modOpen} className="h-3.5 w-3.5" />
                            <span className="font-mono text-xs uppercase tracking-wide">
                              {mod.title}
                            </span>
                          </button>

                          <AnimatePresence initial={false}>
                            {modOpen && (
                              <motion.div
                                key="lessons"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: reduce ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                                className="overflow-hidden"
                              >
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
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
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

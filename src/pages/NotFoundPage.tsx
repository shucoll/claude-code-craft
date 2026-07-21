import { Link, useLocation } from 'react-router-dom'
import { curriculum } from '../content/curriculum'
import { useLevel } from '../context/LevelContext'
import { cn } from '../lib/cn'
import { resolveLandingPath } from '../lib/landing'
import { getLastLesson, isOnboarded } from '../lib/onboarding'

// The catch-all fallback for unknown routes. Offers a single way back: the visitor's
// last-opened lesson if they've been learning, otherwise the homepage. Destination
// reuses the landing resolver so it stays in sync with how "Continue learning" behaves.
export function NotFoundPage() {
  const { level } = useLevel()
  const { pathname } = useLocation()

  const onboarded = isOnboarded()
  const resolved = resolveLandingPath(curriculum, {
    onboarded,
    level,
    lastLesson: getLastLesson(),
  })
  const hasLesson = Boolean(resolved?.startsWith('/learn/'))
  const target = hasLesson ? resolved! : '/homepage'
  const label = hasLesson ? 'Back to your last lesson' : 'Back to home'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="font-mono text-7xl font-semibold leading-none text-primary sm:text-8xl">404</p>
        <h1 className="font-mono text-2xl font-semibold text-foreground sm:text-3xl">
          This page wandered off
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          There's nothing at this address. Let's get you back on track.
        </p>
      </div>

      <div
        className="w-full max-w-md overflow-hidden rounded-control border-2 border-ink bg-card shadow-hard"
        aria-hidden="true"
      >
        <div className="flex items-center gap-2 border-b-2 border-ink px-4 py-2">
          <span className="h-3 w-3 rounded-full border-2 border-ink bg-primary" />
          <span className="h-3 w-3 rounded-full border-2 border-ink bg-card" />
          <span className="h-3 w-3 rounded-full border-2 border-ink bg-card" />
        </div>
        <div className="overflow-x-auto px-4 py-3 font-mono text-sm">
          <span className="text-muted-foreground">$ open </span>
          <span className="text-foreground">{pathname}</span>
          <br />
          <span className="text-primary">error:</span>
          <span className="text-muted-foreground"> route not found</span>
        </div>
      </div>

      <Link
        to={target}
        className={cn(
          'inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-control px-6',
          'font-sans text-base font-bold select-none',
          'border-2 border-ink bg-primary text-primary-foreground shadow-hard',
          'transition-[transform,box-shadow,background-color] duration-150 ease-[var(--ease-out-soft)]',
          'hover:bg-primary-hover hover:shadow-hard-lg hover:-translate-x-px hover:-translate-y-px',
          'active:shadow-hard-sm active:translate-x-1 active:translate-y-1',
        )}
      >
        {label}
      </Link>
    </div>
  )
}

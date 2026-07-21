import { Link } from 'react-router-dom'
import { curriculum } from '../content/curriculum'
import { useLevel } from '../context/LevelContext'
import { resolveLandingPath } from '../lib/landing'
import { getLastLesson, isOnboarded } from '../lib/onboarding'

// Placeholder homepage. UI is intentionally minimal for now — the CTA reuses the
// shared landing resolver so it routes new visitors into onboarding and returning
// ones back to their lesson. Visual design lands in a later pass.
export function HomePage() {
  const { level } = useLevel()
  const target =
    resolveLandingPath(curriculum, {
      onboarded: isOnboarded(),
      level,
      lastLesson: getLastLesson(),
    }) ?? '/onboarding'

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="font-mono text-3xl font-semibold text-foreground">Claude Code Craft</h1>
      <Link
        to={target}
        className="rounded-control border-2 border-ink bg-primary px-6 py-3 font-mono text-lg font-semibold text-primary-foreground shadow-hard hover:bg-primary-hover"
      >
        Get started
      </Link>
    </main>
  )
}

import { useNavigate } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { useLevel, type LevelId } from '../../context/LevelContext'
import { LEVELS_META } from '../../content/levelsMeta'
import { cn } from '../../lib/cn'
import { flattenLessons, lessonPath } from '../../lib/curriculumNav'
import { isOnboarded } from '../../lib/onboarding'
import { Badge } from '../ui/Badge'

const rowBase = 'flex w-full items-center gap-4 border-b-2 border-ink p-5 last:border-b-0 sm:gap-6 sm:p-6'

/** Ascending difficulty indicator: `filled` of 3 bars lit, each taller than the last. */
function Ramp({ filled }: { filled: number }) {
  const heights = ['h-2.5', 'h-4', 'h-5']
  return (
    <span className="hidden shrink-0 items-end gap-1 sm:flex" aria-hidden="true">
      {heights.map((h, i) => (
        <span key={i} className={cn('w-1.5 rounded-sm', h, i < filled ? 'bg-primary' : 'bg-muted')} />
      ))}
    </span>
  )
}

function LevelNumber({ n }: { n: number }) {
  return (
    <span className="shrink-0 font-mono text-xl font-bold tabular-nums text-primary sm:text-2xl">
      {String(n).padStart(2, '0')}
    </span>
  )
}

export function Pathways() {
  const navigate = useNavigate()
  const { setLevel } = useLevel()

  // Soft entry point per level: pick the level, then drop the visitor where it makes
  // sense - into onboarding's language step for newcomers, or straight to the level's
  // first lesson for someone who's already onboarded.
  const enterLevel = (id: LevelId) => {
    setLevel(id)
    if (!isOnboarded()) {
      navigate('/onboarding/language')
      return
    }
    const loc = flattenLessons(curriculum).find((l) => l.levelId === id)
    navigate(loc ? lessonPath(loc) : '/onboarding/language')
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16">
      <h2 className="mb-3 font-mono text-3xl font-semibold text-foreground">Three pathways</h2>
      <p className="mb-10 max-w-xl text-muted-foreground">
        Each level builds on the last. Start wherever you are - every level's lessons are open to
        everyone.
      </p>

      <div className="overflow-hidden rounded-card border-2 border-ink bg-card shadow-hard">
        {LEVELS_META.map((lvl, i) =>
          lvl.comingSoon ? (
            <div key={lvl.id} className={cn(rowBase, 'opacity-60')}>
              <LevelNumber n={i + 1} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-mono text-lg font-semibold text-card-foreground">
                    {lvl.label}
                  </h3>
                  <Badge tone="neutral">Coming soon</Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {lvl.description}
                </p>
              </div>
              <Ramp filled={i + 1} />
            </div>
          ) : (
            <button
              key={lvl.id}
              type="button"
              onClick={() => enterLevel(lvl.id)}
              className={cn(rowBase, 'cursor-pointer text-left transition-colors hover:bg-muted')}
            >
              <LevelNumber n={i + 1} />
              <div className="flex-1">
                <h3 className="font-mono text-lg font-semibold text-card-foreground">{lvl.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {lvl.description}
                </p>
              </div>
              <Ramp filled={i + 1} />
              <span className="shrink-0 font-mono text-sm font-semibold text-link">
                Start <span aria-hidden="true">→</span>
              </span>
            </button>
          ),
        )}
      </div>
    </section>
  )
}

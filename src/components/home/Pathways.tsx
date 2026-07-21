import { useNavigate } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { useLevel, type LevelId } from '../../context/LevelContext'
import { LEVELS_META } from '../../content/levelsMeta'
import { cn } from '../../lib/cn'
import { flattenLessons, lessonPath } from '../../lib/curriculumNav'
import { isOnboarded } from '../../lib/onboarding'
import { Badge } from '../ui/Badge'

const cardBase =
  'flex flex-col gap-3 rounded-card border-2 border-ink bg-card p-6 text-left shadow-hard'

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
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <h2 className="mb-3 font-mono text-2xl font-semibold text-foreground">Three pathways</h2>
      <p className="mb-10 max-w-xl text-muted-foreground">
        Start wherever you are. Every level's lessons are open to everyone.
      </p>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {LEVELS_META.map((lvl) =>
          lvl.comingSoon ? (
            <div key={lvl.id} className={cn(cardBase, 'opacity-60')}>
              <div className="flex items-center gap-3">
                <h3 className="font-mono text-lg font-semibold text-card-foreground">
                  {lvl.label}
                </h3>
                <Badge tone="neutral">Coming soon</Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{lvl.description}</p>
            </div>
          ) : (
            <button
              key={lvl.id}
              type="button"
              onClick={() => enterLevel(lvl.id)}
              className={cn(
                cardBase,
                'cursor-pointer transition-[transform,box-shadow] duration-150 ease-[var(--ease-out-soft)]',
                'hover:shadow-hard-lg hover:-translate-x-px hover:-translate-y-px',
              )}
            >
              <h3 className="font-mono text-lg font-semibold text-card-foreground">{lvl.label}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{lvl.description}</p>
              <span className="mt-auto pt-2 font-mono text-sm font-semibold text-link">
                Start {lvl.label} →
              </span>
            </button>
          ),
        )}
      </div>
    </section>
  )
}

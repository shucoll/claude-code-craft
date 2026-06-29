import { cn } from '../../lib/cn'
import { curriculum } from '../../content/curriculum'
import { useProgress } from '../../context/ProgressContext'
import { lessonIds, percentComplete } from '../../lib/progressMath'

export function ProgressBar({ className }: { className?: string }) {
  const { progress } = useProgress()
  const pct = percentComplete(lessonIds(curriculum), progress)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-label="Overall progress"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-3 w-32 overflow-hidden rounded-pill border-2 border-ink bg-muted"
      >
        <div
          className="h-full rounded-pill bg-accent transition-[width] duration-300 ease-[var(--ease-out-soft)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  )
}

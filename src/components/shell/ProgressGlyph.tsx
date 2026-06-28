import { cn } from '../../lib/cn'

export type LessonStatus = 'completed' | 'current' | 'unvisited'

const labels: Record<LessonStatus, string> = {
  completed: 'Completed',
  current: 'Current lesson',
  unvisited: 'Not started',
}

export function ProgressGlyph({
  status,
  className,
}: {
  status: LessonStatus
  className?: string
}) {
  return (
    <svg
      role="img"
      aria-label={labels[status]}
      viewBox="0 0 16 16"
      fill="none"
      className={cn('h-4 w-4 shrink-0', className)}
    >
      {status === 'completed' && (
        <>
          <circle cx="8" cy="8" r="7" className="fill-success" />
          <path
            d="M5 8.5l2 2 4-4.5"
            stroke="var(--success-foreground)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {status === 'current' && (
        <>
          <circle cx="8" cy="8" r="7" className="stroke-accent" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="3" className="fill-accent" />
        </>
      )}
      {status === 'unvisited' && (
        <circle cx="8" cy="8" r="6.5" className="stroke-muted-foreground" strokeWidth="1.5" />
      )}
    </svg>
  )
}

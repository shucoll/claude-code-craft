import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/cn'
import type { ChartBarSegment, ChartCard, ChartTone } from '../../content/charts/types'

const TONE: Record<ChartTone, { fill: string; swatch: string; text: string }> = {
  neutral: { fill: 'bg-chart-neutral-bg', swatch: 'bg-chart-neutral-bg border-chart-neutral-border', text: 'text-chart-neutral-text' },
  blue: { fill: 'bg-chart-blue-bg', swatch: 'bg-chart-blue-bg border-chart-blue-border', text: 'text-chart-blue-text' },
  violet: { fill: 'bg-chart-violet-bg', swatch: 'bg-chart-violet-bg border-chart-violet-border', text: 'text-chart-violet-text' },
  amber: { fill: 'bg-chart-amber-bg', swatch: 'bg-chart-amber-bg border-chart-amber-border', text: 'text-chart-amber-text' },
  rose: { fill: 'bg-chart-rose-bg', swatch: 'bg-chart-rose-bg border-chart-rose-border', text: 'text-chart-rose-text' },
  teal: { fill: 'bg-chart-teal-bg', swatch: 'bg-chart-teal-bg border-chart-teal-border', text: 'text-chart-teal-text' },
}

/** Below this share, a segment is too narrow to hold its own percent label. */
const LABEL_MIN_PERCENT = 8

interface BarRow {
  segments: ChartBarSegment[]
  label?: string
  caption?: string
}

interface BarViewProps {
  row: BarRow
  onActivate: (card: ChartCard) => void
}

/**
 * A horizontal stacked bar whose segments are the same activation targets as
 * cards. Segments can be narrow, so every segment is repeated in a legend below
 * the bar: that keeps small slices reachable by mouse and readable at a glance.
 */
export function BarView({ row, onActivate }: BarViewProps) {
  const reduce = useReducedMotion()
  const total = row.segments.reduce((sum, s) => sum + s.percent, 0) || 1

  return (
    <div data-testid="chart-bar-row">
      {row.label && (
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {row.label}
        </p>
      )}

      <div
        role="group"
        aria-label={row.label ?? 'Bar'}
        className="flex h-14 w-full overflow-hidden rounded-card border-2 border-ink shadow-hard"
      >
        {row.segments.map((segment) => {
          const tone = TONE[segment.tone ?? 'neutral']
          const width = (segment.percent / total) * 100
          const interactive = segment.target !== undefined
          const label = `${segment.title}, ${segment.percent}%`
          const shared = cn(
            'flex h-full items-center justify-center overflow-hidden border-r border-ink/20 last:border-r-0',
            tone.fill,
          )
          const text =
            segment.percent >= LABEL_MIN_PERCENT ? (
              <span className={cn('font-mono text-xs font-semibold', tone.text)}>
                {segment.percent}%
              </span>
            ) : null

          if (!interactive) {
            return (
              <div key={segment.id} className={shared} style={{ width: `${width}%` }} aria-label={label}>
                {text}
              </div>
            )
          }

          return (
            <motion.button
              key={segment.id}
              type="button"
              aria-label={label}
              onClick={() => onActivate(segment)}
              style={{ width: `${width}%` }}
              className={cn(
                shared,
                'cursor-pointer transition-opacity hover:opacity-80',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
              )}
              whileHover={reduce ? undefined : { y: -1 }}
            >
              {text}
            </motion.button>
          )
        })}
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {row.segments.map((segment) => {
          const tone = TONE[segment.tone ?? 'neutral']
          const interactive = segment.target !== undefined
          const swatch = (
            <span
              aria-hidden="true"
              className={cn('mt-1 h-3 w-3 shrink-0 rounded-sm border', tone.swatch)}
            />
          )
          const body = (
            <>
              {swatch}
              <span className="min-w-0">
                <span className="font-mono text-sm font-semibold text-foreground">
                  {segment.title}
                </span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {segment.percent}%
                </span>
                {segment.lines?.map((line, i) => (
                  <span key={i} className="block text-sm text-muted-foreground">
                    {line}
                  </span>
                ))}
              </span>
            </>
          )

          return (
            <li key={segment.id}>
              {interactive ? (
                <button
                  type="button"
                  onClick={() => onActivate(segment)}
                  className="flex w-full cursor-pointer items-start gap-2 rounded-control px-2 py-1 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {body}
                </button>
              ) : (
                <div className="flex items-start gap-2 px-2 py-1">{body}</div>
              )}
            </li>
          )
        })}
      </ul>

      {row.caption && <p className="mt-3 text-xs text-muted-foreground">{row.caption}</p>}
    </div>
  )
}

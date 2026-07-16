import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/cn'
import type { ChartCard, ChartTone } from '../../content/charts/types'

const TONE: Record<ChartTone, { surface: string; heading: string }> = {
  neutral: { surface: 'bg-chart-neutral-bg border-chart-neutral-border', heading: 'text-chart-neutral-text' },
  blue: { surface: 'bg-chart-blue-bg border-chart-blue-border', heading: 'text-chart-blue-text' },
  violet: { surface: 'bg-chart-violet-bg border-chart-violet-border', heading: 'text-chart-violet-text' },
  amber: { surface: 'bg-chart-amber-bg border-chart-amber-border', heading: 'text-chart-amber-text' },
  rose: { surface: 'bg-chart-rose-bg border-chart-rose-border', heading: 'text-chart-rose-text' },
  teal: { surface: 'bg-chart-teal-bg border-chart-teal-border', heading: 'text-chart-teal-text' },
}

interface ChartCardViewProps {
  card: ChartCard
  onActivate: (card: ChartCard) => void
}

export function ChartCardView({ card, onActivate }: ChartCardViewProps) {
  const reduce = useReducedMotion()
  const tone = TONE[card.tone ?? 'neutral']
  const interactive = card.target !== undefined

  const body = (
    <>
      <h3 className={cn('break-words font-mono text-lg font-bold', tone.heading)}>{card.title}</h3>
      {card.lines?.map((line, i) => (
        <p key={i} className="mt-1 text-sm text-muted-foreground">
          {line}
        </p>
      ))}
    </>
  )

  // min-w-0: as a grid item, the card's default `min-width: auto` would size its
  // track to the title's min-content width, so a long unbroken title (a permission
  // rule, an MCP tool name) would push past the card. Paired with `break-words` on
  // the heading, long titles wrap inside the card instead of escaping it.
  const surface = cn('block w-full min-w-0 rounded-card border-2 p-4 text-left shadow-hard', tone.surface)
  const entrance = {
    initial: reduce ? false : { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: reduce ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] as const },
  }

  if (!interactive) {
    return (
      <motion.div className={surface} {...entrance}>
        {body}
      </motion.div>
    )
  }

  return (
    <motion.button
      type="button"
      aria-label={card.title}
      onClick={() => onActivate(card)}
      className={cn(
        surface,
        'cursor-pointer transition-shadow hover:shadow-hard-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
      whileHover={reduce ? undefined : { x: -1, y: -1 }}
      {...entrance}
    >
      {body}
    </motion.button>
  )
}

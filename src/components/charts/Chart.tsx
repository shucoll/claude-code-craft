import { cn } from '../../lib/cn'
import type { ChartCard, ChartDef } from '../../content/charts/types'
import { ChartCardView } from './ChartCardView'
import { FlowView } from './FlowView'
import { GuidedFlow } from './GuidedFlow'

const COLS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
}

function DownArrow() {
  return (
    <div data-testid="chart-arrow" className="flex justify-center py-2" aria-hidden="true">
      <svg viewBox="0 0 16 16" className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v10M4 9l4 4 4-4" />
      </svg>
    </div>
  )
}

interface ChartProps {
  def: ChartDef
  onActivate: (card: ChartCard) => void
}

export function Chart({ def, onActivate }: ChartProps) {
  return (
    <div role="group" aria-label={def.title ?? 'Diagram'} className="w-full max-w-2xl">
      {(def.title || def.subtitle) && (
        <header className="mb-6 text-center">
          {def.title && <h2 className="font-mono text-xl font-bold text-foreground">{def.title}</h2>}
          {def.subtitle && <p className="mt-1 text-sm text-muted-foreground">{def.subtitle}</p>}
        </header>
      )}

      {def.rows.map((row, i) => (
        <div key={i}>
          {i > 0 && <DownArrow />}
          {row.kind === 'connector' ? (
            <div className="flex justify-center">
              <div className="rounded-pill border-2 border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
                {row.label}
              </div>
            </div>
          ) : row.kind === 'flow' ? (
            row.guided ? (
              <GuidedFlow row={row} onActivate={onActivate} />
            ) : (
              <FlowView row={row} onActivate={onActivate} />
            )
          ) : (
            <div
              data-testid="chart-cards-row"
              className={cn('grid grid-cols-1 gap-4', COLS[row.cards.length] ?? 'sm:grid-cols-1')}
            >
              {row.cards.map((card) => (
                <ChartCardView key={card.id} card={card} onActivate={onActivate} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

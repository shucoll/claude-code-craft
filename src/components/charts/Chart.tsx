import { cn } from '../../lib/cn'
import type { ChartCard, ChartDef } from '../../content/charts/types'
import { BarView } from './BarView'
import { ChartCardView } from './ChartCardView'
import { FlowView } from './FlowView'
import { GridView } from './GridView'
import { GuidedFlow } from './GuidedFlow'
import { LedgerView } from './LedgerView'

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
          {/* Grid rows are reference material, not a sequence, so they are never joined
              to a neighbour by a flow arrow. They still need the vertical rhythm the
              arrow used to provide: cards carry a hard shadow offset downwards, which
              would otherwise land on the next row's label. */}
          {i > 0 &&
            (row.kind === 'grid' || def.rows[i - 1].kind === 'grid' ? (
              <div data-testid="chart-row-gap" className="h-8" aria-hidden="true" />
            ) : (
              <DownArrow />
            ))}
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
          ) : row.kind === 'bar' ? (
            <BarView row={row} onActivate={onActivate} />
          ) : row.kind === 'ledger' ? (
            <LedgerView row={row} onActivate={onActivate} />
          ) : row.kind === 'grid' ? (
            <GridView row={row} onActivate={onActivate} />
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

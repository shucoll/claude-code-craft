import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChartCard, ChartRow, FlowNode } from '../../content/charts/types'
import { ChartCardView } from './ChartCardView'
import { layoutFlow, NODE_WIDTH, type FlowLayout, type NodeSize } from './flowLayout'

type FlowRow = Extract<ChartRow, { kind: 'flow' }>

/** Widest the diagram may render, regardless of how much room the page has. */
const MAX_WIDTH = 1344
/** Breathing room kept between the diagram and the edges of the content region. */
const GUTTER = 32

interface FlowViewProps {
  row: FlowRow
  onActivate: (card: ChartCard) => void
}

function nodeToCard(node: FlowNode): ChartCard {
  return { id: node.id, title: node.title, lines: node.lines, tone: node.tone, target: node.target }
}

export function FlowView({ row, onActivate }: FlowViewProps) {
  const [sizes, setSizes] = useState<Map<string, NodeSize> | null>(null)
  const [layout, setLayout] = useState<FlowLayout | null>(null)
  const [scale, setScale] = useState(1)
  const measureRefs = useRef(new Map<string, HTMLDivElement>())
  const containerRef = useRef<HTMLDivElement>(null)

  // Re-run measurement + layout when the chart data changes (not on mount).
  const [prevRow, setPrevRow] = useState(row)
  if (row !== prevRow) {
    setPrevRow(row)
    setSizes(null)
    setLayout(null)
  }

  // Pass 1: measure the real rendered height of each node (width is fixed to
  // NODE_WIDTH, so text wraps identically to the positioned pass).
  useLayoutEffect(() => {
    if (sizes) return
    const next = new Map<string, NodeSize>()
    for (const node of row.nodes) {
      const el = measureRefs.current.get(node.id)
      next.set(node.id, { width: NODE_WIDTH, height: el?.offsetHeight ?? 0 })
    }
    setSizes(next)
  }, [row, sizes])

  // Pass 2: dagre layout using the measured sizes.
  useEffect(() => {
    if (!sizes) return
    let alive = true
    layoutFlow(row.nodes, row.edges, row.direction, sizes).then((next) => {
      if (alive) setLayout(next)
    })
    return () => {
      alive = false
    }
  }, [row, sizes])

  // Fit-to-width: the graph is wider than the prose column, so it is allowed to
  // spill past the column and is scaled to fit the *content region* — the
  // scrollable <main>, whose width already excludes the sidebar. Measuring that
  // (rather than the column or the viewport) is what keeps the diagram centered
  // and fully visible whether or not the sidebar is open. The scaled graph is
  // centered on the column's axis, which is the content region's axis too.
  useLayoutEffect(() => {
    if (!layout) return
    const el = containerRef.current
    if (!el) return
    // The nearest scroll container is <main>; fall back to the column itself.
    const region = el.closest('main') ?? el
    const fit = () => {
      const avail = Math.min(MAX_WIDTH, region.clientWidth - GUTTER)
      setScale(avail > 0 && layout.width > avail ? avail / layout.width : 1)
    }
    fit()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(fit)
    ro.observe(region)
    return () => ro.disconnect()
  }, [layout])

  // Phase 1 — nodes must be in the DOM (off-screen) so their height can be read.
  if (!sizes) {
    return (
      <div ref={containerRef} className="w-full">
        <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] top-0 opacity-0">
          {row.nodes.map((node) => (
            <div
              key={node.id}
              ref={(el) => {
                if (el) measureRefs.current.set(node.id, el)
                else measureRefs.current.delete(node.id)
              }}
              style={{ width: NODE_WIDTH }}
            >
              <ChartCardView card={nodeToCard(node)} onActivate={() => {}} />
            </div>
          ))}
        </div>
        <div data-testid="flow-loading" className="py-8 text-center text-sm text-muted-foreground">
          Loading diagram…
        </div>
      </div>
    )
  }

  // Phase 2 — measured, awaiting async layout.
  if (!layout) {
    return (
      <div ref={containerRef} className="w-full">
        <div data-testid="flow-loading" className="py-8 text-center text-sm text-muted-foreground">
          Loading diagram…
        </div>
      </div>
    )
  }

  // Phase 3 — positioned render.
  const titleById = new Map(row.nodes.map((n) => [n.id, n.title]))

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Flowchart"
      className="relative w-full"
      style={{ height: layout.height * scale }}
    >
      {/* The scaled graph is often wider than this column; it is taken out of
          flow and centered on the column's axis so it spills evenly on both
          sides without ever forcing a horizontal scroll. */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{ width: layout.width * scale, height: layout.height * scale }}
      >
        <div
          className="relative origin-top-left"
          style={{ width: layout.width, height: layout.height, transform: `scale(${scale})` }}
        >
          <svg
            className="pointer-events-none absolute inset-0 text-border"
            width={layout.width}
            height={layout.height}
            aria-hidden="true"
          >
            <defs>
              <marker
                id="flow-arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0 0L10 5L0 10z" fill="currentColor" />
              </marker>
            </defs>
            {layout.edges.map((pe, i) => (
              <polyline
                key={i}
                points={pe.points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                markerEnd="url(#flow-arrow)"
              />
            ))}
          </svg>

          {layout.edges.map((pe, i) =>
            pe.edge.label && pe.labelPoint ? (
              <div
                key={`label-${i}`}
                aria-hidden="true"
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                style={{ left: pe.labelPoint.x, top: pe.labelPoint.y }}
              >
                {pe.edge.label}
              </div>
            ) : null,
          )}

          {layout.nodes.map((pn) => (
            <div
              key={pn.node.id}
              className="absolute"
              style={{ left: pn.x, top: pn.y, width: pn.width, height: pn.height }}
            >
              <ChartCardView card={nodeToCard(pn.node)} onActivate={onActivate} />
            </div>
          ))}
        </div>
      </div>

      <ul className="sr-only">
        {layout.edges.map((pe, i) => (
          <li key={i}>
            {`${titleById.get(pe.edge.from)} → ${titleById.get(pe.edge.to)}${
              pe.edge.label ? ` (${pe.edge.label})` : ''
            }`}
          </li>
        ))}
      </ul>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { ChartCard, ChartRow, FlowEdge, FlowNode } from '../../content/charts/types'
import { ChartCardView } from './ChartCardView'
import { FlowView } from './FlowView'
import { Button } from '../ui/Button'
import { findRoot, isLeaf, optionsAt, pathSummary } from './flowTraversal'

type FlowRow = Extract<ChartRow, { kind: 'flow' }>

interface GuidedFlowProps {
  row: FlowRow
  onActivate: (card: ChartCard) => void
}

function nodeToCard(node: FlowNode): ChartCard {
  return { id: node.id, title: node.title, lines: node.lines, tone: node.tone, target: node.target }
}

export function GuidedFlow({ row, onActivate }: GuidedFlowProps) {
  const root = findRoot(row.nodes, row.edges)
  const [mode, setMode] = useState<'guided' | 'explore'>('guided')
  const [currentId, setCurrentId] = useState(root.id)
  const [steps, setSteps] = useState<FlowEdge[]>([])

  // Restart traversal when the chart data changes (set-state-during-render, not a mount effect).
  const [prevRow, setPrevRow] = useState(row)
  if (row !== prevRow) {
    setPrevRow(row)
    setMode('guided')
    setCurrentId(root.id)
    setSteps([])
  }

  // Move focus to the question heading after the learner advances (never on initial mount,
  // so an embedded diagram doesn't steal focus while scrolling past it).
  const headingRef = useRef<HTMLHeadingElement>(null)
  const leafRef = useRef<HTMLDivElement>(null)
  const advancedRef = useRef(false)
  useEffect(() => {
    if (advancedRef.current) {
      ;(headingRef.current ?? leafRef.current)?.focus()
      advancedRef.current = false
    }
  }, [currentId])

  const byId = new Map(row.nodes.map((n) => [n.id, n]))
  const current = byId.get(currentId) ?? root

  const pick = (edge: FlowEdge) => {
    advancedRef.current = true
    setSteps((s) => [...s, edge])
    setCurrentId(edge.to)
  }

  const restart = () => {
    advancedRef.current = true
    setCurrentId(root.id)
    setSteps([])
  }

  return (
    <div role="group" aria-label="Decision tree" className="w-full">
      <div className="mb-4 flex justify-center gap-2">
        <Button
          size="sm"
          variant={mode === 'guided' ? 'primary' : 'ghost'}
          aria-pressed={mode === 'guided'}
          onClick={() => setMode('guided')}
        >
          Guided
        </Button>
        <Button
          size="sm"
          variant={mode === 'explore' ? 'primary' : 'ghost'}
          aria-pressed={mode === 'explore'}
          onClick={() => setMode('explore')}
        >
          Explore
        </Button>
      </div>

      {mode === 'explore' ? (
        <FlowView row={row} onActivate={onActivate} />
      ) : isLeaf(current, row.edges) ? (
        <div ref={leafRef} tabIndex={-1} className="mx-auto max-w-md space-y-4 focus:outline-none">
          <ChartCardView card={nodeToCard(current)} onActivate={onActivate} />
          {steps.length > 0 && (
            <p className="text-sm text-muted-foreground">
              You said: {pathSummary(steps).join(' → ')} →{' '}
              <span className="font-bold text-foreground">{current.title}</span>
            </p>
          )}
          <Button size="sm" variant="secondary" onClick={restart}>
            Start over
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-md space-y-4">
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="text-center font-mono text-lg font-bold text-foreground focus:outline-none"
          >
            {current.title}
          </h3>
          <div className="flex flex-col gap-3">
            {optionsAt(current.id, row.edges).map((edge, i) => (
              <Button key={i} variant="secondary" onClick={() => pick(edge)}>
                {edge.label ?? 'Continue'}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

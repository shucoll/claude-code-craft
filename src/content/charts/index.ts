import { agenticLoopDiagram } from './agentic-loop-diagram'
import { clearCompactNewTree } from './clear-compact-new-tree'
import { demo } from './demo'
import type { ChartDef } from './types'

const charts: Record<string, ChartDef> = {
  [demo.id]: demo,
  [agenticLoopDiagram.id]: agenticLoopDiagram,
  [clearCompactNewTree.id]: clearCompactNewTree,
}

export const registeredChartIds: string[] = Object.keys(charts)

export function getChart(id: string): ChartDef | undefined {
  return charts[id]
}

export type {
  ChartDef,
  ChartCard,
  ChartRow,
  ChartTone,
  ChartTarget,
  PopupTarget,
  LessonRef,
  FlowNode,
  FlowEdge,
  FlowDirection,
  FlowNodeRole,
} from './types'

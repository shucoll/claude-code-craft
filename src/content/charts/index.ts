import { agenticLoopDiagram } from './agentic-loop-diagram'
import { beginnerWorkflowMap } from './beginner-workflow-map'
import { claudeCodeSystemMap } from './claude-code-system-map'
import { clearCompactNewTree } from './clear-compact-new-tree'
import { commandBeltReference } from './command-belt-reference'
import { contextCostLedger } from './context-cost-ledger'
import { contextWindowSimulator } from './context-window-simulator'
import { demo } from './demo'
import { dotClaudeDirectoryMap } from './dot-claude-directory-map'
import { hookLifecycleClickable } from './hook-lifecycle-clickable'
import { intermediateStackMap } from './intermediate-stack-map'
import { mechanismDecisionTree } from './mechanism-decision-tree'
import { permissionRuleShapes } from './permission-rule-shapes'
import { toolBeltMap } from './tool-belt-map'
import type { ChartDef } from './types'

const charts: Record<string, ChartDef> = {
  [demo.id]: demo,
  [agenticLoopDiagram.id]: agenticLoopDiagram,
  [beginnerWorkflowMap.id]: beginnerWorkflowMap,
  [clearCompactNewTree.id]: clearCompactNewTree,
  [contextWindowSimulator.id]: contextWindowSimulator,
  [contextCostLedger.id]: contextCostLedger,
  [commandBeltReference.id]: commandBeltReference,
  [toolBeltMap.id]: toolBeltMap,
  [intermediateStackMap.id]: intermediateStackMap,
  [permissionRuleShapes.id]: permissionRuleShapes,
  [dotClaudeDirectoryMap.id]: dotClaudeDirectoryMap,
  [hookLifecycleClickable.id]: hookLifecycleClickable,
  [claudeCodeSystemMap.id]: claudeCodeSystemMap,
  [mechanismDecisionTree.id]: mechanismDecisionTree,
}

export const registeredChartIds: string[] = Object.keys(charts)

export function getChart(id: string): ChartDef | undefined {
  return charts[id]
}

export type {
  ChartDef,
  ChartCard,
  ChartBarSegment,
  LedgerEntry,
  ChartRow,
  GridColumns,
  ChartTone,
  ChartTarget,
  PopupTarget,
  LessonRef,
  FlowNode,
  FlowEdge,
  FlowDirection,
  FlowNodeRole,
} from './types'

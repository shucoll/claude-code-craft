import type { ComponentType } from 'react'

/** Reference to an existing curriculum lesson (validated against curriculum.ts). */
export interface LessonRef {
  level: string
  module: string
  lesson: string
  /**
   * Optional heading id to scroll to inside the lesson, so a chart entry can land
   * on the section that introduces it rather than the top of the page. Must match a
   * heading's `rehype-slug` id; `index.test.ts` checks every anchor against the
   * lesson's real headings.
   */
  anchor?: string
}

export type ChartTarget =
  | { kind: 'lesson'; ref: LessonRef }
  | { kind: 'popup'; title?: string; content: () => Promise<{ default: ComponentType }> }

export type PopupTarget = Extract<ChartTarget, { kind: 'popup' }>

export type ChartTone = 'neutral' | 'blue' | 'violet' | 'amber' | 'rose' | 'teal'

export interface ChartCard {
  id: string
  title: string
  /** Muted description lines, e.g. "operator · the turn". */
  lines?: string[]
  /** Defaults to 'neutral'. */
  tone?: ChartTone
  /** Omitted => a plain, non-interactive card. */
  target?: ChartTarget
}

/**
 * One slice of a `bar` row. Structurally a `ChartCard` (so it activates through
 * the same lesson/popup targets) plus the share of the bar it occupies.
 */
export interface ChartBarSegment extends ChartCard {
  /** Relative share of the bar. Widths are normalized against the row's total. */
  percent: number
}

/**
 * One line of a `ledger` row: a feature and what it costs. Structurally a
 * `ChartCard` (so it activates through the same lesson/popup targets) plus an
 * absolute token cost. Unlike `ChartBarSegment.percent`, `tokens` survives a
 * feature being toggled off, which is what makes the Phase 2 simulator a
 * rendering change rather than a data rewrite.
 */
export interface LedgerEntry extends ChartCard {
  /** Absolute cost. The source of truth; shares are derived. */
  tokens: number
  /** Fixed overhead (CLAUDE.md) vs optional (an MCP server). Defaults to false. */
  toggleable?: boolean
  /** Initial state for a toggleable entry. Defaults to true. */
  defaultOn?: boolean
}

export type FlowNodeRole = 'default' | 'question' | 'leaf'

export interface FlowNode {
  id: string
  title: string
  /** Muted description lines. */
  lines?: string[]
  /** Defaults to 'neutral'. */
  tone?: ChartTone
  /** Omitted => a plain, non-interactive node. */
  target?: ChartTarget
  /**
   * Traversal-state hint for Phase 2 guided decision trees (spec §8):
   * 'question' = a branch point whose outgoing edges are the answer options;
   * 'leaf' = a recommendation terminus. Defaults to 'default'.
   */
  role?: FlowNodeRole
}

export interface FlowEdge {
  from: string
  to: string
  /** e.g. "yes" / "no" / an option label. */
  label?: string
}

export type FlowDirection = 'TB' | 'LR'

export type GridColumns = 2 | 3 | 4

export type ChartRow =
  | { kind: 'cards'; cards: ChartCard[] }
  | { kind: 'connector'; label: string }
  | { kind: 'flow'; nodes: FlowNode[]; edges: FlowEdge[]; direction?: FlowDirection; guided?: boolean }
  | { kind: 'bar'; segments: ChartBarSegment[]; label?: string; caption?: string }
  | { kind: 'grid'; items: ChartCard[]; label?: string; columns?: GridColumns; caption?: string }
  | { kind: 'ledger'; entries: LedgerEntry[]; windowTokens: number; label?: string; caption?: string }

export interface ChartDef {
  id: string
  title?: string
  subtitle?: string
  rows: ChartRow[]
}

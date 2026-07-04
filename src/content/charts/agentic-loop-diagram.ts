import type { ChartDef } from './types'

/** Loop dogfood: gather → act → verify → (repeat). Proves cycle layout. */
export const agenticLoopDiagram: ChartDef = {
  id: 'agentic-loop-diagram',
  title: 'The agentic loop',
  subtitle: 'gather context → take action → verify, then repeat',
  rows: [
    {
      kind: 'flow',
      direction: 'LR',
      nodes: [
        { id: 'gather', title: 'Gather context', lines: ['read files, search the repo'], tone: 'blue' },
        { id: 'act', title: 'Take action', lines: ['edit code, run commands'], tone: 'violet' },
        { id: 'verify', title: 'Verify', lines: ['run tests, review the diff'], tone: 'teal' },
      ],
      edges: [
        { from: 'gather', to: 'act' },
        { from: 'act', to: 'verify' },
        { from: 'verify', to: 'gather', label: 'repeat' },
      ],
    },
  ],
}

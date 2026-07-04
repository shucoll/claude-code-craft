import type { ChartDef } from './types'

/**
 * Decision-tree dogfood (static Phase 1 fallback of the B2.4 resolver).
 * Question node + labeled option edges + leaves that link or pop up.
 */
export const clearCompactNewTree: ChartDef = {
  id: 'clear-compact-new-tree',
  title: 'Clear, compact, or start new?',
  subtitle: 'When your session gets long or goes sideways',
  rows: [
    {
      kind: 'flow',
      direction: 'TB',
      nodes: [
        { id: 'q', title: 'What is going on?', role: 'question' },
        {
          id: 'clear',
          title: '/clear',
          role: 'leaf',
          tone: 'blue',
          lines: ['Wipe context, keep the session'],
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } },
        },
        {
          id: 'compact',
          title: '/compact',
          role: 'leaf',
          tone: 'violet',
          lines: ['Summarize, keep decisions'],
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'review-changes' } },
        },
        {
          id: 'new',
          title: 'Start a new session',
          role: 'leaf',
          tone: 'amber',
          lines: ['Fresh context window'],
          target: { kind: 'popup', title: 'Start new', content: () => import('./popups/start-new.mdx') },
        },
      ],
      edges: [
        { from: 'q', to: 'clear', label: 'context is irrelevant' },
        { from: 'q', to: 'compact', label: 'just getting long' },
        { from: 'q', to: 'new', label: 'something broke' },
      ],
    },
  ],
}

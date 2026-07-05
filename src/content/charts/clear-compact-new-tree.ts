import type { ChartDef } from './types'

/**
 * Guided decision-tree dogfood (static Phase 1 fallback of the B2.4 resolver).
 * Two-level guided tree with labeled edges and leaves that link or pop up.
 */
export const clearCompactNewTree: ChartDef = {
  id: 'clear-compact-new-tree',
  title: 'Clear, compact, or start new?',
  subtitle: 'When your session gets long or goes sideways',
  rows: [
    {
      kind: 'flow',
      direction: 'TB',
      guided: true,
      nodes: [
        { id: 'q1', title: 'Are you mid-task?', role: 'question' },
        { id: 'q2', title: 'How is the context holding up?', role: 'question' },
        {
          id: 'compact',
          title: '/compact',
          role: 'leaf',
          tone: 'violet',
          lines: ['Summarize, keep decisions'],
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'review-changes' } },
        },
        {
          id: 'clear',
          title: '/clear',
          role: 'leaf',
          tone: 'blue',
          lines: ['Wipe context, keep the session'],
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } },
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
        { from: 'q1', to: 'q2', label: 'yes, still going' },
        { from: 'q1', to: 'new', label: 'no, starting fresh' },
        { from: 'q2', to: 'compact', label: 'just getting long' },
        { from: 'q2', to: 'clear', label: 'no longer relevant' },
      ],
    },
  ],
}

import type { ChartDef } from './types'

/**
 * The B2.4 resolver as a guided decision tree. Three questions, four leaves, in
 * the order the decision actually gets made: rule out "undo" first (the option
 * beginners forget), then relevance, then whether the setup itself must change.
 */
export const clearCompactNewTree: ChartDef = {
  id: 'clear-compact-new-tree',
  title: 'Clear, compact, rewind, or start new?',
  subtitle: 'When your session gets long or goes sideways',
  rows: [
    {
      kind: 'flow',
      direction: 'TB',
      guided: true,
      nodes: [
        { id: 'q1', title: 'Do you want to undo what Claude just did?', role: 'question' },
        {
          id: 'q2',
          title: 'Is this conversation still relevant to what you do next?',
          role: 'question',
        },
        { id: 'q3', title: 'Same project, same setup?', role: 'question' },
        {
          id: 'rewind',
          title: '/rewind',
          role: 'leaf',
          tone: 'teal',
          lines: [
            'You do not want a reset, you want the last change gone.',
            'Restores code, conversation, or both.',
          ],
          target: {
            kind: 'lesson',
            ref: {
              level: 'beginner',
              module: 'teaching-claude-your-project',
              lesson: 'checkpoints-your-undo-button',
            },
          },
        },
        {
          id: 'compact',
          title: '/compact',
          role: 'leaf',
          tone: 'violet',
          lines: [
            'The conversation still matters, it is just long.',
            'Summarizes it and keeps you working.',
          ],
          target: {
            kind: 'lesson',
            ref: {
              level: 'beginner',
              module: 'sessions-and-context',
              lesson: 'the-context-window',
              anchor: 'when-the-window-fills',
            },
          },
        },
        {
          id: 'clear',
          title: '/clear',
          role: 'leaf',
          tone: 'blue',
          lines: [
            'New task, same project. Empty context.',
            'The old conversation is saved and resumable.',
          ],
          target: {
            kind: 'lesson',
            ref: {
              level: 'beginner',
              module: 'sessions-and-context',
              lesson: 'sessions-resume-name-branch',
            },
          },
        },
        {
          id: 'new',
          title: 'Start a new session',
          role: 'leaf',
          tone: 'amber',
          lines: ['A different project, or a clean slate for your setup too.'],
          target: {
            kind: 'popup',
            title: 'Start a new session',
            content: () => import('./popups/start-new.mdx'),
          },
        },
      ],
      edges: [
        { from: 'q1', to: 'rewind', label: 'yes, undo it' },
        { from: 'q1', to: 'q2', label: 'no, the code is fine' },
        { from: 'q2', to: 'compact', label: 'yes, it is just getting long' },
        { from: 'q2', to: 'q3', label: 'no, I am switching tasks' },
        { from: 'q3', to: 'clear', label: 'yes, same repo' },
        { from: 'q3', to: 'new', label: 'no, different project' },
      ],
    },
  ],
}

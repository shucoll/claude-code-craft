import type { ChartDef } from './types'

/**
 * Phase 1 rendering of the `context-window-simulator` spec: a labelled snapshot
 * of a filled context bar with a popup per segment, plus the same bar after
 * compaction. The id is the one the Phase 2 simulator will claim, so the lesson
 * embed and chart data survive that upgrade unchanged.
 */
export const contextWindowSimulator: ChartDef = {
  id: 'context-window-simulator',
  title: 'What fills a context window',
  subtitle: 'Representative proportions, not exact token counts. Click any segment.',
  rows: [
    {
      kind: 'bar',
      label: 'Partway through a working session',
      segments: [
        {
          id: 'startup',
          title: 'Startup',
          percent: 5,
          tone: 'blue',
          lines: ['Loaded before you type a word'],
          target: {
            kind: 'popup',
            title: 'Startup',
            content: () => import('./popups/context-startup.mdx'),
          },
        },
        {
          id: 'conversation',
          title: 'The conversation',
          percent: 16,
          tone: 'teal',
          lines: ['Your prompts and Claude’s replies'],
          target: {
            kind: 'popup',
            title: 'The conversation',
            content: () => import('./popups/context-conversation.mdx'),
          },
        },
        {
          id: 'file-reads',
          title: 'File reads',
          percent: 30,
          tone: 'violet',
          lines: ['Every file Claude opened, in full'],
          target: {
            kind: 'popup',
            title: 'File reads',
            content: () => import('./popups/context-file-reads.mdx'),
          },
        },
        {
          id: 'tool-output',
          title: 'Tool output',
          percent: 24,
          tone: 'amber',
          lines: ['Test runs, searches, command output'],
          target: {
            kind: 'popup',
            title: 'Tool output',
            content: () => import('./popups/context-tool-output.mdx'),
          },
        },
        {
          id: 'free-before',
          title: 'Free space',
          percent: 25,
          tone: 'neutral',
          lines: ['What is left to work with'],
        },
      ],
    },
    { kind: 'connector', label: 'the window fills → compaction fires' },
    {
      kind: 'bar',
      label: 'Immediately after compaction',
      segments: [
        {
          id: 'startup-after',
          title: 'Startup, reloaded',
          percent: 5,
          tone: 'blue',
          lines: ['Reloads automatically, minus skill descriptions'],
        },
        {
          id: 'summary',
          title: 'Conversation summary',
          percent: 6,
          tone: 'teal',
          lines: ['Everything above, compressed'],
          target: {
            kind: 'popup',
            title: 'Conversation summary',
            content: () => import('./popups/context-summary.mdx'),
          },
        },
        {
          id: 'free-after',
          title: 'Free space',
          percent: 89,
          tone: 'neutral',
          lines: ['Room to keep working'],
        },
      ],
      caption:
        'File reads and tool output are gone: they were the bulk of the window, and they are the first thing compaction discards.',
    },
  ],
}

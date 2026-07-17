import type { ChartDef } from './types'

/**
 * Phase 1 rendering of the `context-cost-ledger` spec: what a session loads
 * before the first prompt, broken down by feature, then measured against the
 * window. The id is the one the Phase 2 simulator will claim, and `tokens` is
 * the data it needs, so the lesson embed and chart data survive that upgrade
 * unchanged.
 *
 * Token costs are the official docs' own figures, from the interactive
 * simulation embedded in code.claude.com/docs/en/context-window (verified
 * 2026-07-16). They are illustrative there and illustrative here.
 *
 * The ledger row deliberately omits `windowTokens`: startup is ~7,850 tokens of
 * a 200k window, so a window-relative breakdown rounds five of the seven entries
 * to 0% and shows nothing. The breakdown answers "what makes up startup"; the
 * bar row below it answers "what does startup cost you", which is the honest
 * counterweight and the reason both rows exist.
 */
export const contextCostLedger: ChartDef = {
  id: 'context-cost-ledger',
  title: 'What loads before you type',
  subtitle: 'Representative token counts, not exact. Click any line.',
  rows: [
    {
      kind: 'ledger',
      label: 'A session’s startup, broken down',
      entries: [
        {
          id: 'system-prompt',
          title: 'System prompt',
          tokens: 4200,
          tone: 'neutral',
          lines: ['4,200 tokens · you never see it, and you cannot edit it'],
          target: {
            kind: 'popup',
            title: 'System prompt',
            content: () => import('./popups/startup-system-prompt.mdx'),
          },
        },
        {
          id: 'project-claude-md',
          title: 'Project CLAUDE.md',
          tokens: 1800,
          tone: 'blue',
          lines: ['1,800 tokens · the biggest line item you control'],
          target: {
            kind: 'popup',
            title: 'Project CLAUDE.md',
            content: () => import('./popups/startup-project-claude-md.mdx'),
          },
        },
        {
          id: 'auto-memory',
          title: 'Auto memory',
          tokens: 680,
          tone: 'amber',
          lines: ['680 tokens · what Claude wrote to itself last session'],
          target: {
            kind: 'popup',
            title: 'Auto memory',
            content: () => import('./popups/startup-auto-memory.mdx'),
          },
        },
        {
          id: 'skill-descriptions',
          title: 'Skill descriptions',
          tokens: 450,
          tone: 'violet',
          toggleable: true,
          lines: ['450 tokens · one line each, not the skills themselves'],
          target: {
            kind: 'popup',
            title: 'Skill descriptions',
            content: () => import('./popups/startup-skill-descriptions.mdx'),
          },
        },
        {
          id: 'user-claude-md',
          title: '~/.claude/CLAUDE.md',
          tokens: 320,
          tone: 'blue',
          lines: ['320 tokens · your preferences, in every project'],
        },
        {
          id: 'environment',
          title: 'Environment info',
          tokens: 280,
          tone: 'neutral',
          lines: ['280 tokens · cwd, platform, shell, git state'],
        },
        {
          id: 'mcp-tools',
          title: 'MCP tool names',
          tokens: 120,
          tone: 'teal',
          toggleable: true,
          lines: ['120 tokens · names only; schemas load on demand'],
          target: {
            kind: 'popup',
            title: 'MCP tool names',
            content: () => import('./popups/startup-mcp-tools.mdx'),
          },
        },
      ],
      caption:
        'Two thirds of startup is the system prompt and CLAUDE.md. Skills and MCP servers, the two features learners worry about most, are the two smallest lines on the board.',
    },
    { kind: 'connector', label: 'all of it, against the window' },
    {
      kind: 'bar',
      label: 'A 200,000-token window',
      segments: [
        {
          id: 'startup-total',
          title: 'Startup',
          percent: 4,
          tone: 'blue',
          lines: ['7,850 tokens · everything above, every session'],
        },
        {
          id: 'file-reads',
          title: 'Four file reads',
          percent: 3,
          tone: 'violet',
          lines: ['6,900 tokens · one bug investigation'],
        },
        {
          id: 'free',
          title: 'Free space',
          percent: 93,
          tone: 'neutral',
          lines: ['185,250 tokens · what you have left'],
        },
      ],
      caption:
        'Startup is not expensive. Four files cost nearly as much as all of it. What makes startup worth auditing is that you pay it in every session, and it is the part you chose.',
    },
  ],
}

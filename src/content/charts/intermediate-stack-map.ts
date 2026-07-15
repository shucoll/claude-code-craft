import type { ChartDef, LessonRef } from './types'

const lesson = (ref: LessonRef) => ({ kind: 'lesson' as const, ref })

const I1_1: LessonRef = {
  level: 'intermediate',
  module: 'tools-permissions-settings',
  lesson: 'the-built-in-tool-belt',
}

/**
 * The itinerary for Level 2: one layer per module, foundation at the bottom of
 * the reading order and the guided project at the top. The mechanical
 * counterpart is I7.3's `claude-code-system-map`, which returns at level's end
 * to show how these same pieces interlock at runtime.
 *
 * Each node should link to its module's home lesson. Only I1 exists today; wire
 * the rest as each module is authored:
 *   I2 -> intermediate/context-engineering/what-loads-at-startup
 *   I3 -> intermediate/skills/skills-teachable-procedures
 *   I4 -> intermediate/hooks/hooks-deterministic-automation
 *   I5 -> intermediate/mcp-servers/mcp-giving-claude-new-tools
 *   I6 -> intermediate/subagents/subagents-context-isolation-and-delegation
 *   I7 -> intermediate/plugins-and-integration/plugins-and-marketplaces
 *   I8 -> intermediate/guided-project-pulseboard/environment-first
 */
export const intermediateStackMap: ChartDef = {
  id: 'intermediate-stack-map',
  title: 'The Intermediate stack',
  subtitle: 'Top to bottom, in learning order: foundation first, the four mechanisms in any order, then package and ship.',
  rows: [
    {
      kind: 'cards',
      cards: [
        {
          id: 'i1',
          title: 'I1 · Tools, Permissions, Settings',
          lines: ['The substrate: what Claude can do, and what you allow'],
          tone: 'blue',
          target: lesson(I1_1),
        },
      ],
    },
    { kind: 'connector', label: 'I1 and I2 first: every other module builds on them' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'i2',
          title: 'I2 · Context Engineering',
          lines: ['Context as a budget: what loads at startup, and what it costs'],
          tone: 'blue',
        },
      ],
    },
    { kind: 'connector', label: 'then the four extension mechanisms, in any order' },
    {
      kind: 'grid',
      columns: 2,
      items: [
        { id: 'i3', title: 'I3 · Skills', lines: ['Teachable procedures'], tone: 'violet' },
        { id: 'i4', title: 'I4 · Hooks', lines: ['Deterministic automation'], tone: 'violet' },
        { id: 'i5', title: 'I5 · MCP Servers', lines: ['New tools from outside services'], tone: 'violet' },
        { id: 'i6', title: 'I6 · Subagents', lines: ['Context isolation and delegation'], tone: 'violet' },
      ],
    },
    { kind: 'connector', label: 'package it all' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'i7',
          title: 'I7 · Plugins and Integration',
          lines: ['Bundle skills, hooks, MCP, and subagents into one shareable unit'],
          tone: 'amber',
        },
      ],
    },
    { kind: 'connector', label: 'and put it to work' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'i8',
          title: 'I8 · Guided Project: PulseBoard',
          lines: ['Build a dashboard and the configured environment that builds it'],
          tone: 'teal',
        },
      ],
    },
  ],
}

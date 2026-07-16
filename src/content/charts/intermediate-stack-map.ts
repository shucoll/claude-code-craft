import type { ChartDef, LessonRef } from './types'

const lesson = (ref: LessonRef) => ({ kind: 'lesson' as const, ref })

/** Each module's home lesson: where clicking that layer of the stack lands. */
const home = (module: string, lesson: string): LessonRef => ({ level: 'intermediate', module, lesson })

const I1_1 = home('tools-permissions-settings', 'the-built-in-tool-belt')
const I2_1 = home('context-engineering', 'what-loads-at-startup')
const I3_1 = home('skills', 'skills-teachable-procedures')
const I4_1 = home('hooks', 'hooks-deterministic-automation')
const I5_1 = home('mcp-servers', 'mcp-giving-claude-new-tools')
const I6_1 = home('subagents', 'subagents-context-isolation-and-delegation')
const I7_1 = home('plugins-and-integration', 'plugins-and-marketplaces')
const I8_1 = home('guided-project-pulseboard', 'environment-first')

/**
 * The itinerary for Level 2: one layer per module, read top to bottom in the
 * order the modules build on each other. The mechanical counterpart is I7.3's
 * `claude-code-system-map`, which returns at level's end to show how these same
 * pieces interlock at runtime.
 *
 * Every node links to its module's home lesson.
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
          target: lesson(I2_1),
        },
      ],
    },
    { kind: 'connector', label: 'then the four extension mechanisms, in any order' },
    {
      kind: 'grid',
      columns: 2,
      items: [
        { id: 'i3', title: 'I3 · Skills', lines: ['Teachable procedures'], tone: 'violet', target: lesson(I3_1) },
        { id: 'i4', title: 'I4 · Hooks', lines: ['Deterministic automation'], tone: 'violet', target: lesson(I4_1) },
        { id: 'i5', title: 'I5 · MCP Servers', lines: ['New tools from outside services'], tone: 'violet', target: lesson(I5_1) },
        { id: 'i6', title: 'I6 · Subagents', lines: ['Context isolation and delegation'], tone: 'violet', target: lesson(I6_1) },
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
          target: lesson(I7_1),
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
          target: lesson(I8_1),
        },
      ],
    },
  ],
}

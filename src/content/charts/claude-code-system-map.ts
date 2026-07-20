import type { ChartDef, LessonRef } from './types'

const lesson = (ref: LessonRef) => ({ kind: 'lesson' as const, ref })

const home = (module: string, lesson: string): LessonRef => ({ level: 'intermediate', module, lesson })

const TOOL_BELT = home('tools-permissions-settings', 'the-built-in-tool-belt')
const PERMISSIONS = home('tools-permissions-settings', 'permission-rules')
const SETTINGS = home('tools-permissions-settings', 'settings-scopes-and-the-claude-directory')
const LEDGER = home('context-engineering', 'what-loads-at-startup')
const CLAUDE_MD = home('context-engineering', 'claude-md-at-scale')
const OUTPUT_STYLES = home('context-engineering', 'output-styles')
const SKILLS = home('skills', 'skills-teachable-procedures')
const SKILL_BUILD = home('skills', 'building-and-invoking-skills')
const HOOKS = home('hooks', 'hooks-deterministic-automation')
const HOOK_IO = home('hooks', 'hook-input-output-and-decision-control')
const HOOK_RECIPES = home('hooks', 'hook-recipes')
const MCP = home('mcp-servers', 'mcp-giving-claude-new-tools')
const SUBAGENTS = home('subagents', 'subagents-context-isolation-and-delegation')
const DELEGATION = home('subagents', 'delegation-patterns')
const PLUGINS = home('plugins-and-integration', 'plugins-and-marketplaces')

/**
 * The level's synthesis chart: one session traced end to end, startup first and
 * then a single turn through the machinery. Every node links to the lesson that
 * owns that piece, which makes this the platform's global navigator for
 * Intermediate as well as I7.3's centerpiece.
 *
 * The learning-order counterpart is `intermediate-stack-map` (I0.1); this is the
 * runtime order, which is deliberately different.
 */
export const claudeCodeSystemMap: ChartDef = {
  id: 'claude-code-system-map',
  title: 'One session, end to end',
  subtitle: 'What loads before you type, and what fires when you do. Click any piece to open the lesson that owns it.',
  rows: [
    {
      kind: 'cards',
      cards: [
        {
          id: 'launch',
          title: 'You run `claude`',
          lines: ['Nothing is loaded yet'],
          tone: 'neutral',
        },
      ],
    },
    { kind: 'connector', label: 'startup · settings resolve first, because they decide everything after' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'settings',
          title: 'Settings resolve',
          lines: ['managed → project → local → user', 'which plugins, which agent, which model'],
          tone: 'blue',
          target: lesson(SETTINGS),
        },
      ],
    },
    { kind: 'connector', label: 'then everything the session will carry is loaded' },
    {
      kind: 'grid',
      columns: 2,
      label: 'Loaded at startup',
      items: [
        {
          id: 'claude-md',
          title: 'CLAUDE.md and rules',
          lines: ['Every level of the hierarchy, in full'],
          tone: 'violet',
          target: lesson(CLAUDE_MD),
        },
        {
          id: 'tools',
          title: 'The built-in tool belt',
          lines: ['Read, Edit, Bash, Grep, Task, and the rest'],
          tone: 'blue',
          target: lesson(TOOL_BELT),
        },
        {
          id: 'skills-index',
          title: 'Skill index',
          lines: ['Names and descriptions only', 'Bodies load when one triggers'],
          tone: 'violet',
          target: lesson(SKILLS),
        },
        {
          id: 'mcp-tools',
          title: 'MCP tool definitions',
          lines: ['Full schemas for every connected server', 'Usually the largest single item'],
          tone: 'amber',
          target: lesson(MCP),
        },
        {
          id: 'agents',
          title: 'Subagent roster',
          lines: ['Built-ins plus your own definitions'],
          tone: 'teal',
          target: lesson(SUBAGENTS),
        },
        {
          id: 'hooks-armed',
          title: 'Hooks arm',
          lines: ['Registered against events; nothing runs yet'],
          tone: 'rose',
          target: lesson(HOOKS),
        },
        {
          id: 'style',
          title: 'Output style',
          lines: ['Replaces part of the system prompt'],
          tone: 'neutral',
          target: lesson(OUTPUT_STYLES),
        },
        {
          id: 'plugins',
          title: 'Plugins',
          lines: ['Contribute all of the above at once'],
          tone: 'teal',
          target: lesson(PLUGINS),
        },
      ],
      caption: 'Order within this group barely matters; that all of it is resident before your first word does.',
    },
    { kind: 'connector', label: 'all of it is context, billed on every turn for the rest of the session' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'ledger',
          title: 'The context ledger',
          lines: ['What each of those pieces costs, in tokens'],
          tone: 'amber',
          target: lesson(LEDGER),
        },
      ],
    },
    { kind: 'connector', label: 'you type a prompt · the turn begins' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'prompt-hook',
          title: 'UserPromptSubmit fires',
          lines: ['Can inject context, or block the prompt outright'],
          tone: 'rose',
          target: lesson(HOOK_IO),
        },
      ],
    },
    { kind: 'connector', label: 'Claude reads the prompt and decides how to answer it' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'skill-trigger',
          title: 'A skill triggers',
          lines: ['Description matched', 'Body loads now'],
          tone: 'violet',
          target: lesson(SKILL_BUILD),
        },
        {
          id: 'delegate',
          title: 'Work is delegated',
          lines: ['Subagent gets a fresh window', 'Only its report comes back'],
          tone: 'teal',
          target: lesson(DELEGATION),
        },
        {
          id: 'tool-call',
          title: 'A tool is called',
          lines: ['Built-in, or one an MCP server added'],
          tone: 'blue',
          target: lesson(TOOL_BELT),
        },
      ],
    },
    { kind: 'connector', label: 'every tool call passes the same gate, in this order' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'pretool-hook',
          title: 'PreToolUse hooks run',
          lines: ['Can allow, deny, or ask', 'A deny here ends the call'],
          tone: 'rose',
          target: lesson(HOOK_IO),
        },
        {
          id: 'perm-rules',
          title: 'Permission rules apply',
          lines: ['deny → ask → allow', 'Or the prompt reaches you'],
          tone: 'amber',
          target: lesson(PERMISSIONS),
        },
      ],
    },
    { kind: 'connector', label: 'if it survives both, the tool runs' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'posttool-hook',
          title: 'PostToolUse hooks run',
          lines: ['Format, lint, validate', 'Feedback goes back to Claude'],
          tone: 'rose',
          target: lesson(HOOK_RECIPES),
        },
      ],
    },
    { kind: 'connector', label: 'the result joins the conversation · Claude loops until it is done' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'stop',
          title: 'Stop hook fires',
          lines: ['The last chance to refuse "done"', 'Run the tests here'],
          tone: 'rose',
          target: lesson(HOOKS),
        },
        {
          id: 'answer',
          title: 'You get an answer',
          lines: ['And a context window a little fuller than before'],
          tone: 'neutral',
          target: lesson(LEDGER),
        },
      ],
    },
  ],
}

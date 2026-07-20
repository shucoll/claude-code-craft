import type { ChartDef, LessonRef } from './types'

const lesson = (ref: LessonRef) => ({ kind: 'lesson' as const, ref })

const home = (module: string, lesson: string): LessonRef => ({ level: 'intermediate', module, lesson })

/**
 * The master mechanism tree: the one place the level's four resolver ladders
 * (I3.4, I4.5, I5.4, I6.4) are reconciled into a single traversal.
 *
 * Question order is the reconciliation. Determinism is asked first because a
 * hook and a permission rule are the only options that do not depend on Claude
 * choosing to comply, so ruling them in or out narrows everything else. External
 * reach comes next (it is a question about the world, not about Claude), then
 * context economics, and only then the skill / CLAUDE.md / prompt distinction,
 * which is where most people wrongly start.
 */
export const mechanismDecisionTree: ChartDef = {
  id: 'mechanism-decision-tree',
  title: 'Which mechanism owns this job?',
  subtitle: 'One walk through the level: determinism, then reach, then cost, then form.',
  rows: [
    {
      kind: 'flow',
      direction: 'TB',
      guided: true,
      nodes: [
        {
          id: 'q-deterministic',
          title: 'Must it be guaranteed?',
          lines: ['It has to happen whether or not Claude decides to.'],
          role: 'question',
        },
        {
          id: 'q-enforce',
          title: 'Stopping, or running?',
          lines: ['Blocking access to something, or executing something.'],
          role: 'question',
        },
        {
          id: 'q-external',
          title: 'Does it reach outside this repo?',
          lines: ['Data or actions from an external system.'],
          role: 'question',
        },
        {
          id: 'q-cli',
          title: 'Is there a CLI for it?',
          lines: ['One that covers the operations you actually need.'],
          role: 'question',
        },
        {
          id: 'q-isolate',
          title: 'Will it flood your context?',
          lines: ['High volume you will not reuse, or work needing its own tool limits.'],
          role: 'question',
        },
        {
          id: 'q-procedure',
          title: 'Is it a procedure?',
          lines: ['Steps you repeat, but only on some tasks.'],
          role: 'question',
        },
        {
          id: 'q-always',
          title: 'Is it always true here?',
          lines: ['A standing fact about this project, relevant every turn.'],
          role: 'question',
        },

        {
          id: 'permission',
          title: 'Permission rule',
          role: 'leaf',
          tone: 'amber',
          lines: [
            'You are drawing a boundary, not adding behavior.',
            'deny beats ask beats allow, and no wording in a file competes with it.',
          ],
          target: lesson(home('tools-permissions-settings', 'permission-rules')),
        },
        {
          id: 'hook',
          title: 'Hook',
          role: 'leaf',
          tone: 'rose',
          lines: [
            'Code on an event, not a request Claude may decline.',
            'Formatting, validation, and refusing to call unfinished work done.',
          ],
          target: lesson(home('hooks', 'hooks-deterministic-automation')),
        },
        {
          id: 'cli',
          title: 'CLI through Bash',
          role: 'leaf',
          tone: 'blue',
          lines: [
            'A tool Claude already knows how to drive, costing no context until called.',
            'Wrap the invocation in a skill if the arguments are fiddly.',
          ],
          target: lesson(home('mcp-servers', 'mcp-vs-cli-vs-skill')),
        },
        {
          id: 'mcp',
          title: 'MCP server',
          role: 'leaf',
          tone: 'violet',
          lines: [
            'Structured data, managed auth, and operations no CLI exposes cleanly.',
            'The most expensive option at startup: every tool schema is resident.',
          ],
          target: lesson(home('mcp-servers', 'mcp-giving-claude-new-tools')),
        },
        {
          id: 'subagent',
          title: 'Subagent',
          role: 'leaf',
          tone: 'teal',
          lines: [
            'A fresh window that does the messy part and returns a summary.',
            'Also the way to hand out fewer tools than you hold.',
          ],
          target: lesson(home('subagents', 'subagents-context-isolation-and-delegation')),
        },
        {
          id: 'skill',
          title: 'Skill',
          role: 'leaf',
          tone: 'violet',
          lines: [
            'The procedure you have explained three times, written down once.',
            'Its description is resident; the body loads only when it triggers.',
          ],
          target: lesson(home('skills', 'skills-teachable-procedures')),
        },
        {
          id: 'claude-md',
          title: 'CLAUDE.md',
          role: 'leaf',
          tone: 'blue',
          lines: [
            'Context every turn needs anyway, so paying rent for it is fair.',
            'Facts and conventions, not procedures and not enforcement.',
          ],
          target: lesson(home('context-engineering', 'claude-md-at-scale')),
        },
        {
          id: 'prompt',
          title: 'Say it in the prompt',
          role: 'leaf',
          tone: 'neutral',
          lines: [
            'A one-off does not need infrastructure.',
            'Configure it the second time you need it, not the first.',
          ],
          target: lesson(home('context-engineering', 'what-loads-at-startup')),
        },
      ],
      edges: [
        { from: 'q-deterministic', to: 'q-enforce', label: 'yes, guaranteed' },
        { from: 'q-deterministic', to: 'q-external', label: 'no, judgment is fine' },

        { from: 'q-enforce', to: 'permission', label: 'stopping an action' },
        { from: 'q-enforce', to: 'hook', label: 'running an action' },

        { from: 'q-external', to: 'q-cli', label: 'yes, external' },
        { from: 'q-external', to: 'q-isolate', label: 'no, all local' },

        { from: 'q-cli', to: 'cli', label: 'yes, a CLI covers it' },
        { from: 'q-cli', to: 'mcp', label: 'no, I need structured data' },

        { from: 'q-isolate', to: 'subagent', label: 'yes, high volume or limits' },
        { from: 'q-isolate', to: 'q-procedure', label: 'no, small output' },

        { from: 'q-procedure', to: 'skill', label: 'yes, repeated steps' },
        { from: 'q-procedure', to: 'q-always', label: 'no, knowledge not steps' },

        { from: 'q-always', to: 'claude-md', label: 'yes, always relevant' },
        { from: 'q-always', to: 'prompt', label: 'no, just this once' },
      ],
    },
  ],
}

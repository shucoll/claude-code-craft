import type { ChartDef } from './types'

/**
 * The I1.2 companion to `tool-belt-map`. Where the tool belt groups tools by
 * risk tier, this groups them by the rule syntax each tier uses, with real
 * example rules on every card. Tones echo the tool belt (blue = files,
 * amber = commands, violet = network, neutral = by-name) so the learner sees
 * the same tiers turning into their specifier shapes.
 *
 * Reference material, so grid rows (no connecting arrows) and inert cards.
 */
export const permissionRuleShapes: ChartDef = {
  id: 'permission-rule-shapes',
  title: 'Permission rule shapes',
  subtitle: 'Each risk tier from the tool belt has its own rule syntax.',
  rows: [
    {
      kind: 'grid',
      label: 'Files → path patterns (Read, Edit)',
      columns: 2,
      items: [
        { id: 'edit-src', title: 'Edit(src/**)', tone: 'blue', lines: ['Edit anything under src/'] },
        { id: 'read-env', title: 'Read(.env)', tone: 'blue', lines: ['A bare name matches at any depth'] },
        { id: 'edit-docs', title: 'Edit(/docs/**)', tone: 'blue', lines: ['A single / anchors to the project root'] },
        { id: 'read-abs', title: 'Read(//**/.env)', tone: 'blue', lines: ['// is a real filesystem-absolute path'] },
      ],
      caption: 'gitignore syntax, not regex: * spans one path segment, ** crosses directories.',
    },
    {
      kind: 'grid',
      label: 'Commands → glob patterns (Bash)',
      columns: 3,
      items: [
        { id: 'bash-npm', title: 'Bash(npm run *)', tone: 'amber', lines: ['Any command starting "npm run "'] },
        { id: 'bash-push', title: 'Bash(git push *)', tone: 'amber', lines: ['Best in ask, so it keeps prompting'] },
        { id: 'bash-ls', title: 'Bash(ls *)', tone: 'amber', lines: ['Space before * is a word boundary'] },
      ],
      caption: 'One * spans multiple arguments, and each subcommand of a compound command is checked on its own.',
    },
    {
      kind: 'grid',
      label: 'Network → domain patterns (WebFetch)',
      columns: 2,
      items: [
        { id: 'wf-one', title: 'WebFetch(domain:example.com)', tone: 'violet', lines: ['Exactly that host'] },
        { id: 'wf-sub', title: 'WebFetch(domain:*.example.com)', tone: 'violet', lines: ['Any subdomain, but not example.com itself'] },
      ],
      caption: 'Matched against the URL hostname, case-insensitively.',
    },
    {
      kind: 'grid',
      label: 'Tools by name (MCP, subagents)',
      columns: 2,
      items: [
        { id: 'mcp', title: 'mcp__github__*', tone: 'neutral', lines: ['Every tool from the github MCP server'] },
        { id: 'agent', title: 'Agent(Explore)', tone: 'neutral', lines: ['A specific subagent'] },
      ],
      caption: 'Here the specifier is the tool or server name itself.',
    },
  ],
}

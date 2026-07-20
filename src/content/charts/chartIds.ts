// Node-safe list of registered chart ids. Kept import-free so the authoring
// generator (nodenext) can validate lesson `interactive.spec` without pulling
// the app chart module graph (demo.ts, *.mdx popups) into its compilation.
// A drift guard in index.test.ts asserts this matches the real registry.
export const chartIds: readonly string[] = [
  'agentic-loop-diagram',
  'beginner-workflow-map',
  'clear-compact-new-tree',
  'command-belt-reference',
  'context-window-simulator',
  'context-cost-ledger',
  'demo',
  'tool-belt-map',
  'intermediate-stack-map',
  'permission-rule-shapes',
  'dot-claude-directory-map',
  'hook-lifecycle-clickable',
  'claude-code-system-map',
  'mechanism-decision-tree',
]

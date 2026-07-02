import type { LanguagePack } from '../types'

const javascript: LanguagePack = {
  meta: { id: 'javascript', label: 'JavaScript', icon: '🟨' },
  snippets: {
    'hello-world': {
      filename: 'hello.js',
      code: `function greet(name) {\n  return \`Hello, \${name}!\`\n}\n\nconsole.log(greet('world'))`,
    },
    'edit-function': {
      filename: 'math.js',
      code: `export function add(a, b) {\n  return a + b\n}`,
    },
    'review-changes-example': {
      filename: 'scores.js',
      code: `export function averageScore(scores) {\n  const total = scores.reduce((sum, s) => sum + s, 0)\n  return total / scores.length\n}`,
    },
  },
  prompts: {
    'first-edit': 'Ask Claude to add an `isEven(n)` helper to math.js and a test for it.',
    refactor: 'Ask Claude to extract the validation logic in handler.js into its own function.',
    'review-changes': 'Ask Claude to review scores.js and flag any edge cases before you commit.',
  },
}

export default javascript

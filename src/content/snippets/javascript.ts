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
  },
  prompts: {
    'first-edit': 'Ask Claude to add an `isEven(n)` helper to math.js and a test for it.',
    refactor: 'Ask Claude to extract the validation logic in handler.js into its own function.',
  },
}

export default javascript

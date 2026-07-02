import type { LanguagePack } from '../types'

const python: LanguagePack = {
  meta: { id: 'python', label: 'Python', icon: '🐍' },
  snippets: {
    'hello-world': {
      filename: 'hello.py',
      code: `def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\n\nprint(greet("world"))`,
    },
    'edit-function': {
      filename: 'math.py',
      code: `def add(a: int, b: int) -> int:\n    return a + b`,
    },
    'review-changes-example': {
      filename: 'scores.py',
      code: `def average_score(scores: list[int]) -> float:\n    total = sum(scores)\n    return total / len(scores)`,
    },
  },
  prompts: {
    'first-edit': 'Ask Claude to add an `is_even(n)` helper to math.py and a test for it.',
    refactor: 'Ask Claude to extract the validation logic in handler.py into its own function.',
    'review-changes': 'Ask Claude to review scores.py and flag any edge cases before you commit.',
  },
}

export default python

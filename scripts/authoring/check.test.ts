// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkContent } from './check.ts'

function seedContent(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-'))
  fs.mkdirSync(path.join(dir, 'lessons/beginner'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'snippets'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'structure.ts'),
    `export const structure = [
  { id: 'beginner', title: 'Beginner', order: 1, modules: [
    { code: 'B1', slug: 'basics', title: 'The Basics', order: 1 },
  ] },
]
`,
  )
  const pack = (name: string, label: string, body: string) => `import type { LanguagePack } from '../types'

const ${name}: LanguagePack = {
  meta: { id: '${name}', label: '${label}' },
${body}
}

export default ${name}
`
  fs.writeFileSync(
    path.join(dir, 'snippets/javascript.ts'),
    pack('javascript', 'JavaScript', `  snippets: { 'edit-function': { filename: 'math.js', code: 'add' } },\n  prompts: { refactor: 'Refactor it.' },`),
  )
  fs.writeFileSync(path.join(dir, 'snippets/python.ts'), pack('python', 'Python', `  snippets: {},\n  prompts: {},`))
  return dir
}

test('no errors or warnings when every reference resolves and packs match', () => {
  const dir = seedContent()
  // python needs the same keys to avoid fallback warnings
  fs.writeFileSync(
    path.join(dir, 'snippets/python.ts'),
    `import type { LanguagePack } from '../types'

const python: LanguagePack = {
  meta: { id: 'python', label: 'Python' },
  snippets: { 'edit-function': { filename: 'math.py', code: 'add' } },
  prompts: { refactor: 'Refactor it.' },
}

export default python
`,
  )
  fs.writeFileSync(
    path.join(dir, 'lessons/beginner/e.mdx'),
    '---\nid: "B1.1"\nslug: "e"\ntitle: "E"\norder: 1\ndocsSources: ["https://code.claude.com/docs/en/overview"]\n---\n\n# E\n\n<Snippet id="edit-function" />\n\n<TryPrompt id="refactor" />\n',
  )
  const { errors, warnings } = checkContent(dir)
  expect(errors).toEqual([])
  expect(warnings).toEqual([])
})

test('a reference missing from the default pack is an ERROR', () => {
  const dir = seedContent()
  fs.writeFileSync(path.join(dir, 'lessons/beginner/e.mdx'), '# E\n\n<Snippet id="does-not-exist" />\n')
  const { errors } = checkContent(dir)
  expect(errors.some((e) => e.includes('does-not-exist'))).toBe(true)
})

test('a key missing from a non-default pack is a warning, not an error', () => {
  const dir = seedContent() // python has neither edit-function nor refactor
  fs.writeFileSync(
    path.join(dir, 'lessons/beginner/e.mdx'),
    '---\nid: "B1.1"\nslug: "e"\ntitle: "E"\norder: 1\ndocsSources: ["https://code.claude.com/docs/en/overview"]\n---\n\n# E\n\n<Snippet id="edit-function" />\n\n<TryPrompt id="refactor" />\n',
  )
  const { errors, warnings } = checkContent(dir)
  expect(errors).toEqual([])
  expect(warnings.some((w) => w.includes('python') && w.includes('edit-function'))).toBe(true)
})

test('references inside code fences or inline code are ignored (no false-positive ERROR)', () => {
  const dir = seedContent()
  fs.writeFileSync(
    path.join(dir, 'lessons/beginner/e.mdx'),
    '---\nid: "B1.1"\nslug: "e"\ntitle: "E"\norder: 1\ndocsSources: ["https://code.claude.com/docs/en/overview"]\n---\n\n# E\n\nInline `<Snippet id="doc-only" />` and:\n\n```mdx\n<Snippet id="fenced-only" />\n<TryPrompt id="fenced-prompt" />\n```\n',
  )
  const { errors } = checkContent(dir)
  expect(errors).toEqual([])
})

test('output ordering is deterministic — packs are reported in sorted id order', () => {
  const dir = seedContent() // default javascript has edit-function + refactor; python is empty
  // a second non-default pack whose id sorts before "python"
  fs.writeFileSync(
    path.join(dir, 'snippets/aardvark.ts'),
    `import type { LanguagePack } from '../types'

const aardvark: LanguagePack = {
  meta: { id: 'aardvark', label: 'Aardvark' },
  snippets: {},
  prompts: {},
}

export default aardvark
`,
  )
  const { warnings } = checkContent(dir)
  const firstAardvark = warnings.findIndex((w) => w.startsWith('aardvark:'))
  const firstPython = warnings.findIndex((w) => w.startsWith('python:'))
  expect(firstAardvark).toBeGreaterThanOrEqual(0)
  expect(firstPython).toBeGreaterThan(firstAardvark)
})

test('a leftover STUB value is a warning', () => {
  const dir = seedContent()
  fs.writeFileSync(
    path.join(dir, 'snippets/javascript.ts'),
    `import type { LanguagePack } from '../types'

const javascript: LanguagePack = {
  meta: { id: 'javascript', label: 'JavaScript' },
  snippets: { 'edit-function': { filename: 'x', code: '// @@TODO@@ snippet: edit-function' } },
  prompts: {},
}

export default javascript
`,
  )
  fs.writeFileSync(path.join(dir, 'lessons/beginner/e.mdx'), '# E\n\n<Snippet id="edit-function" />\n')
  const { warnings } = checkContent(dir)
  expect(warnings.some((w) => w.includes('edit-function') && w.toLowerCase().includes('stub'))).toBe(true)
})

test('checkContent reports a frontmatter validation error', () => {
  const dir = seedContent()
  fs.mkdirSync(path.join(dir, 'lessons/beginner'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'lessons/beginner/bad.mdx'),
    '---\nid: "B1.1"\nslug: "bad"\ntitle: "Bad"\ntype: "nonsense"\norder: 1\n---\n\n# Bad\n',
  )
  const { errors } = checkContent(dir)
  expect(errors.some((e) => e.includes('invalid type'))).toBe(true)
})

test('an unknown inline <LessonLink> id is an ERROR', () => {
  const dir = seedContent()
  fs.writeFileSync(
    path.join(dir, 'lessons/beginner/e.mdx'),
    '---\nid: "B1.1"\nslug: "e"\ntitle: "E"\norder: 1\n---\n\n# E\n\nSee <LessonLink id="Z9.9" />.\n',
  )
  const { errors } = checkContent(dir)
  expect(errors.some((e) => e.includes('LessonLink') && e.includes('Z9.9'))).toBe(true)
})

test('an inline <LessonLink> id that resolves is not an error', () => {
  const dir = seedContent()
  fs.writeFileSync(
    path.join(dir, 'lessons/beginner/e.mdx'),
    '---\nid: "B1.1"\nslug: "e"\ntitle: "E"\norder: 1\n---\n\n# E\n\nSee <LessonLink id="B1.1">this</LessonLink>.\n',
  )
  const { errors } = checkContent(dir)
  expect(errors.some((e) => e.includes('LessonLink'))).toBe(false)
})

test('a <LessonLink> inside a code fence is ignored (no false-positive ERROR)', () => {
  const dir = seedContent()
  fs.writeFileSync(
    path.join(dir, 'lessons/beginner/e.mdx'),
    '---\nid: "B1.1"\nslug: "e"\ntitle: "E"\norder: 1\n---\n\n# E\n\n```mdx\n<LessonLink id="Z9.9" />\n```\n',
  )
  const { errors } = checkContent(dir)
  expect(errors.some((e) => e.includes('LessonLink'))).toBe(false)
})

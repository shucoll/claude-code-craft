// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import matter from 'gray-matter'
import { scaffoldLesson, scaffoldOutline } from './scaffold.ts'

const tmpDirs: string[] = []

function seedContent(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-'))
  tmpDirs.push(dir)
  fs.mkdirSync(path.join(dir, 'lessons'), { recursive: true })
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
  const emptyPack = (name: string, label: string) => `import type { LanguagePack } from '../types'

const ${name}: LanguagePack = {
  meta: { id: '${name}', label: '${label}' },
  snippets: {},
  prompts: {},
}

export default ${name}
`
  fs.writeFileSync(path.join(dir, 'snippets/javascript.ts'), emptyPack('javascript', 'JavaScript'))
  fs.writeFileSync(path.join(dir, 'snippets/python.ts'), emptyPack('python', 'Python'))
  return dir
}

const spec = {
  level: { id: 'beginner', title: 'Beginner' },
  module: { code: 'B1', slug: 'basics', title: 'The Basics' },
  slug: 'first-edit',
  title: 'Your First Edit',
  type: 'core' as const,
  verifiedAgainstDocsAt: '2026-07-03',
}

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

test('scaffoldLesson writes frontmatter MDX with an auto-assigned id and does NOT touch curriculum.ts', () => {
  const dir = seedContent()
  const report = scaffoldLesson(spec, dir)
  expect(report.dottedId).toBe('B1.1')
  const file = path.join(dir, 'lessons/beginner/first-edit.mdx')
  expect(fs.existsSync(file)).toBe(true)
  const { data } = matter(fs.readFileSync(file, 'utf8'))
  expect(data.id).toBe('B1.1')
  expect(data.slug).toBe('first-edit')
  expect(data.type).toBe('core')
  expect(data.order).toBe(1)
  expect(fs.existsSync(path.join(dir, 'curriculum.ts'))).toBe(false)
})

test('a second lesson in the same module gets the next id/order', () => {
  const dir = seedContent()
  scaffoldLesson(spec, dir)
  const r2 = scaffoldLesson({ ...spec, slug: 'review-changes', title: 'Reviewing Changes' }, dir)
  expect(r2.dottedId).toBe('B1.2')
  const { data } = matter(fs.readFileSync(path.join(dir, 'lessons/beginner/review-changes.mdx'), 'utf8'))
  expect(data.order).toBe(2)
})

test('snippets/prompts are opt-in: default writes no Snippet tag and no pack stub', () => {
  const dir = seedContent()
  scaffoldLesson(spec, dir)
  const mdx = fs.readFileSync(path.join(dir, 'lessons/beginner/first-edit.mdx'), 'utf8')
  expect(mdx).not.toContain('<Snippet')
  expect(fs.readFileSync(path.join(dir, 'snippets/javascript.ts'), 'utf8')).not.toContain('@@TODO@@')
})

test('with --snippets/--prompts it embeds tags and stubs the DEFAULT pack only', () => {
  const dir = seedContent()
  scaffoldLesson({ ...spec, snippets: ['first-edit-example'], prompts: ['first-edit'] }, dir)
  const mdx = fs.readFileSync(path.join(dir, 'lessons/beginner/first-edit.mdx'), 'utf8')
  expect(mdx).toContain('<Snippet id="first-edit-example" />')
  const js = fs.readFileSync(path.join(dir, 'snippets/javascript.ts'), 'utf8')
  expect(js).toContain("'first-edit-example'")
  expect(js).toContain('@@TODO@@')
  expect(fs.readFileSync(path.join(dir, 'snippets/python.ts'), 'utf8')).not.toContain('first-edit-example')
})

test('scaffoldOutline seeds a new level + module in structure.ts and writes lessons', () => {
  const dir = seedContent()
  scaffoldOutline(
    {
      levels: [
        {
          id: 'advanced',
          title: 'Advanced',
          modules: [
            {
              code: 'A1',
              slug: 'power',
              title: 'Power User',
              lessons: [{ slug: 'subagents', title: 'Subagents', type: 'core', verifiedAgainstDocsAt: '2026-07-03' }],
            },
          ],
        },
      ],
    },
    dir,
  )
  const structure = fs.readFileSync(path.join(dir, 'structure.ts'), 'utf8')
  expect(structure).toContain("id: 'advanced'")
  expect(structure).toContain("code: 'A1'")
  const { data } = matter(fs.readFileSync(path.join(dir, 'lessons/advanced/subagents.mdx'), 'utf8'))
  expect(data.id).toBe('A1.1')
})

test('re-scaffolding an existing lesson preserves authored .mdx content', () => {
  const dir = seedContent()
  scaffoldLesson(spec, dir)
  const file = path.join(dir, 'lessons/beginner/first-edit.mdx')
  fs.writeFileSync(file, '---\nid: "B1.1"\n---\n\n# Hand-authored\n')
  scaffoldLesson(spec, dir)
  expect(fs.readFileSync(file, 'utf8')).toBe('---\nid: "B1.1"\n---\n\n# Hand-authored\n')
})

test('re-scaffolding an existing lesson returns its real existing id, not a bogus next id', () => {
  const dir = seedContent()
  const r1 = scaffoldLesson(spec, dir)
  expect(r1.dottedId).toBe('B1.1')
  const r2 = scaffoldLesson(spec, dir)
  expect(r2.dottedId).toBe('B1.1')
  expect(r2.created).toEqual([])
})

test('scaffoldLesson throws (before writing) when the module letter disagrees with the level id', () => {
  const dir = seedContent()
  expect(() => scaffoldLesson({ ...spec, level: { id: 'advanced', title: 'Advanced' } }, dir)).toThrow(/implies level/)
  // nothing was written under advanced/
  expect(fs.existsSync(path.join(dir, 'lessons/advanced'))).toBe(false)
})

test('scaffoldOutline aborts before any writes when a module letter disagrees with its level', () => {
  const dir = seedContent()
  expect(() =>
    scaffoldOutline(
      {
        levels: [
          {
            id: 'advanced',
            title: 'Advanced',
            modules: [{ code: 'B9', slug: 'nope', title: 'Nope', lessons: [{ slug: 'x', title: 'X', type: 'core', verifiedAgainstDocsAt: '2026-07-03' }] }],
          },
        ],
      },
      dir,
    ),
  ).toThrow(/implies level/)
  expect(fs.existsSync(path.join(dir, 'lessons/advanced'))).toBe(false)
})

test('re-scaffolding a lesson whose existing file has no frontmatter id throws a clear error', () => {
  const dir = seedContent()
  scaffoldLesson(spec, dir)
  const file = path.join(dir, 'lessons/beginner/first-edit.mdx')
  fs.writeFileSync(file, '# No frontmatter here\n')
  expect(() => scaffoldLesson(spec, dir)).toThrow(/no "id"/)
})

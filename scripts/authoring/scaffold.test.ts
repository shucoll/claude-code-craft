// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { lessonTemplate } from './lessonTemplate.ts'
import { scaffoldLesson, scaffoldOutline } from './scaffold.ts'

const tmpDirs: string[] = []

function seedContent(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-'))
  tmpDirs.push(dir)
  fs.mkdirSync(path.join(dir, 'lessons/beginner'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'snippets'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'curriculum.ts'),
    `export const curriculum = [
  { id: 'beginner', title: 'Beginner', modules: [
    { id: 'basics', title: 'The Basics', lessons: [] },
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

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

test('lessonTemplate renders heading, prose stub, Snippet and TryPrompt', () => {
  const out = lessonTemplate('Your First Edit', 'first-edit-example', 'first-edit')
  expect(out).toContain('# Your First Edit')
  expect(out).toContain('@@TODO@@')
  expect(out).toContain('<Snippet id="first-edit-example" />')
  expect(out).toContain('<TryPrompt id="first-edit" />')
})

test('scaffoldLesson writes mdx, registers in curriculum, stubs the DEFAULT pack only', () => {
  const dir = seedContent()
  scaffoldLesson(
    { level: { id: 'beginner', title: 'Beginner' }, module: { id: 'basics', title: 'The Basics' }, id: 'first-edit', title: 'Your First Edit' },
    dir,
  )
  expect(fs.existsSync(path.join(dir, 'lessons/beginner/first-edit.mdx'))).toBe(true)
  expect(fs.readFileSync(path.join(dir, 'curriculum.ts'), 'utf8')).toContain("id: 'first-edit'")
  const js = fs.readFileSync(path.join(dir, 'snippets/javascript.ts'), 'utf8')
  expect(js).toContain("'first-edit-example'")
  expect(js).toContain('@@TODO@@')
  // non-default pack is left absent so it falls back
  expect(fs.readFileSync(path.join(dir, 'snippets/python.ts'), 'utf8')).not.toContain('first-edit-example')
})

test('scaffoldOutline creates a brand-new level, module and lessons', () => {
  const dir = seedContent()
  scaffoldOutline(
    {
      levels: [
        {
          id: 'advanced',
          title: 'Advanced',
          modules: [{ id: 'power', title: 'Power User', lessons: [{ id: 'subagents', title: 'Subagents' }] }],
        },
      ],
    },
    dir,
  )
  const curriculum = fs.readFileSync(path.join(dir, 'curriculum.ts'), 'utf8')
  expect(curriculum).toContain("id: 'advanced'")
  expect(curriculum).toContain("id: 'power'")
  expect(curriculum).toContain("id: 'subagents'")
  expect(fs.existsSync(path.join(dir, 'lessons/advanced/subagents.mdx'))).toBe(true)
})

test('re-scaffolding an existing lesson preserves authored .mdx content', () => {
  const dir = seedContent()
  const spec = { level: { id: 'beginner', title: 'Beginner' }, module: { id: 'basics', title: 'The Basics' }, id: 'first-edit', title: 'Your First Edit' }
  scaffoldLesson(spec, dir)
  const file = path.join(dir, 'lessons/beginner/first-edit.mdx')
  fs.writeFileSync(file, '# Hand-authored\n\nCustom prose.\n')
  scaffoldLesson(spec, dir)
  expect(fs.readFileSync(file, 'utf8')).toBe('# Hand-authored\n\nCustom prose.\n')
})

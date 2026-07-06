// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { generate } from './generateCurriculum.ts'

function tmpContentDir(write: (lessonsBeginnerDir: string) => void): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-gen-'))
  const beginner = path.join(dir, 'lessons', 'beginner')
  fs.mkdirSync(beginner, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'structure.ts'),
    `export const structure = [
  { id: 'beginner', title: 'Beginner', order: 1, modules: [
    { code: 'B1', slug: 'basics', title: 'The Basics', order: 1 },
  ] },
]
`,
  )
  write(beginner)
  return dir
}

test('generate writes a curriculum.ts with a literal import for valid content', () => {
  const dir = tmpContentDir((beginner) => {
    fs.writeFileSync(
      path.join(beginner, 'what-is-cc.mdx'),
      `---\nid: "B1.1"\nslug: "what-is-cc"\ntitle: "What is Claude Code?"\ntype: "core"\norder: 1\nvolatility: "stable"\ndocsSources: ["https://code.claude.com/docs/en/overview"]\n---\n\n# What is Claude Code?\n`,
    )
  })
  generate(dir)
  const out = fs.readFileSync(path.join(dir, 'curriculum.ts'), 'utf8')
  expect(out).toContain('export const curriculum')
  expect(out).toContain("content: () => import('./lessons/beginner/what-is-cc.mdx')")
})

test('generate throws when a lesson is missing required frontmatter', () => {
  const dir = tmpContentDir((beginner) => {
    fs.writeFileSync(path.join(beginner, 'broken.mdx'), `# no frontmatter\n`)
  })
  expect(() => generate(dir)).toThrow(/generation failed/)
})

test('generate reads structure.ts from the passed contentDir, not a stale in-memory import', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-gen-'))
  fs.mkdirSync(path.join(dir, 'lessons', 'beginner'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'structure.ts'),
    `export const structure = [
  { id: 'beginner', title: 'Beginner', order: 1, modules: [
    { code: 'B1', slug: 'temp-basics', title: 'Temp', order: 1 },
  ] },
]
`,
  )
  fs.writeFileSync(
    path.join(dir, 'lessons', 'beginner', 'probe.mdx'),
    `---\nid: "B1.1"\nslug: "probe"\ntitle: "Probe"\ntype: "core"\norder: 1\nvolatility: "stable"\nverifiedAgainstDocsAt: "2026-07-03"\ndocsSources: ["https://code.claude.com/docs/en/overview"]\n---\n\n# Probe\n`,
  )

  expect(() => generate(dir)).not.toThrow()
  const out = fs.readFileSync(path.join(dir, 'curriculum.ts'), 'utf8')
  expect(out).toContain('/learn/beginner/temp-basics/probe')
})

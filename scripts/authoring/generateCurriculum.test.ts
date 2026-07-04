// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { generate } from './generateCurriculum.ts'

function tmpContentDir(write: (lessonsBeginnerDir: string) => void): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-gen-'))
  const beginner = path.join(dir, 'lessons', 'beginner')
  fs.mkdirSync(beginner, { recursive: true })
  write(beginner)
  return dir
}

test('generate writes a curriculum.ts with a literal import for valid content', () => {
  const dir = tmpContentDir((beginner) => {
    fs.writeFileSync(
      path.join(beginner, 'what-is-cc.mdx'),
      `---\nid: "B1.1"\nslug: "what-is-cc"\ntitle: "What is Claude Code?"\ntype: "core"\norder: 1\nvolatility: "stable"\n---\n\n# What is Claude Code?\n`,
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

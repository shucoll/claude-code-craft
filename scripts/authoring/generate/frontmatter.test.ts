// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { readAllLessonMeta } from './frontmatter.ts'

function tmpLessons(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-fm-'))
  const dir = path.join(root, 'beginner')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'what-is-cc.mdx'),
    `---\nid: "B1.1"\nslug: "what-is-cc"\ntitle: "What is Claude Code?"\ntype: "core"\norder: 1\nvolatility: "stable"\n---\n\n# What is Claude Code?\n`,
  )
  return root
}

test('readAllLessonMeta parses frontmatter and derives levelDir', () => {
  const root = tmpLessons()
  const metas = readAllLessonMeta(root)
  expect(metas).toHaveLength(1)
  expect(metas[0]).toMatchObject({
    dottedId: 'B1.1',
    slug: 'what-is-cc',
    title: 'What is Claude Code?',
    type: 'core',
    order: 1,
    volatility: 'stable',
    levelDir: 'beginner',
  })
})

import { readAllLessonMeta } from './generate/frontmatter.ts'
import { moduleCodeOf } from './generate/ids.ts'
import { lessonsDir } from './paths.ts'

export function nextLessonId(contentDir: string, moduleCode: string): { dottedId: string; order: number } {
  const metas = readAllLessonMeta(lessonsDir(contentDir))
  let max = 0
  for (const m of metas) {
    if (!m.dottedId || moduleCodeOf(m.dottedId) !== moduleCode) continue
    if (typeof m.order === 'number' && m.order > max) max = m.order
  }
  const order = max + 1
  return { dottedId: `${moduleCode}.${order}`, order }
}

import { pathToFileURL } from 'node:url'
import { readAllLessonMeta } from './generate/frontmatter.ts'
import { validateContent } from './generate/validate.ts'
import { emitCurriculum } from './generate/emit.ts'
import { structure } from '../../src/content/structure.ts'
import { chartIds } from '../../src/content/charts/chartIds.ts'
import { curriculumFile, lessonsDir, DEFAULT_CONTENT_DIR } from './paths.ts'
import { newProject, formatAndSave } from './tsutil.ts'

export function generate(contentDir: string = DEFAULT_CONTENT_DIR): void {
  const metas = readAllLessonMeta(lessonsDir(contentDir))
  const errors = validateContent({ structure, metas, knownChartIds: new Set(chartIds) })
  if (errors.length > 0) {
    for (const e of errors) console.error(`ERROR ${e}`)
    throw new Error(`curriculum generation failed: ${errors.length} error(s)`)
  }
  const source = emitCurriculum(structure, metas)
  const project = newProject()
  const sf = project.createSourceFile(curriculumFile(contentDir), source, { overwrite: true })
  formatAndSave(sf)
  console.log(`generated ${curriculumFile(contentDir)} (${metas.length} lessons)`)
}

// Run only when invoked as a CLI (`tsx generateCurriculum.ts`), not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generate()
}

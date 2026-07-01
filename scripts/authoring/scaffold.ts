import fs from 'node:fs'
import path from 'node:path'
import { Project, QuoteKind } from 'ts-morph'
import { DEFAULT_CONTENT_DIR, DEFAULT_LANGUAGE, curriculumFile, lessonsDir, packFile } from './paths.ts'
import { addLesson, ensureLevel, ensureModule } from './curriculum.ts'
import { addPromptStub, addSnippetStub } from './packs.ts'
import { lessonTemplate } from './lessonTemplate.ts'

export interface OutlineLesson {
  id: string
  title: string
  snippets?: string[]
  prompts?: string[]
}
export interface OutlineModule {
  id: string
  title: string
  lessons: OutlineLesson[]
}
export interface OutlineLevel {
  id: string
  title: string
  modules: OutlineModule[]
}
export interface Outline {
  levels: OutlineLevel[]
}

export interface LessonSpec {
  level: { id: string; title: string }
  module: { id: string; title: string }
  id: string
  title: string
  snippets?: string[]
  prompts?: string[]
}

export interface ScaffoldReport {
  created: string[]
  changed: string[]
}

export function scaffoldOutline(outline: Outline, contentDir: string = DEFAULT_CONTENT_DIR): ScaffoldReport {
  const project = new Project({ skipAddingFilesFromTsConfig: true, manipulationSettings: { quoteKind: QuoteKind.Single } })
  const curriculum = project.addSourceFileAtPath(curriculumFile(contentDir))
  const defaultPack = project.addSourceFileAtPath(packFile(contentDir, DEFAULT_LANGUAGE))
  const report: ScaffoldReport = { created: [], changed: [] }

  for (const level of outline.levels) {
    const levelObj = ensureLevel(curriculum, { id: level.id, title: level.title })
    for (const mod of level.modules) {
      const moduleObj = ensureModule(levelObj, { id: mod.id, title: mod.title })
      for (const lesson of mod.lessons) {
        const snippetKeys = lesson.snippets ?? [`${lesson.id}-example`]
        const promptKeys = lesson.prompts ?? [lesson.id]
        addLesson(moduleObj, { id: lesson.id, title: lesson.title, importPath: `./lessons/${level.id}/${lesson.id}.mdx` })

        const dir = path.join(lessonsDir(contentDir), level.id)
        fs.mkdirSync(dir, { recursive: true })
        const file = path.join(dir, `${lesson.id}.mdx`)
        if (!fs.existsSync(file)) {
          fs.writeFileSync(file, lessonTemplate(lesson.title, snippetKeys[0], promptKeys[0]))
          report.created.push(file)
        }
        for (const key of snippetKeys) addSnippetStub(defaultPack, key)
        for (const key of promptKeys) addPromptStub(defaultPack, key)
      }
    }
  }

  curriculum.saveSync()
  defaultPack.saveSync()
  report.changed.push(curriculumFile(contentDir), packFile(contentDir, DEFAULT_LANGUAGE))
  return report
}

export function scaffoldLesson(spec: LessonSpec, contentDir: string = DEFAULT_CONTENT_DIR): ScaffoldReport {
  return scaffoldOutline(
    {
      levels: [
        {
          id: spec.level.id,
          title: spec.level.title,
          modules: [
            {
              id: spec.module.id,
              title: spec.module.title,
              lessons: [{ id: spec.id, title: spec.title, snippets: spec.snippets, prompts: spec.prompts }],
            },
          ],
        },
      ],
    },
    contentDir,
  )
}

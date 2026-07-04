import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_CONTENT_DIR, DEFAULT_LANGUAGE, lessonsDir, packFile, structureFile } from './paths.ts'
import { ensureLevel, ensureModule } from './structureEdit.ts'
import { nextLessonId } from './nextId.ts'
import { renderLesson, type LessonFrontmatter, type LessonType, type TemplateOptions } from './lessonTemplate.ts'
import { addPromptStub, addSnippetStub } from './packs.ts'
import { formatAndSave, newProject } from './tsutil.ts'

export interface LessonSpec {
  level: { id: string; title: string }
  module: { code: string; slug: string; title: string }
  slug: string
  title: string
  type: LessonType
  estimatedMinutes?: number
  volatility?: string
  verifiedAgainstDocsAt: string
  prerequisites?: string[]
  teaches?: string[]
  references?: string[]
  docsSources?: string[]
  interactive?: { kind: string; spec: string }[]
  snippets?: string[]
  prompts?: string[]
}

export interface OutlineLesson {
  slug: string
  title: string
  type: LessonType
  estimatedMinutes?: number
  volatility?: string
  verifiedAgainstDocsAt: string
  prerequisites?: string[]
  teaches?: string[]
  references?: string[]
  docsSources?: string[]
  interactive?: { kind: string; spec: string }[]
  snippets?: string[]
  prompts?: string[]
}
export interface OutlineModule {
  code: string
  slug: string
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

export interface ScaffoldReport {
  created: string[]
  changed: string[]
}

interface Ctx {
  contentDir: string
  report: ScaffoldReport
  structureSf: import('ts-morph').SourceFile
  defaultPack: import('ts-morph').SourceFile
  packTouched: boolean
}

function writeLessonFile(ctx: Ctx, level: { id: string }, lesson: OutlineLesson, dottedId: string, order: number): void {
  const dir = path.join(lessonsDir(ctx.contentDir), level.id)
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${lesson.slug}.mdx`)
  if (fs.existsSync(file)) return // idempotent — never overwrite authored content

  const fm: LessonFrontmatter = {
    id: dottedId,
    slug: lesson.slug,
    title: lesson.title,
    type: lesson.type,
    order,
    estimatedMinutes: lesson.estimatedMinutes,
    volatility: lesson.volatility ?? 'stable',
    verifiedAgainstDocsAt: lesson.verifiedAgainstDocsAt,
    prerequisites: lesson.prerequisites,
    teaches: lesson.teaches,
    references: lesson.references,
    docsSources: lesson.docsSources,
    interactive: lesson.interactive,
  }
  const opts: TemplateOptions = { snippets: lesson.snippets, prompts: lesson.prompts }
  fs.writeFileSync(file, renderLesson(fm, opts))
  ctx.report.created.push(file)

  for (const key of lesson.snippets ?? []) {
    if (addSnippetStub(ctx.defaultPack, key)) ctx.packTouched = true
  }
  for (const key of lesson.prompts ?? []) {
    if (addPromptStub(ctx.defaultPack, key)) ctx.packTouched = true
  }
}

export function scaffoldOutline(outline: Outline, contentDir: string = DEFAULT_CONTENT_DIR): ScaffoldReport {
  const project = newProject()
  const structureSf = project.addSourceFileAtPath(structureFile(contentDir))
  const defaultPack = project.addSourceFileAtPath(packFile(contentDir, DEFAULT_LANGUAGE))
  const ctx: Ctx = { contentDir, report: { created: [], changed: [] }, structureSf, defaultPack, packTouched: false }

  for (const level of outline.levels) {
    const levelObj = ensureLevel(structureSf, { id: level.id, title: level.title })
    for (const mod of level.modules) {
      ensureModule(levelObj, { code: mod.code, slug: mod.slug, title: mod.title })
      for (const lesson of mod.lessons) {
        // Compute id AFTER any prior lessons in this batch have been written to disk.
        const { dottedId, order } = nextLessonId(contentDir, mod.code)
        writeLessonFile(ctx, level, lesson, dottedId, order)
      }
    }
  }

  formatAndSave(structureSf)
  ctx.report.changed.push(structureFile(contentDir))
  if (ctx.packTouched) {
    formatAndSave(defaultPack)
    ctx.report.changed.push(packFile(contentDir, DEFAULT_LANGUAGE))
  }
  return ctx.report
}

export function scaffoldLesson(spec: LessonSpec, contentDir: string = DEFAULT_CONTENT_DIR): ScaffoldReport & { dottedId: string } {
  const project = newProject()
  const structureSf = project.addSourceFileAtPath(structureFile(contentDir))
  const defaultPack = project.addSourceFileAtPath(packFile(contentDir, DEFAULT_LANGUAGE))
  const ctx: Ctx = { contentDir, report: { created: [], changed: [] }, structureSf, defaultPack, packTouched: false }

  const levelObj = ensureLevel(structureSf, { id: spec.level.id, title: spec.level.title })
  ensureModule(levelObj, { code: spec.module.code, slug: spec.module.slug, title: spec.module.title })
  const { dottedId, order } = nextLessonId(contentDir, spec.module.code)
  writeLessonFile(ctx, spec.level, spec, dottedId, order)

  formatAndSave(structureSf)
  ctx.report.changed.push(structureFile(contentDir))
  if (ctx.packTouched) {
    formatAndSave(defaultPack)
    ctx.report.changed.push(packFile(contentDir, DEFAULT_LANGUAGE))
  }
  return { ...ctx.report, dottedId }
}

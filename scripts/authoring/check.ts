import fs from 'node:fs'
import path from 'node:path'
import { Project } from 'ts-morph'
import { DEFAULT_CONTENT_DIR, DEFAULT_LANGUAGE, STUB, lessonsDir, packFile, snippetsDir } from './paths.ts'
import { readPack } from './packs.ts'
import { readAllLessonMeta } from './generate/frontmatter.ts'
import { validateContent } from './generate/validate.ts'
import { readStructure } from './readStructure.ts'
import { chartIds } from '../../src/content/charts/chartIds.ts'

export interface CheckResult {
  errors: string[]
  warnings: string[]
}

function listPackIds(contentDir: string): string[] {
  return fs
    .readdirSync(snippetsDir(contentDir))
    .filter((f) => f.endsWith('.ts') && !f.startsWith('index.') && !f.endsWith('.test.ts'))
    .map((f) => f.replace(/\.ts$/, ''))
    .sort()
}

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return
  // Sort so output ordering doesn't depend on filesystem iteration order.
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

function scanLessonRefs(dir: string): { snippets: Set<string>; prompts: Set<string>; lessonLinks: Set<string> } {
  const snippets = new Set<string>()
  const prompts = new Set<string>()
  const lessonLinks = new Set<string>()
  for (const file of walk(dir)) {
    if (!file.endsWith('.mdx')) continue
    const text = fs.readFileSync(file, 'utf8')
      .replace(/```[\s\S]*?```/g, '') // fenced code blocks
      .replace(/`[^`]*`/g, '')        // inline code spans
    for (const m of text.matchAll(/<Snippet\s+id=["']([^"']+)["']/g)) snippets.add(m[1])
    for (const m of text.matchAll(/<TryPrompt\s+id=["']([^"']+)["']/g)) prompts.add(m[1])
    for (const m of text.matchAll(/<LessonLink\s+id=["']([^"']+)["']/g)) lessonLinks.add(m[1])
  }
  return { snippets, prompts, lessonLinks }
}

export function checkContent(contentDir: string = DEFAULT_CONTENT_DIR): CheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const project = new Project({ skipAddingFilesFromTsConfig: true })

  // 1. Frontmatter validation (Phase 1 rules)
  const structure = readStructure(project, contentDir)
  const metas = readAllLessonMeta(lessonsDir(contentDir))
  errors.push(...validateContent({ structure, metas, knownChartIds: new Set(chartIds) }))

  // 2. Snippet/prompt coverage (unchanged from checkSnippets)
  const packs: Record<string, { snippets: Record<string, string>; prompts: Record<string, string> }> = {}
  for (const id of listPackIds(contentDir)) packs[id] = readPack(project.addSourceFileAtPath(packFile(contentDir, id)))
  const def = packs[DEFAULT_LANGUAGE]
  if (!def) throw new Error(`default pack "${DEFAULT_LANGUAGE}" not found`)

  const refs = scanLessonRefs(lessonsDir(contentDir))
  for (const id of [...refs.snippets].sort()) {
    if (!(id in def.snippets)) errors.push(`Snippet id "${id}" is referenced in a lesson but missing from the default pack (${DEFAULT_LANGUAGE}).`)
  }
  for (const id of [...refs.prompts].sort()) {
    if (!(id in def.prompts)) errors.push(`Prompt id "${id}" is referenced in a lesson but missing from the default pack (${DEFAULT_LANGUAGE}).`)
  }

  const knownDottedIds = new Set(metas.map((m) => m.dottedId))
  for (const id of [...refs.lessonLinks].sort()) {
    if (!knownDottedIds.has(id)) errors.push(`LessonLink id "${id}" is referenced inline in a lesson but does not resolve to any lesson.`)
  }

  for (const [id, pack] of Object.entries(packs)) {
    if (id !== DEFAULT_LANGUAGE) {
      for (const key of Object.keys(def.snippets)) {
        if (!(key in pack.snippets)) warnings.push(`${id}: missing snippet "${key}" (falls back to ${DEFAULT_LANGUAGE}).`)
      }
      for (const key of Object.keys(def.prompts)) {
        if (!(key in pack.prompts)) warnings.push(`${id}: missing prompt "${key}" (falls back to ${DEFAULT_LANGUAGE}).`)
      }
    }
    for (const [key, value] of Object.entries(pack.snippets)) {
      if (value.includes(STUB)) warnings.push(`${id}: snippet "${key}" is still a TODO stub.`)
    }
    for (const [key, value] of Object.entries(pack.prompts)) {
      if (value.includes(STUB)) warnings.push(`${id}: prompt "${key}" is still a TODO stub.`)
    }
  }

  return { errors, warnings }
}

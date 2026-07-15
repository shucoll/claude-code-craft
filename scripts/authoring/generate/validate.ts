import path from 'node:path'
import { levelOf, moduleCodeOf } from './ids.ts'
import type { LessonMeta } from './frontmatter.ts'
import type { LevelDef } from '../../../src/content/structure.ts'

export interface ValidateInput {
  structure: LevelDef[]
  metas: LessonMeta[]
  knownChartIds: Set<string>
}

const LESSON_TYPES = new Set(['overview', 'core', 'resolver', 'workflow', 'checkpoint', 'milestone'])
const VOLATILITIES = new Set(['stable', 'evolving', 'volatile'])
// Every lesson must be verified against official docs — including `stable` ones.
// Only recap lessons (checkpoint/milestone), which teach no feature surface, may
// omit sources.
const SOURCELESS_TYPES = new Set(['checkpoint', 'milestone'])

export function validateContent({ structure, metas, knownChartIds }: ValidateInput): string[] {
  const errors: string[] = []

  const moduleByCode = new Map<string, { levelId: string }>()
  for (const level of structure) {
    for (const mod of level.modules) moduleByCode.set(mod.code, { levelId: level.id })
  }

  const seenDotted = new Set<string>()
  const seenSlug = new Set<string>()
  const dottedIds = new Set(metas.map((m) => m.dottedId).filter(Boolean))

  for (const m of metas) {
    const at = m.file
    if (!m.dottedId) errors.push(`${at}: missing required field "id"`)
    if (!m.slug) errors.push(`${at}: missing required field "slug"`)
    if (!m.title) errors.push(`${at}: missing required field "title"`)
    if (typeof m.order !== 'number') errors.push(`${at}: missing required field "order"`)
    if (m.type && !LESSON_TYPES.has(m.type)) errors.push(`${at}: invalid type "${m.type}"`)
    if (m.volatility && !VOLATILITIES.has(m.volatility)) errors.push(`${at}: invalid volatility "${m.volatility}"`)
    if (
      m.verifiedAgainstDocsAt &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(m.verifiedAgainstDocsAt) || Number.isNaN(Date.parse(m.verifiedAgainstDocsAt)))
    )
      errors.push(`${at}: verifiedAgainstDocsAt "${m.verifiedAgainstDocsAt}" must be an ISO date (YYYY-MM-DD)`)

    if (m.dottedId) {
      if (seenDotted.has(m.dottedId)) errors.push(`${at}: duplicate id "${m.dottedId}"`)
      seenDotted.add(m.dottedId)
      const levelId = levelOf(m.dottedId)
      if (!levelId) errors.push(`${at}: id "${m.dottedId}" has an unknown level letter`)
      else if (levelId !== m.levelDir)
        errors.push(`${at}: id "${m.dottedId}" implies level "${levelId}" but file is under "${m.levelDir}"`)
      const code = moduleCodeOf(m.dottedId)
      const mod = moduleByCode.get(code)
      if (!mod) errors.push(`${at}: module "${code}" (from id "${m.dottedId}") not found in structure.ts`)
      else if (levelId && mod.levelId !== levelId)
        errors.push(`${at}: module "${code}" belongs to level "${mod.levelId}", not "${levelId}"`)
    }

    if (m.slug) {
      if (seenSlug.has(m.slug)) errors.push(`${at}: duplicate slug "${m.slug}"`)
      seenSlug.add(m.slug)
      if (path.basename(m.file, '.mdx') !== m.slug)
        errors.push(`${at}: slug "${m.slug}" must match the file name "${path.basename(m.file)}"`)
    }

    // Guard list-shaped fields: a YAML scalar/object instead of a list must be a
    // friendly validation error, not a crash inside the loops below (or in emit).
    for (const field of ['prerequisites', 'references', 'teaches', 'docsSources', 'interactive'] as const) {
      const value = m[field]
      if (value != null && !Array.isArray(value)) errors.push(`${at}: "${field}" must be a list`)
    }

    if (Array.isArray(m.prerequisites))
      for (const ref of m.prerequisites) if (!dottedIds.has(ref)) errors.push(`${at}: prerequisite "${ref}" does not resolve`)
    if (Array.isArray(m.references))
      for (const ref of m.references) if (!dottedIds.has(ref)) errors.push(`${at}: reference "${ref}" does not resolve`)
    if (Array.isArray(m.interactive))
      for (const it of m.interactive) if (!knownChartIds.has(it.spec)) errors.push(`${at}: interactive spec "${it.spec}" not in chart registry`)
    if (!SOURCELESS_TYPES.has(m.type ?? '') && (!Array.isArray(m.docsSources) || m.docsSources.length === 0))
      errors.push(`${at}: ${m.type ?? 'this'} lesson requires docsSources (only checkpoint/milestone lessons may omit them)`)
  }

  const ordersByModule = new Map<string, { order: number; file: string }[]>()
  for (const m of metas) {
    if (!m.dottedId || typeof m.order !== 'number') continue
    const code = moduleCodeOf(m.dottedId)
    ordersByModule.set(code, [...(ordersByModule.get(code) ?? []), { order: m.order, file: m.file }])
  }
  for (const [code, entries] of ordersByModule) {
    const sorted = [...entries].sort((a, b) => a.order - b.order)
    const files = sorted.map((e) => e.file)
    const orders = sorted.map((e) => e.order)
    if (orders.length !== new Set(orders).size) {
      errors.push(`module ${code}: duplicate order values (files: ${files.join(', ')})`)
      continue
    }
    const expected = orders.map((_, i) => i + 1)
    if (JSON.stringify(orders) !== JSON.stringify(expected))
      errors.push(`module ${code}: order values must be contiguous from 1, got [${orders.join(', ')}] (files: ${files.join(', ')})`)
  }

  return errors
}

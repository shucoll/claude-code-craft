import { pathToFileURL } from 'node:url'
import { moduleCodeOf } from './generate/ids.ts'
import { readAllLessonMeta } from './generate/frontmatter.ts'
import type { LessonMeta } from './generate/frontmatter.ts'
import { readStructure } from './readStructure.ts'
import { newProject } from './tsutil.ts'
import { DEFAULT_CONTENT_DIR, lessonsDir } from './paths.ts'
import type { LevelDef } from '../../src/content/structure.ts'

export const VOLATILITIES = ['stable', 'evolving', 'volatile'] as const
export type Volatility = (typeof VOLATILITIES)[number]

export interface LessonSummary {
  id: string
  slug: string
  title: string
  file: string
  volatility?: string
  verifiedAgainstDocsAt?: string
}

/**
 * Lessons in true curriculum order — level order, then module order, then the
 * lesson's own `order` — optionally filtered to a single volatility. A plain
 * dotted-id string sort is wrong here (`B3.10` would sort before `B3.9`); this
 * uses the numeric ordering from structure.ts + frontmatter instead. Modules
 * absent from structure.ts (which `validateContent` would reject) sort last so
 * a malformed tree still produces deterministic output rather than throwing.
 */
export function selectLessons(
  structure: LevelDef[],
  metas: LessonMeta[],
  opts: { volatility?: string } = {},
): LessonSummary[] {
  const moduleRank = new Map<string, { level: number; mod: number }>()
  for (const level of structure) for (const mod of level.modules) moduleRank.set(mod.code, { level: level.order, mod: mod.order })

  const rankOf = (m: LessonMeta) => {
    const r = moduleRank.get(moduleCodeOf(m.dottedId))
    return { level: r?.level ?? Infinity, mod: r?.mod ?? Infinity, order: m.order ?? Infinity }
  }

  const filtered = opts.volatility ? metas.filter((m) => m.volatility === opts.volatility) : metas

  return [...filtered]
    .sort((a, b) => {
      const ra = rankOf(a)
      const rb = rankOf(b)
      return ra.level - rb.level || ra.mod - rb.mod || ra.order - rb.order || (a.dottedId ?? '').localeCompare(b.dottedId ?? '')
    })
    .map((m) => ({
      id: m.dottedId,
      slug: m.slug,
      title: m.title,
      file: m.file,
      volatility: m.volatility,
      verifiedAgainstDocsAt: m.verifiedAgainstDocsAt,
    }))
}

function parseArgs(argv: string[]): { volatility?: string } {
  const out: { volatility?: string } = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--volatility') out.volatility = argv[++i]
  }
  return out
}

// Run only when invoked as a CLI (`tsx listLessons.ts`), not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { volatility } = parseArgs(process.argv.slice(2))
  if (volatility && !(VOLATILITIES as readonly string[]).includes(volatility)) {
    console.error(`invalid --volatility "${volatility}" (expected: ${VOLATILITIES.join(' | ')})`)
    process.exit(1)
  }
  const project = newProject()
  const structure = readStructure(project, DEFAULT_CONTENT_DIR)
  const metas = readAllLessonMeta(lessonsDir(DEFAULT_CONTENT_DIR))
  console.log(JSON.stringify(selectLessons(structure, metas, { volatility }), null, 2))
}

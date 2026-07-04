import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export interface InteractiveMeta {
  kind: string
  spec: string
}

/**
 * Raw, pre-validation view of a lesson's frontmatter. Values come straight from
 * gray-matter's untyped `data`, so at runtime `dottedId`/`slug`/`title` may be
 * absent or the wrong shape despite their declared types — that is `validateContent`'s
 * job to catch. Downstream consumers (emit) only ever run on metas that have passed
 * validation. (Phase 2 follow-up: split into a validated/normalized type after the gate.)
 */
export interface LessonMeta {
  dottedId: string
  slug: string
  title: string
  type?: string
  order?: number
  estimatedMinutes?: number
  volatility?: string
  verifiedAgainstDocsAt?: string
  prerequisites?: string[]
  teaches?: string[]
  references?: string[]
  docsSources?: string[]
  interactive?: InteractiveMeta[]
  /** Directory name under lessonsRoot, e.g. "beginner". */
  levelDir: string
  /** Absolute path to the .mdx file. */
  file: string
}

export function readLessonMeta(file: string, lessonsRoot: string): LessonMeta {
  const { data } = matter(fs.readFileSync(file, 'utf8'))
  const rel = path.relative(lessonsRoot, file)
  return {
    dottedId: data.id,
    slug: data.slug,
    title: data.title,
    type: data.type,
    order: data.order,
    estimatedMinutes: data.estimatedMinutes,
    volatility: data.volatility,
    verifiedAgainstDocsAt: data.verifiedAgainstDocsAt,
    prerequisites: data.prerequisites,
    teaches: data.teaches,
    references: data.references,
    docsSources: data.docsSources,
    interactive: data.interactive,
    levelDir: rel.split(path.sep)[0],
    file,
  }
}

function walkMdx(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkMdx(full))
    else if (entry.isFile() && entry.name.endsWith('.mdx')) out.push(full)
  }
  return out
}

export function readAllLessonMeta(lessonsRoot: string): LessonMeta[] {
  return walkMdx(lessonsRoot)
    .map((f) => readLessonMeta(f, lessonsRoot))
    .sort((a, b) => (a.dottedId ?? '').localeCompare(b.dottedId ?? ''))
}

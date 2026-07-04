import fs from 'node:fs'
import { scaffoldLesson, scaffoldOutline, type Outline, type ScaffoldReport } from './scaffold.ts'
import { scaffoldLanguage } from './language.ts'
import { checkContent } from './check.ts'
import { generate } from './generateCurriculum.ts'
import type { LessonType } from './lessonTemplate.ts'

function parseFlags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      out[arg.slice(2)] = next
      i++
    } else {
      out[arg.slice(2)] = ''
    }
  }
  return out
}

function titleCase(id: string): string {
  return id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function report(r: ScaffoldReport): void {
  for (const f of r.created) console.log(`created ${f}`)
  for (const f of r.changed) console.log(`changed ${f}`)
}

function requireFlags(flags: Record<string, string>, names: string[], command: string): void {
  const missing = names.filter((n) => !flags[n])
  if (missing.length > 0) {
    throw new Error(`${command}: missing required flag(s): ${missing.map((n) => `--${n}`).join(', ')}`)
  }
}

function list(v: string | undefined): string[] | undefined {
  return v ? v.split(',').map((x) => x.trim()).filter(Boolean) : undefined
}

function parseInteractive(v: string | undefined): { kind: string; spec: string }[] | undefined {
  // format: "diagram:spec-id,decision-tree:other-id"
  if (!v) return undefined
  return v
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((pair) => {
      const [kind, spec] = pair.split(':')
      if (!kind || !spec) throw new Error(`lesson: --interactive entry "${pair}" must be "kind:spec"`)
      return { kind, spec }
    })
}

const VALID_TYPES = new Set(['core', 'resolver', 'workflow', 'checkpoint', 'milestone'])
const VALID_VOLATILITIES = new Set(['stable', 'evolving', 'volatile'])

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function runGenerator(): void {
  if (process.env.CCC_SKIP_GEN) return
  generate()
}

export function run(argv: string[]): number {
  const [command, ...rest] = argv
  const flags = parseFlags(rest)
  try {
    switch (command) {
      case 'lesson': {
        requireFlags(flags, ['level', 'module', 'slug', 'title', 'type'], 'lesson')
        if (!VALID_TYPES.has(flags.type)) throw new Error(`lesson: invalid --type "${flags.type}"`)
        if (flags.volatility && !VALID_VOLATILITIES.has(flags.volatility)) throw new Error(`lesson: invalid --volatility "${flags.volatility}"`)
        let estimatedMinutes: number | undefined
        if (flags['estimated-minutes']) {
          estimatedMinutes = Number(flags['estimated-minutes'])
          if (!Number.isFinite(estimatedMinutes)) throw new Error('lesson: --estimated-minutes must be a number')
        }
        const r = scaffoldLesson({
          level: { id: flags.level, title: flags['level-title'] || titleCase(flags.level) },
          module: {
            code: flags.module,
            slug: flags['module-slug'] || flags.module.toLowerCase(),
            title: flags['module-title'] || titleCase(flags.module),
          },
          slug: flags.slug,
          title: flags.title,
          type: flags.type as LessonType,
          estimatedMinutes,
          volatility: flags.volatility || undefined,
          verifiedAgainstDocsAt: flags['verified-at'] || today(),
          prerequisites: list(flags.prerequisites),
          teaches: list(flags.teaches),
          references: list(flags.references),
          docsSources: list(flags['docs-sources']),
          interactive: parseInteractive(flags.interactive),
          snippets: list(flags.snippets),
          prompts: list(flags.prompts),
        })
        report(r)
        console.log(`assigned id ${r.dottedId}`)
        runGenerator()
        return 0
      }
      case 'outline': {
        requireFlags(flags, ['file'], 'outline')
        const outline = JSON.parse(fs.readFileSync(flags.file, 'utf8')) as Outline
        report(scaffoldOutline(outline))
        runGenerator()
        return 0
      }
      case 'language': {
        requireFlags(flags, ['id', 'label'], 'language')
        report(scaffoldLanguage({ id: flags.id, label: flags.label, icon: flags.icon || undefined }))
        return 0
      }
      case 'check': {
        const { errors, warnings } = checkContent()
        for (const w of warnings) console.log(`warn  ${w}`)
        for (const e of errors) console.error(`ERROR ${e}`)
        console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`)
        return errors.length > 0 ? 1 : 0
      }
      default:
        console.error(`Unknown command: ${command ?? '(none)'}. Use: lesson | outline | language | check`)
        return 2
    }
  } catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`)
    return 2
  }
}

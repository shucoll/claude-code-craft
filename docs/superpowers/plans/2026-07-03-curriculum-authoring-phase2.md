# Curriculum Authoring — Phase 2 (Scaffolder + Skill + Content Check) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the authoring scaffolder to be frontmatter-first (per-`type` templates, auto-assigned dotted id, opt-in snippets), grow `check` into a full content check that also runs the frontmatter validator, and rewrite the `new-lesson` skill to match.

**Architecture:** Phase 1 made lesson frontmatter the source of truth and `curriculum.ts` a generated, committed artifact. Phase 2 finishes the authoring loop: the scaffolder stops editing `curriculum.ts` (the generator owns it) and instead (a) edits the hand-written `structure.ts` manifest for new levels/modules, and (b) writes `.mdx` files with complete frontmatter using a per-`type` body template. The dotted `id` is auto-assigned from the target module's next free `order`. Snippets/prompts become opt-in (inline fenced code is the default). The CLI runs the generator after scaffolding so the skeleton appears in `curriculum.ts` immediately. The `check` command additionally runs the §4.2 frontmatter validator, so authors get friendly errors without a full regen.

**Tech Stack:** TypeScript (strict), ts-morph (AST edits of `structure.ts`/packs), gray-matter (read lesson frontmatter — via the Phase 1 `readAllLessonMeta`), tsx (runner), Vitest (node env).

## Global Constraints

*(Every task's requirements implicitly include this section. Copy verbatim into reviewer prompts.)*

- **`scripts/authoring/**` compiles under nodenext + verbatimModuleSyntax + allowImportingTsExtensions.** All intra-`scripts/authoring` imports use explicit `.ts` extensions; type-only imports use `import type`.
- **Authoring tests** start with `// @vitest-environment node`, use temp directories created with `fs.mkdtempSync` (cleaned up in `afterEach`), and **never** read or mutate the real `src/content`.
- **Never hand-edit `curriculum.ts`.** It is generated (Phase 1). The scaffolder must NOT import or edit `curriculum.ts`; it edits `structure.ts` + writes `.mdx`, then the CLI runs the generator.
- **Node-safe imports only.** Node-run authoring code must never import the app chart module graph (`src/content/charts/index.ts` → extensionless imports + `.mdx`). Use the import-free `src/content/charts/chartIds.ts` for chart ids.
- **Generated/edited TS style:** 2-space indent, single quotes, trailing commas — always go through `newProject()` + `formatAndSave()` from `tsutil.ts`.
- **Dotted id format:** `<LETTER><moduleNumber>.<order>`, e.g. `B1.3`. Level letters `B`→beginner, `I`→intermediate, `A`→advanced (the map lives in `scripts/authoring/generate/ids.ts`; `moduleCodeOf`/`levelOf` already exist).
- **Frontmatter YAML** is written with keys in this exact order: `id, slug, title, type, order, estimatedMinutes, volatility, verifiedAgainstDocsAt, prerequisites, teaches, references, docsSources, interactive`. `level` and `module` are **never** written (derived from `id`). String values are emitted with `JSON.stringify` (valid double-quoted YAML scalars); arrays as flow sequences `["a", "b"]`; `interactive` as a block sequence of `{ kind, spec }`.
- **STUB sentinel** `@@TODO@@` (from `paths.ts`) is used only for opt-in snippet/prompt stubs and for author-guidance MDX comments — **never** inside frontmatter values.
- **TypeScript strict; no `any`** in committed code.
- **Enums:** `type ∈ {core, resolver, workflow, checkpoint, milestone}`; `volatility ∈ {stable, evolving, volatile}`; `interactive[].kind ∈ {diagram, decision-tree, simulator, quiz}`.
- **`structure.ts` shape (Phase 1, do not change):** `ModuleDef { code: string; slug: string; title: string; order: number }`; `LevelDef { id: string; title: string; order: number; modules: ModuleDef[] }`; `export const structure: LevelDef[]`.

---

## File Structure

**New files:**
- `scripts/authoring/structureEdit.ts` — ts-morph codemod for `structure.ts` (`ensureLevel`, `ensureModule`), auto-assigns `order`.
- `scripts/authoring/structureEdit.test.ts`
- `scripts/authoring/nextId.ts` — reads existing lesson frontmatter for a module, returns the next `{ dottedId, order }`.
- `scripts/authoring/nextId.test.ts`

**Rewritten files:**
- `scripts/authoring/lessonTemplate.ts` — per-`type` frontmatter + body templates (replaces the single Snippet/TryPrompt template).
- `scripts/authoring/lessonTemplate.test.ts` — NEW (was previously tested inside `scaffold.test.ts`).
- `scripts/authoring/scaffold.ts` — orchestration: edit `structure.ts`, auto-id, write frontmatter MDX, opt-in packs. No longer touches `curriculum.ts`.
- `scripts/authoring/scaffold.test.ts` — rewritten for the new model.
- `scripts/authoring/cliCore.ts` — new `lesson`/`outline` flags; runs the generator after scaffolding; `check` prints validation errors.
- `scripts/authoring/cliCore.test.ts` — extended.
- `scripts/authoring/check.ts` — additionally runs `validateContent` over lesson frontmatter.
- `scripts/authoring/check.test.ts` — extended.
- `.claude/skills/new-lesson/SKILL.md` — frontmatter-first rewrite.
- `.claude/commands/check-snippets.md` — reworded for content check.
- `CLAUDE.md` — "Adding lessons & languages" + "Commands" wording touch-ups.

**Deleted files:**
- `scripts/authoring/curriculum.ts` — the obsolete `curriculum.ts` ts-morph codemod (`ensureLevel`/`ensureModule`/`addLesson`). Replaced by `structureEdit.ts` + the generator.
- `scripts/authoring/curriculum.test.ts` — its test.

**Unchanged (consumed as-is):**
- `scripts/authoring/generate/frontmatter.ts` (`readAllLessonMeta`, `LessonMeta`), `generate/validate.ts` (`validateContent`), `generate/ids.ts` (`moduleCodeOf`, `levelOf`), `generateCurriculum.ts` (`generate(contentDir?)`), `paths.ts`, `packs.ts`, `tsutil.ts`, `src/content/charts/chartIds.ts`.

---

## Task 1: `structure.ts` codemod (`structureEdit.ts`)

Idempotent ts-morph edits that add a level or module to `src/content/structure.ts`, auto-assigning the next `order`. Replaces the level/module half of the old `curriculum.ts` codemod.

**Files:**
- Create: `scripts/authoring/structureEdit.ts`
- Test: `scripts/authoring/structureEdit.test.ts`

**Interfaces:**
- Consumes: `newProject`, `sq` from `./tsutil.ts` (`sq` single-quotes+escapes a string for TS emission).
- Produces:
  - `ensureLevel(sf: SourceFile, level: { id: string; title: string }): ObjectLiteralExpression` — returns the level object literal (existing or newly appended). New levels get `order = maxSiblingOrder + 1` (or `1`) and `modules: []`.
  - `ensureModule(levelObj: ObjectLiteralExpression, mod: { code: string; slug: string; title: string }): ObjectLiteralExpression` — returns the module object literal within that level's `modules` array; new modules get `order = maxSiblingOrder + 1` (or `1`).

- [ ] **Step 1: Write the failing tests**

```ts
// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { newProject, formatAndSave } from './tsutil.ts'
import { ensureLevel, ensureModule } from './structureEdit.ts'

const tmpDirs: string[] = []

function seedStructure(body: string): { dir: string; file: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-struct-'))
  tmpDirs.push(dir)
  const file = path.join(dir, 'structure.ts')
  fs.writeFileSync(file, body)
  return { dir, file }
}

const BASE = `export const structure = [
  {
    id: 'beginner',
    title: 'Beginner',
    order: 1,
    modules: [
      { code: 'B1', slug: 'basics', title: 'The Basics', order: 1 },
    ],
  },
]
`

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

test('ensureLevel appends a new level with the next order and empty modules', () => {
  const { file } = seedStructure(BASE)
  const project = newProject()
  const sf = project.addSourceFileAtPath(file)
  ensureLevel(sf, { id: 'intermediate', title: 'Intermediate' })
  formatAndSave(sf)
  const out = fs.readFileSync(file, 'utf8')
  expect(out).toContain("id: 'intermediate'")
  expect(out).toContain('order: 2')
  expect(out).toContain('modules: []')
})

test('ensureLevel is idempotent (returns existing, adds nothing)', () => {
  const { file } = seedStructure(BASE)
  const project = newProject()
  const sf = project.addSourceFileAtPath(file)
  ensureLevel(sf, { id: 'beginner', title: 'Beginner' })
  formatAndSave(sf)
  const out = fs.readFileSync(file, 'utf8')
  expect(out.match(/id: 'beginner'/g)?.length).toBe(1)
})

test('ensureModule appends a module with the next order within its level', () => {
  const { file } = seedStructure(BASE)
  const project = newProject()
  const sf = project.addSourceFileAtPath(file)
  const level = ensureLevel(sf, { id: 'beginner', title: 'Beginner' })
  ensureModule(level, { code: 'B2', slug: 'sessions', title: 'Sessions and Context' })
  formatAndSave(sf)
  const out = fs.readFileSync(file, 'utf8')
  expect(out).toContain("code: 'B2'")
  expect(out).toContain("slug: 'sessions'")
  // B1 has order 1, so B2 must be order 2
  expect(out).toMatch(/code: 'B2'[^}]*order: 2/)
})

test('ensureModule is idempotent', () => {
  const { file } = seedStructure(BASE)
  const project = newProject()
  const sf = project.addSourceFileAtPath(file)
  const level = ensureLevel(sf, { id: 'beginner', title: 'Beginner' })
  ensureModule(level, { code: 'B1', slug: 'basics', title: 'The Basics' })
  formatAndSave(sf)
  const out = fs.readFileSync(file, 'utf8')
  expect(out.match(/code: 'B1'/g)?.length).toBe(1)
})
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npx vitest run scripts/authoring/structureEdit.test.ts`
Expected: FAIL (`Cannot find module './structureEdit.ts'`). (A transient `tsc`-on-edit hook "Cannot find module" during RED is expected; ignore it.)

- [ ] **Step 3: Implement `structureEdit.ts`**

```ts
import { Node, SyntaxKind } from 'ts-morph'
import type { ArrayLiteralExpression, ObjectLiteralExpression, SourceFile } from 'ts-morph'
import { sq } from './tsutil.ts'

function getStringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
  const prop = obj.getProperty(name)
  if (!prop || !Node.isPropertyAssignment(prop)) return undefined
  const init = prop.getInitializer()
  return init && Node.isStringLiteral(init) ? init.getLiteralText() : undefined
}

function getArrayProp(obj: ObjectLiteralExpression, name: string): ArrayLiteralExpression {
  return obj
    .getPropertyOrThrow(name)
    .asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
}

function objectsOf(arr: ArrayLiteralExpression): ObjectLiteralExpression[] {
  return arr.getElements().filter(Node.isObjectLiteralExpression)
}

function findBy(arr: ArrayLiteralExpression, prop: string, value: string): ObjectLiteralExpression | undefined {
  return objectsOf(arr).find((el) => getStringProp(el, prop) === value)
}

function nextOrder(arr: ArrayLiteralExpression): number {
  let max = 0
  for (const el of objectsOf(arr)) {
    const prop = el.getProperty('order')
    if (prop && Node.isPropertyAssignment(prop)) {
      const init = prop.getInitializer()
      const n = init ? Number(init.getText()) : NaN
      if (Number.isFinite(n) && n > max) max = n
    }
  }
  return max + 1
}

function structureArray(sf: SourceFile): ArrayLiteralExpression {
  return sf.getVariableDeclarationOrThrow('structure').getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
}

export function ensureLevel(sf: SourceFile, level: { id: string; title: string }): ObjectLiteralExpression {
  const arr = structureArray(sf)
  const existing = findBy(arr, 'id', level.id)
  if (existing) return existing
  const order = nextOrder(arr)
  arr.addElement(`{ id: ${sq(level.id)}, title: ${sq(level.title)}, order: ${order}, modules: [] }`)
  return findBy(arr, 'id', level.id)!
}

export function ensureModule(
  levelObj: ObjectLiteralExpression,
  mod: { code: string; slug: string; title: string },
): ObjectLiteralExpression {
  const modules = getArrayProp(levelObj, 'modules')
  const existing = findBy(modules, 'code', mod.code)
  if (existing) return existing
  const order = nextOrder(modules)
  modules.addElement(`{ code: ${sq(mod.code)}, slug: ${sq(mod.slug)}, title: ${sq(mod.title)}, order: ${order} }`)
  return findBy(modules, 'code', mod.code)!
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npx vitest run scripts/authoring/structureEdit.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add scripts/authoring/structureEdit.ts scripts/authoring/structureEdit.test.ts
git commit -m "feat(authoring): structure.ts codemod (ensureLevel/ensureModule, auto-order)"
```

---

## Task 2: Auto-id from module frontmatter (`nextId.ts`)

Computes the next dotted id + order for a lesson being added to a module by reading the existing lesson frontmatter (reusing the Phase 1 reader).

**Files:**
- Create: `scripts/authoring/nextId.ts`
- Test: `scripts/authoring/nextId.test.ts`

**Interfaces:**
- Consumes: `readAllLessonMeta` from `./generate/frontmatter.ts` (returns `LessonMeta[]` from a lessons root; each has `dottedId`, `order`); `moduleCodeOf` from `./generate/ids.ts` (`"B2.3" → "B2"`); `lessonsDir` from `./paths.ts`.
- Produces: `nextLessonId(contentDir: string, moduleCode: string): { dottedId: string; order: number }` — `order` = (max existing order in that module) + 1, or 1 if none; `dottedId` = `` `${moduleCode}.${order}` ``.

- [ ] **Step 1: Write the failing tests**

```ts
// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { nextLessonId } from './nextId.ts'

const tmpDirs: string[] = []

function seed(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-nextid-'))
  tmpDirs.push(dir)
  fs.mkdirSync(path.join(dir, 'lessons/beginner'), { recursive: true })
  return dir
}

function writeLesson(dir: string, level: string, slug: string, id: string, order: number): void {
  const body = `---\nid: "${id}"\nslug: "${slug}"\ntitle: "T"\ntype: "core"\norder: ${order}\n---\n\n# T\n`
  fs.writeFileSync(path.join(dir, 'lessons', level, `${slug}.mdx`), body)
}

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

test('returns .1 for an empty module', () => {
  const dir = seed()
  expect(nextLessonId(dir, 'B1')).toEqual({ dottedId: 'B1.1', order: 1 })
})

test('returns max order + 1 for a populated module', () => {
  const dir = seed()
  writeLesson(dir, 'beginner', 'a', 'B1.1', 1)
  writeLesson(dir, 'beginner', 'b', 'B1.2', 2)
  expect(nextLessonId(dir, 'B1')).toEqual({ dottedId: 'B1.3', order: 3 })
})

test('ignores lessons from other modules', () => {
  const dir = seed()
  fs.mkdirSync(path.join(dir, 'lessons/intermediate'), { recursive: true })
  writeLesson(dir, 'beginner', 'a', 'B1.1', 1)
  writeLesson(dir, 'intermediate', 'x', 'I1.5', 5)
  expect(nextLessonId(dir, 'B1')).toEqual({ dottedId: 'B1.2', order: 2 })
})
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npx vitest run scripts/authoring/nextId.test.ts`
Expected: FAIL (`Cannot find module './nextId.ts'`).

- [ ] **Step 3: Implement `nextId.ts`**

```ts
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
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npx vitest run scripts/authoring/nextId.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add scripts/authoring/nextId.ts scripts/authoring/nextId.test.ts
git commit -m "feat(authoring): auto-assign next dotted id/order from module frontmatter"
```

---

## Task 3: Per-`type` frontmatter + body templates (`lessonTemplate.ts`)

Rewrite `lessonTemplate.ts` to emit a complete frontmatter block plus a per-`type` body skeleton matching the curriculum anatomies (v3 §1.2/§1.3/§1.7). Pure string function; no I/O.

**Files:**
- Rewrite: `scripts/authoring/lessonTemplate.ts`
- Create: `scripts/authoring/lessonTemplate.test.ts`

**Interfaces:**
- Consumes: `STUB` from `./paths.ts`.
- Produces:
  - `interface LessonFrontmatter { id: string; slug: string; title: string; type: LessonType; order: number; estimatedMinutes?: number; volatility: string; verifiedAgainstDocsAt: string; prerequisites?: string[]; teaches?: string[]; references?: string[]; docsSources?: string[]; interactive?: { kind: string; spec: string }[] }`
  - `type LessonType = 'core' | 'resolver' | 'workflow' | 'checkpoint' | 'milestone'`
  - `interface TemplateOptions { snippets?: string[]; prompts?: string[] }`
  - `renderLesson(fm: LessonFrontmatter, opts?: TemplateOptions): string` — returns the full `.mdx` text (frontmatter + `# title` + per-type sections). Opt-in `<Snippet>`/`<TryPrompt>` tags appear only when `opts.snippets`/`opts.prompts` are non-empty; otherwise the body uses inline fenced-code placeholders.

- [ ] **Step 1: Write the failing tests**

```ts
import { renderLesson } from './lessonTemplate.ts'

const base = {
  id: 'B2.3',
  slug: 'review-changes',
  title: 'Reviewing Changes',
  type: 'core' as const,
  order: 3,
  volatility: 'stable',
  verifiedAgainstDocsAt: '2026-07-03',
}

test('emits a frontmatter block with keys in canonical order and no level/module', () => {
  const out = renderLesson(base)
  expect(out.startsWith('---\n')).toBe(true)
  expect(out).toContain('id: "B2.3"')
  expect(out).toContain('slug: "review-changes"')
  expect(out).toContain('type: "core"')
  expect(out).toContain('order: 3')
  expect(out).toContain('volatility: "stable"')
  expect(out).not.toContain('level:')
  expect(out).not.toContain('module:')
  // id precedes slug precedes title precedes type
  expect(out.indexOf('id:')).toBeLessThan(out.indexOf('slug:'))
  expect(out.indexOf('slug:')).toBeLessThan(out.indexOf('title:'))
  expect(out.indexOf('title:')).toBeLessThan(out.indexOf('type:'))
})

test('renders arrays as flow sequences and interactive as a block sequence', () => {
  const out = renderLesson({
    ...base,
    prerequisites: ['B2.2'],
    references: ['B2.1'],
    docsSources: ['https://code.claude.com/docs/en/x.md'],
    interactive: [{ kind: 'diagram', spec: 'demo' }],
  })
  expect(out).toContain('prerequisites: ["B2.2"]')
  expect(out).toContain('references: ["B2.1"]')
  expect(out).toContain('docsSources: ["https://code.claude.com/docs/en/x.md"]')
  expect(out).toContain('interactive:')
  expect(out).toContain('- kind: "diagram"')
  expect(out).toContain('spec: "demo"')
})

test('core body carries the anatomy section headings in order', () => {
  const out = renderLesson(base)
  const idxOf = (h: string) => out.indexOf(h)
  expect(idxOf('# Reviewing Changes')).toBeGreaterThan(0)
  expect(idxOf('## The problem')).toBeGreaterThan(idxOf('# Reviewing Changes'))
  expect(idxOf('## The concept')).toBeGreaterThan(idxOf('## The problem'))
  expect(idxOf('## How it works')).toBeGreaterThan(idxOf('## The concept'))
  expect(idxOf('## Walkthrough')).toBeGreaterThan(idxOf('## How it works'))
  expect(idxOf('## Pitfalls')).toBeGreaterThan(idxOf('## Walkthrough'))
  expect(idxOf('## Try It')).toBeGreaterThan(idxOf('## Pitfalls'))
  expect(idxOf('## FAQ')).toBeGreaterThan(idxOf('## Try It'))
  expect(idxOf('## Where next')).toBeGreaterThan(idxOf('## FAQ'))
})

test('resolver body carries the resolver anatomy headings', () => {
  const out = renderLesson({ ...base, type: 'resolver' })
  expect(out).toContain('## The confusion')
  expect(out).toContain('## Side-by-side')
  expect(out).toContain('## Decision tree')
  expect(out).toContain('## Scenario walkthroughs')
  expect(out).toContain('## Edge cases')
})

test('checkpoint and milestone bodies carry their headings', () => {
  const cp = renderLesson({ ...base, type: 'checkpoint' })
  expect(cp).toContain('## The exercise')
  expect(cp).toContain('## Self-check')
  const ms = renderLesson({ ...base, type: 'milestone' })
  expect(ms).toContain('## Goal for this stage')
  expect(ms).toContain('## Reasoning recap')
})

test('snippets/prompts are opt-in: absent by default, present when requested', () => {
  expect(renderLesson(base)).not.toContain('<Snippet')
  expect(renderLesson(base)).not.toContain('<TryPrompt')
  const withOpts = renderLesson(base, { snippets: ['review-example'], prompts: ['review-it'] })
  expect(withOpts).toContain('<Snippet id="review-example" />')
  expect(withOpts).toContain('<TryPrompt id="review-it" />')
})

test('interactive core lesson embeds the chart via ChartEmbed', () => {
  const out = renderLesson({ ...base, interactive: [{ kind: 'diagram', spec: 'agentic-loop' }] })
  expect(out).toContain('<ChartEmbed id="agentic-loop" />')
})
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npx vitest run scripts/authoring/lessonTemplate.test.ts`
Expected: FAIL (old `lessonTemplate` has a different signature / the new symbols don't exist).

- [ ] **Step 3: Rewrite `lessonTemplate.ts`**

```ts
import { STUB } from './paths.ts'

export type LessonType = 'core' | 'resolver' | 'workflow' | 'checkpoint' | 'milestone'

export interface LessonFrontmatter {
  id: string
  slug: string
  title: string
  type: LessonType
  order: number
  estimatedMinutes?: number
  volatility: string
  verifiedAgainstDocsAt: string
  prerequisites?: string[]
  teaches?: string[]
  references?: string[]
  docsSources?: string[]
  interactive?: { kind: string; spec: string }[]
}

export interface TemplateOptions {
  snippets?: string[]
  prompts?: string[]
}

const s = (v: string): string => JSON.stringify(v) // valid double-quoted YAML scalar
const seq = (xs: string[]): string => `[${xs.map(s).join(', ')}]`

function frontmatter(fm: LessonFrontmatter): string {
  const lines: string[] = ['---']
  lines.push(`id: ${s(fm.id)}`)
  lines.push(`slug: ${s(fm.slug)}`)
  lines.push(`title: ${s(fm.title)}`)
  lines.push(`type: ${s(fm.type)}`)
  lines.push(`order: ${fm.order}`)
  if (typeof fm.estimatedMinutes === 'number') lines.push(`estimatedMinutes: ${fm.estimatedMinutes}`)
  lines.push(`volatility: ${s(fm.volatility)}`)
  lines.push(`verifiedAgainstDocsAt: ${s(fm.verifiedAgainstDocsAt)}`)
  if (fm.prerequisites?.length) lines.push(`prerequisites: ${seq(fm.prerequisites)}`)
  if (fm.teaches?.length) lines.push(`teaches: ${seq(fm.teaches)}`)
  if (fm.references?.length) lines.push(`references: ${seq(fm.references)}`)
  if (fm.docsSources?.length) lines.push(`docsSources: ${seq(fm.docsSources)}`)
  if (fm.interactive?.length) {
    lines.push('interactive:')
    for (const it of fm.interactive) {
      lines.push(`  - kind: ${s(it.kind)}`)
      lines.push(`    spec: ${s(it.spec)}`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

const todo = (hint: string): string => `{/* ${STUB} ${hint} */}`

function chartBlock(fm: LessonFrontmatter): string {
  if (!fm.interactive?.length) return ''
  return fm.interactive.map((it) => `<ChartEmbed id="${it.spec}" />`).join('\n\n')
}

function optIn(opts: TemplateOptions | undefined): string {
  const parts: string[] = []
  for (const id of opts?.snippets ?? []) parts.push(`<Snippet id="${id}" />`)
  for (const id of opts?.prompts ?? []) parts.push(`<TryPrompt id="${id}" />`)
  return parts.join('\n\n')
}

function coreBody(fm: LessonFrontmatter, opts?: TemplateOptions): string {
  const chart = chartBlock(fm)
  return [
    '## The problem',
    todo('2–4 sentence scenario the learner recognizes; the pain this solves.'),
    '## The concept',
    todo('What it is, plain language, one analogy maximum.'),
    '## How it works',
    todo('Mechanics: what happens under the hood; files/config; what loads into context and when.'),
    '## Walkthrough',
    todo('One fully worked example — real commands, real file contents, representative output.'),
    optIn(opts),
    '## Use-case scenarios',
    todo('3–5 short "You want X → do Y because Z" scenarios; include one near-miss.'),
    '## When to use / when not to use',
    todo('Two-column guidance; include the context/token/complexity cost.'),
    '## Pitfalls',
    todo('3–6 real mistakes, each with the observable symptom and the fix.'),
    ...(chart ? ['## Interactive element', chart] : []),
    '## Try It',
    todo('Hands-on 5–15 min exercise with self-verifiable success criteria.'),
    '## FAQ',
    todo('The mustAnswer questions not covered above, answered directly.'),
    '## Where next',
    todo('Cross-links: prerequisites recap + forward teasers (see §1.6).'),
  ]
    .filter(Boolean)
    .join('\n\n')
}

function resolverBody(fm: LessonFrontmatter): string {
  const chart = chartBlock(fm)
  return [
    '## The confusion',
    todo('State exactly what people mix up and why the confusion exists.'),
    '## Side-by-side',
    todo('Compare the options on: what it does, when it runs/loads, cost, who controls it, persistence.'),
    '## Decision tree',
    chart || todo('The resolver logic as a flowchart (static clickable diagram in Phase 1).'),
    '## Scenario walkthroughs',
    todo('5–8 rapid-fire scenarios, each stated then resolved with the recommended option + reasoning.'),
    '## Edge cases',
    todo('Situations where two options are both defensible, and what tips the balance.'),
  ]
    .filter(Boolean)
    .join('\n\n')
}

function workflowBody(fm: LessonFrontmatter, opts?: TemplateOptions): string {
  return [
    '## When to use this workflow',
    todo('The recurring situation this repeatable practice addresses.'),
    '## The workflow',
    todo('The steps as an ordered list; each step names the concept it reuses.'),
    '## Guided walkthrough',
    todo('Walk the workflow once end-to-end on a concrete example.'),
    optIn(opts),
    '## Variations & pitfalls',
    todo('Common variations and the mistakes that derail the workflow.'),
    '## Where next',
    todo('Cross-links (see §1.6).'),
  ]
    .filter(Boolean)
    .join('\n\n')
}

function checkpointBody(): string {
  return [
    '## What you should be able to do',
    todo('The competencies this checkpoint verifies (no gating; skippable).'),
    '## The exercise',
    todo('One ~10-minute hands-on task.'),
    '## Self-check',
    todo('Explicit success criteria the learner grades themselves against.'),
  ].join('\n\n')
}

function milestoneBody(): string {
  return [
    '## Goal for this stage',
    todo('The working artifact this milestone produces.'),
    '## Steps',
    todo('The build steps for this stage.'),
    '## The artifact',
    todo('What "done" looks like; how to verify it works.'),
    '## Reasoning recap',
    todo('Why these choices — the transferable lesson behind the build.'),
  ].join('\n\n')
}

export function renderLesson(fm: LessonFrontmatter, opts?: TemplateOptions): string {
  let body: string
  switch (fm.type) {
    case 'resolver':
      body = resolverBody(fm)
      break
    case 'workflow':
      body = workflowBody(fm, opts)
      break
    case 'checkpoint':
      body = checkpointBody()
      break
    case 'milestone':
      body = milestoneBody()
      break
    default:
      body = coreBody(fm, opts)
  }
  return `${frontmatter(fm)}\n\n# ${fm.title}\n\n${body}\n`
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npx vitest run scripts/authoring/lessonTemplate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/authoring/lessonTemplate.ts scripts/authoring/lessonTemplate.test.ts
git commit -m "feat(authoring): per-type frontmatter + body templates"
```

---

## Task 4: Scaffolder rewrite (`scaffold.ts`) + delete the old curriculum codemod

`scaffoldLesson` / `scaffoldOutline` now edit `structure.ts` (not `curriculum.ts`), auto-assign the dotted id, write frontmatter MDX via `renderLesson`, and stub packs only when snippets/prompts are opted in. Deletes `scripts/authoring/curriculum.ts` + `curriculum.test.ts`.

**Files:**
- Rewrite: `scripts/authoring/scaffold.ts`
- Rewrite: `scripts/authoring/scaffold.test.ts`
- Delete: `scripts/authoring/curriculum.ts`, `scripts/authoring/curriculum.test.ts`

**Interfaces:**
- Consumes: `ensureLevel`, `ensureModule` from `./structureEdit.ts`; `nextLessonId` from `./nextId.ts`; `renderLesson`, `LessonFrontmatter`, `LessonType`, `TemplateOptions` from `./lessonTemplate.ts`; `addSnippetStub`, `addPromptStub` from `./packs.ts`; `newProject`, `formatAndSave` from `./tsutil.ts`; `DEFAULT_CONTENT_DIR`, `DEFAULT_LANGUAGE`, `lessonsDir`, `packFile`, `structureFile` from `./paths.ts` (**add `structureFile`** — see step 3a).
- Produces:
  - `interface LessonSpec { level: { id: string; title: string }; module: { code: string; slug: string; title: string }; slug: string; title: string; type: LessonType; estimatedMinutes?: number; volatility?: string; verifiedAgainstDocsAt: string; prerequisites?: string[]; teaches?: string[]; references?: string[]; docsSources?: string[]; interactive?: { kind: string; spec: string }[]; snippets?: string[]; prompts?: string[] }`
  - `interface Outline { levels: OutlineLevel[] }` with `OutlineLevel { id; title; modules: OutlineModule[] }`, `OutlineModule { code; slug; title; lessons: OutlineLesson[] }`, `OutlineLesson { slug; title; type; estimatedMinutes?; volatility?; verifiedAgainstDocsAt; prerequisites?; teaches?; references?; docsSources?; interactive?; snippets?; prompts? }`
  - `interface ScaffoldReport { created: string[]; changed: string[] }`
  - `scaffoldLesson(spec: LessonSpec, contentDir?: string): ScaffoldReport & { dottedId: string }`
  - `scaffoldOutline(outline: Outline, contentDir?: string): ScaffoldReport`
- **Note:** the scaffolder does NOT run the generator (that happens in the CLI layer, Task 5) so it stays unit-testable against temp dirs without the full app graph.

- [ ] **Step 1a: Add `structureFile` to `paths.ts`**

Add to `scripts/authoring/paths.ts`:

```ts
export const structureFile = (contentDir: string): string => path.join(contentDir, 'structure.ts')
```

- [ ] **Step 1b: Write the failing tests (rewrite `scaffold.test.ts`)**

```ts
// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import matter from 'gray-matter'
import { scaffoldLesson, scaffoldOutline } from './scaffold.ts'

const tmpDirs: string[] = []

function seedContent(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-'))
  tmpDirs.push(dir)
  fs.mkdirSync(path.join(dir, 'lessons'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'snippets'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'structure.ts'),
    `export const structure = [
  { id: 'beginner', title: 'Beginner', order: 1, modules: [
    { code: 'B1', slug: 'basics', title: 'The Basics', order: 1 },
  ] },
]
`,
  )
  const emptyPack = (name: string, label: string) => `import type { LanguagePack } from '../types'

const ${name}: LanguagePack = {
  meta: { id: '${name}', label: '${label}' },
  snippets: {},
  prompts: {},
}

export default ${name}
`
  fs.writeFileSync(path.join(dir, 'snippets/javascript.ts'), emptyPack('javascript', 'JavaScript'))
  fs.writeFileSync(path.join(dir, 'snippets/python.ts'), emptyPack('python', 'Python'))
  return dir
}

const spec = {
  level: { id: 'beginner', title: 'Beginner' },
  module: { code: 'B1', slug: 'basics', title: 'The Basics' },
  slug: 'first-edit',
  title: 'Your First Edit',
  type: 'core' as const,
  verifiedAgainstDocsAt: '2026-07-03',
}

afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

test('scaffoldLesson writes frontmatter MDX with an auto-assigned id and does NOT touch curriculum.ts', () => {
  const dir = seedContent()
  const report = scaffoldLesson(spec, dir)
  expect(report.dottedId).toBe('B1.1')
  const file = path.join(dir, 'lessons/beginner/first-edit.mdx')
  expect(fs.existsSync(file)).toBe(true)
  const { data } = matter(fs.readFileSync(file, 'utf8'))
  expect(data.id).toBe('B1.1')
  expect(data.slug).toBe('first-edit')
  expect(data.type).toBe('core')
  expect(data.order).toBe(1)
  expect(fs.existsSync(path.join(dir, 'curriculum.ts'))).toBe(false)
})

test('a second lesson in the same module gets the next id/order', () => {
  const dir = seedContent()
  scaffoldLesson(spec, dir)
  const r2 = scaffoldLesson({ ...spec, slug: 'review-changes', title: 'Reviewing Changes' }, dir)
  expect(r2.dottedId).toBe('B1.2')
  const { data } = matter(fs.readFileSync(path.join(dir, 'lessons/beginner/review-changes.mdx'), 'utf8'))
  expect(data.order).toBe(2)
})

test('snippets/prompts are opt-in: default writes no Snippet tag and no pack stub', () => {
  const dir = seedContent()
  scaffoldLesson(spec, dir)
  const mdx = fs.readFileSync(path.join(dir, 'lessons/beginner/first-edit.mdx'), 'utf8')
  expect(mdx).not.toContain('<Snippet')
  expect(fs.readFileSync(path.join(dir, 'snippets/javascript.ts'), 'utf8')).not.toContain('@@TODO@@')
})

test('with --snippets/--prompts it embeds tags and stubs the DEFAULT pack only', () => {
  const dir = seedContent()
  scaffoldLesson({ ...spec, snippets: ['first-edit-example'], prompts: ['first-edit'] }, dir)
  const mdx = fs.readFileSync(path.join(dir, 'lessons/beginner/first-edit.mdx'), 'utf8')
  expect(mdx).toContain('<Snippet id="first-edit-example" />')
  const js = fs.readFileSync(path.join(dir, 'snippets/javascript.ts'), 'utf8')
  expect(js).toContain("'first-edit-example'")
  expect(js).toContain('@@TODO@@')
  expect(fs.readFileSync(path.join(dir, 'snippets/python.ts'), 'utf8')).not.toContain('first-edit-example')
})

test('scaffoldOutline seeds a new level + module in structure.ts and writes lessons', () => {
  const dir = seedContent()
  scaffoldOutline(
    {
      levels: [
        {
          id: 'advanced',
          title: 'Advanced',
          modules: [
            {
              code: 'A1',
              slug: 'power',
              title: 'Power User',
              lessons: [{ slug: 'subagents', title: 'Subagents', type: 'core', verifiedAgainstDocsAt: '2026-07-03' }],
            },
          ],
        },
      ],
    },
    dir,
  )
  const structure = fs.readFileSync(path.join(dir, 'structure.ts'), 'utf8')
  expect(structure).toContain("id: 'advanced'")
  expect(structure).toContain("code: 'A1'")
  const { data } = matter(fs.readFileSync(path.join(dir, 'lessons/advanced/subagents.mdx'), 'utf8'))
  expect(data.id).toBe('A1.1')
})

test('re-scaffolding an existing lesson preserves authored .mdx content', () => {
  const dir = seedContent()
  scaffoldLesson(spec, dir)
  const file = path.join(dir, 'lessons/beginner/first-edit.mdx')
  fs.writeFileSync(file, '---\nid: "B1.1"\n---\n\n# Hand-authored\n')
  scaffoldLesson(spec, dir)
  expect(fs.readFileSync(file, 'utf8')).toBe('---\nid: "B1.1"\n---\n\n# Hand-authored\n')
})
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npx vitest run scripts/authoring/scaffold.test.ts`
Expected: FAIL (new `scaffold.ts` shape not implemented).

- [ ] **Step 3: Rewrite `scaffold.ts`**

```ts
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
```

> **Implementer note on the batch-id subtlety:** `scaffoldOutline` calls `nextLessonId` (which reads the module's `.mdx` files from disk) *after* each lesson file is written, so successive lessons in one batch get incrementing ids. Because `writeLessonFile` writes the file synchronously before the next `nextLessonId`, this is correct. The `scaffold.test.ts` "second lesson gets next id" case is the guard; if you refactor, keep the read-after-write ordering.

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npx vitest run scripts/authoring/scaffold.test.ts scripts/authoring/nextId.test.ts scripts/authoring/structureEdit.test.ts`
Expected: PASS.

- [ ] **Step 5: Delete the obsolete curriculum codemod**

```bash
git rm scripts/authoring/curriculum.ts scripts/authoring/curriculum.test.ts
```

- [ ] **Step 6: Verify nothing else imports the deleted module**

Run: `grep -rn "from './curriculum'" scripts/authoring || echo "clean"`
Expected: `clean` (only `generateCurriculum.ts` imports `../content/curriculum` — a different path — and that is fine).

- [ ] **Step 7: Commit**

```bash
git add scripts/authoring/scaffold.ts scripts/authoring/scaffold.test.ts scripts/authoring/paths.ts
git commit -m "feat(authoring): frontmatter-first scaffolder; edit structure.ts, drop curriculum codemod"
```

---

## Task 5: CLI update (`cliCore.ts`) — new flags + run generator

The `lesson`/`outline` commands take the new frontmatter fields, auto-assign the id (no `--id`), and run the generator after scaffolding so `curriculum.ts` reflects the new lesson immediately.

**Files:**
- Modify: `scripts/authoring/cliCore.ts`
- Modify: `scripts/authoring/cliCore.test.ts`

**Interfaces:**
- Consumes: `scaffoldLesson`, `scaffoldOutline`, `Outline` from `./scaffold.ts`; `scaffoldLanguage` from `./language.ts`; `checkContent` from `./check.ts` (Task 6 renames `checkSnippets`→`checkContent`; until Task 6 lands, keep calling `checkSnippets` — **the reviewer should confirm the final name matches Task 6**); `generate` from `./generateCurriculum.ts`.
- Produces: `run(argv: string[]): number` (unchanged signature). `cliCore.test.ts` continues to call `run([...])` and assert exit codes; add cases for the new flags. **Generator invocation must be skippable in tests** — see step 3.

- [ ] **Step 1: Write/extend the failing tests**

Add to `scripts/authoring/cliCore.test.ts` (keep existing structure; these test flag parsing + validation, not real generation — set `CCC_SKIP_GEN=1` so `run` does not invoke the generator against the real content dir):

```ts
// @vitest-environment node
import { run } from './cliCore.ts'

test('lesson command requires level, module, slug, title, type', () => {
  const code = run(['lesson', '--level', 'beginner'])
  expect(code).toBe(2) // missing required flags -> caught error
})

test('unknown command returns 2 and lists commands', () => {
  expect(run(['frobnicate'])).toBe(2)
})
```

> The existing `cliCore.test.ts` cases (if any) stay. Do not add a test that actually scaffolds into the real `src/content` — flag-validation failures return before any file I/O.

- [ ] **Step 2: Run the tests, verify current state**

Run: `npx vitest run scripts/authoring/cliCore.test.ts`
Expected: the new `lesson` requirements test FAILS until the flag list is updated (old code required `id`, not `type`).

- [ ] **Step 3: Update `cliCore.ts`**

Replace the `lesson` and `outline` cases; add generator invocation guarded by an env var so unit tests can skip it. Full file:

```ts
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
      return { kind: kind ?? '', spec: spec ?? '' }
    })
}

const VALID_TYPES = new Set(['core', 'resolver', 'workflow', 'checkpoint', 'milestone'])

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
          estimatedMinutes: flags['estimated-minutes'] ? Number(flags['estimated-minutes']) : undefined,
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
```

> **Ordering note:** this task references `checkContent` from Task 6. Execute Task 6 before or together with the final `tsc`/suite verification. If executing strictly in order, temporarily import `checkSnippets as checkContent` is NOT allowed (no aliasing hacks) — instead run Task 6 first, or land Tasks 5 and 6 in the same review. The recommended execution order is **6 then 5**, or 5 with a stub `checkContent` that Task 6 fills. The plan lists 5 before 6 for narrative flow; the implementer/controller may swap them.

- [ ] **Step 4: Run the tests, verify they pass**

Run: `CCC_SKIP_GEN=1 npx vitest run scripts/authoring/cliCore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/authoring/cliCore.ts scripts/authoring/cliCore.test.ts
git commit -m "feat(authoring): CLI frontmatter-first flags, auto-id, run generator after scaffold"
```

---

## Task 6: Content check (`check.ts`) — add frontmatter validation

Grow the existing check into a full content check: keep the snippet/prompt coverage analysis and additionally run the Phase 1 `validateContent` over lesson frontmatter, reporting validation failures as errors.

**Files:**
- Modify: `scripts/authoring/check.ts` (rename export `checkSnippets` → `checkContent`; keep behavior + add validation)
- Modify: `scripts/authoring/check.test.ts`

**Interfaces:**
- Consumes (added): `validateContent` from `./generate/validate.ts`; `readAllLessonMeta` from `./generate/frontmatter.ts`; `structure` from `../../src/content/structure.ts`; `chartIds` from `../../src/content/charts/chartIds.ts` (import-free, node-safe).
- Produces: `checkContent(contentDir?: string): CheckResult` (was `checkSnippets`). `CheckResult` unchanged (`{ errors: string[]; warnings: string[] }`). Frontmatter validation strings are pushed to `errors`.

- [ ] **Step 1: Extend the failing tests**

Add to `scripts/authoring/check.test.ts` a case proving validation errors surface. Because `checkContent` reads `structure` from the real `src/content/structure.ts` when no `contentDir` override is possible for that import, the added test seeds a temp content dir AND passes it — so the test must confirm the temp-dir path validates the temp lessons. **Implementer:** mirror the existing `check.test.ts` temp-dir fixture; add a lesson with a bad frontmatter (e.g. an unknown `type`) and assert an error mentioning it appears. Keep all existing snippet-coverage assertions, updating the imported name to `checkContent`.

Example addition:

```ts
test('checkContent reports a frontmatter validation error', () => {
  const dir = seedContent() // existing helper; ensure it writes a structure.ts too
  fs.mkdirSync(path.join(dir, 'lessons/beginner'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'lessons/beginner/bad.mdx'),
    '---\nid: "B1.1"\nslug: "bad"\ntitle: "Bad"\ntype: "nonsense"\norder: 1\n---\n\n# Bad\n',
  )
  const { errors } = checkContent(dir)
  expect(errors.some((e) => e.includes('invalid type'))).toBe(true)
})
```

> **Implementer:** the existing `seedContent()` in `check.test.ts` seeds packs + lessons but may not seed a `structure.ts`. Add one (mirroring `scaffold.test.ts`'s) and make `checkContent` read structure from the passed `contentDir` (see step 3 — thread the structure through rather than importing the real one, so the temp-dir test is honest).

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npx vitest run scripts/authoring/check.test.ts`
Expected: FAIL (`checkContent` not exported / validation not wired).

- [ ] **Step 3: Update `check.ts`**

Key design decision: to keep the temp-dir tests honest, read `structure` from the target `contentDir` at runtime via ts-morph rather than importing the compiled real `structure.ts`. Reuse the same ts-morph project. Add a small reader that extracts `LevelDef[]` shape from `structure.ts` — OR, simpler and DRY: import the real `structure` for the default path, and for tests thread a `structure` override. Choose the **runtime-read** approach below so `contentDir` fully controls inputs:

```ts
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

// ... keep listPackIds, walk, scanLessonRefs unchanged ...

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
  for (const [id, pack] of Object.entries(packs)) {
    if (id !== DEFAULT_LANGUAGE) {
      for (const key of Object.keys(def.snippets)) if (!(key in pack.snippets)) warnings.push(`${id}: missing snippet "${key}" (falls back to ${DEFAULT_LANGUAGE}).`)
      for (const key of Object.keys(def.prompts)) if (!(key in pack.prompts)) warnings.push(`${id}: missing prompt "${key}" (falls back to ${DEFAULT_LANGUAGE}).`)
    }
    for (const [key, value] of Object.entries(pack.snippets)) if (value.includes(STUB)) warnings.push(`${id}: snippet "${key}" is still a TODO stub.`)
    for (const [key, value] of Object.entries(pack.prompts)) if (value.includes(STUB)) warnings.push(`${id}: prompt "${key}" is still a TODO stub.`)
  }

  return { errors, warnings }
}
```

Add a tiny `scripts/authoring/readStructure.ts` that parses `structure.ts` into the `LevelDef[]` shape `validateContent` needs (it only reads `level.id`, `level.modules[].code`, `level.modules[].order` etc.). Implement with ts-morph object-literal walking (reuse patterns from `structureEdit.ts`):

```ts
import { Node, SyntaxKind } from 'ts-morph'
import type { Project } from 'ts-morph'
import { structureFile } from './paths.ts'
import type { LevelDef, ModuleDef } from '../../src/content/structure.ts'

export function readStructure(project: Project, contentDir: string): LevelDef[] {
  const sf = project.addSourceFileAtPath(structureFile(contentDir))
  const arr = sf.getVariableDeclarationOrThrow('structure').getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
  const levels: LevelDef[] = []
  for (const el of arr.getElements()) {
    if (!Node.isObjectLiteralExpression(el)) continue
    const id = str(el, 'id')
    const title = str(el, 'title')
    const order = num(el, 'order')
    const modsArr = el.getPropertyOrThrow('modules').asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
    const modules: ModuleDef[] = []
    for (const m of modsArr.getElements()) {
      if (!Node.isObjectLiteralExpression(m)) continue
      modules.push({ code: str(m, 'code'), slug: str(m, 'slug'), title: str(m, 'title'), order: num(m, 'order') })
    }
    levels.push({ id, title, order, modules })
  }
  return levels
}

function str(obj: import('ts-morph').ObjectLiteralExpression, name: string): string {
  const p = obj.getPropertyOrThrow(name).asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerOrThrow()
  return Node.isStringLiteral(p) ? p.getLiteralText() : ''
}
function num(obj: import('ts-morph').ObjectLiteralExpression, name: string): number {
  const prop = obj.getProperty(name)
  if (!prop || !Node.isPropertyAssignment(prop)) return 0
  const init = prop.getInitializer()
  return init ? Number(init.getText()) : 0
}
```

Create `scripts/authoring/readStructure.test.ts` with one temp-dir test asserting it round-trips a seeded `structure.ts` into the expected `LevelDef[]`.

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npx vitest run scripts/authoring/check.test.ts scripts/authoring/readStructure.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/authoring/check.ts scripts/authoring/check.test.ts scripts/authoring/readStructure.ts scripts/authoring/readStructure.test.ts
git commit -m "feat(authoring): content check runs frontmatter validation (checkContent)"
```

---

## Task 7: Docs — `new-lesson` skill, `check-snippets` command, CLAUDE.md

Rewrite the authoring skill for the frontmatter-first model and reword the command + CLAUDE.md to match. No code; verified by the final review.

**Files:**
- Rewrite: `.claude/skills/new-lesson/SKILL.md`
- Modify: `.claude/commands/check-snippets.md`
- Modify: `CLAUDE.md` ("Adding lessons & languages" + "Commands")

- [ ] **Step 1: Rewrite `.claude/skills/new-lesson/SKILL.md`**

Content requirements (write the actual file — this is the spec §8 rewrite):
- Frontmatter is the source of truth; **never hand-edit `curriculum.ts`** (it is generated).
- **Part 0 — before writing:** fetch the lesson's `docsSources` (official docs) so content is current; set `volatility` and `verifiedAgainstDocsAt` accordingly (`stable` needs no `docsSources`; `evolving`/`volatile` require them).
- Single-lesson flow:
  ```bash
  npx tsx scripts/authoring/cli.ts lesson \
    --level beginner --module B2 --slug review-changes \
    --title "Reviewing Changes" --type core
  ```
  Optional flags: `--level-title`, `--module-title`, `--module-slug` (only when introducing a new level/module); `--estimated-minutes`, `--volatility`, `--verified-at`, `--prerequisites B2.2`, `--teaches diff-review`, `--references B2.1`, `--docs-sources <url>`, `--interactive diagram:spec-id`; `--snippets a,b` / `--prompts c` (opt-in only). The dotted `id` is **auto-assigned** from the module's next free `order`.
- Inline fenced code is the default; reserve `<Snippet>`/`<TryPrompt>` for genuinely language-specific spots.
- Fill the per-`type` section skeleton (the template writes the anatomy headings + `@@TODO@@` guidance comments).
- Editing containers: add new levels/modules by hand in `src/content/structure.ts` (or via `--level-title`/`--module-title` on first use).
- Verify: `npm run check-snippets` (now a full content check — frontmatter validation + snippet coverage); resolve every `ERROR`. The CLI runs `gen:curriculum` for you after scaffolding.
- Whole module/level batch: `outline --file <json>` with the new JSON shape (`code`/`slug`/`type` per lesson; ids auto-assigned).

- [ ] **Step 2: Reword `.claude/commands/check-snippets.md`**

Describe it as the **content check**: runs frontmatter validation (invalid `type`/`volatility`, unresolved prerequisites/references, non-contiguous `order`, missing `docsSources` for non-stable lessons, etc.) **and** snippet/prompt coverage. List ERRORs first (fail CI), then warnings (fallback gaps, TODO stubs).

- [ ] **Step 3: Update `CLAUDE.md`**

In "Adding lessons & languages": note the scaffolder is frontmatter-first, auto-assigns the dotted id, edits `structure.ts` (not `curriculum.ts`, which is generated), and snippets/prompts are opt-in. In "Commands": `check-snippets` is now the content check.

- [ ] **Step 4: Verify the whole suite + build + generation are green**

```bash
npm test
npx tsc -b
npm run lint
npm run gen:curriculum && git diff --exit-code src/content/curriculum.ts
```
Expected: all pass; `curriculum.ts` unchanged (the 5 migrated lessons regenerate identically).

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/new-lesson/SKILL.md .claude/commands/check-snippets.md CLAUDE.md
git commit -m "docs(authoring): frontmatter-first new-lesson skill + content-check wording"
```

---

## Self-Review (author checklist — completed during planning)

- **Spec coverage (§5 scaffolder):** per-type templates → Task 3; auto-id → Task 2; opt-in snippets → Tasks 3–5; edits `structure.ts` not `curriculum.ts` → Tasks 1, 4; runs generator at end → Task 5; `outline` batch → Task 4/5. ✅
- **Spec coverage (§8 skill + check):** content check adds §4.2 validation → Task 6; `new-lesson` rewrite → Task 7; command + CLAUDE.md wording → Task 7. ✅
- **Loading model:** untouched — the generator (Phase 1) still emits literal `import()`; the scaffolder only triggers regen. ✅
- **Type consistency:** `LessonSpec`/`OutlineLesson` (Task 4) match template `LessonFrontmatter` (Task 3) fields; CLI (Task 5) maps flags → those; `checkContent` name is used consistently in Tasks 5–7 (see the Task 5 ordering note). ✅
- **Placeholder scan:** every code step has complete code; `@@TODO@@` appears only as intended author-guidance content in emitted templates, not as plan placeholders. ✅
- **Deletion safety:** Task 4 step 6 greps for stray imports of the deleted `curriculum.ts` codemod. ✅

## Execution ordering note for the controller

Tasks 5 and 6 have a name dependency (`checkContent`). Execute **Task 6 before Task 5**, or land them in one review. All other tasks are independent and in dependency order (1→2→3→4, then 6, then 5, then 7).

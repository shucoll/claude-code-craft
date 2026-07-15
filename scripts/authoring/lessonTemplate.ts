import { STUB } from './paths.ts'

export type LessonType = 'overview' | 'core' | 'resolver' | 'workflow' | 'checkpoint' | 'milestone'

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

function overviewBody(fm: LessonFrontmatter): string {
  const chart = chartBlock(fm)
  return [
    '## You are here',
    todo("The previous level's exit capabilities mirrored back in one tight paragraph, anchored to its exit artifact. Capabilities, not a lesson list."),
    '## The gap',
    todo('2–3 concrete scenarios the learner cannot handle yet; the problems this level exists to solve.'),
    '## The map',
    chart || todo("The level's interactive stack chart: one node per component with a one-line identity, each linking to its module. The centerpiece."),
    '## How it fits together',
    todo('Short prose on the relationships and dependencies between the components — the shape of the system, not its mechanics.'),
    '## Suggested route',
    todo("The default module order, what can be reordered or skipped and what shouldn't, with reasons."),
    "## What you'll build",
    todo('The guided-project teaser, linked.'),
  ]
    .filter(Boolean)
    .join('\n\n')
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

function workflowBody(_fm: LessonFrontmatter, opts?: TemplateOptions): string {
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
    case 'overview':
      body = overviewBody(fm)
      break
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

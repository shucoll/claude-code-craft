# Curriculum Phase 3 — `<LessonLink>` Cross-links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the cross-reference data the generator already emits — a dotted-id → lesson resolver, a `<LessonLink>` MDX component, and a Prerequisites strip + "Where next" footer on the lesson page.

**Architecture:** Purely runtime consumption of `src/content/curriculum.ts` (already carries `dottedId`, `prerequisites`, `references` per lesson). The lesson tree is the single source of truth: one `findByDottedId` lookup yields both the route (via existing `lessonPath`) and the title. A `<LessonLink>` component and a shared `<LessonRefLinks>` presentational component render those into react-router links. No change to the generator, validator, or emitter.

**Tech Stack:** Vite + React + TypeScript (strict), react-router-dom, Tailwind v4 (CSS-first, semantic tokens only), MDX (`@mdx-js/react` `MDXProvider`), Vitest + React Testing Library (jsdom).

Spec: `docs/superpowers/specs/2026-07-04-curriculum-crosslinks-phase3-design.md`.

## Global Constraints

- TypeScript strict; **no `any`** in committed code.
- Consume **semantic tokens only** (`text-link`, `text-primary`, `text-muted-foreground`, `border-border`, etc.) — never raw hex or `--ccc-*` primitives.
- Green = success/completed only; brand = coral. Do not introduce green for cross-link UI.
- `src/content/curriculum.ts` is **generated** — never hand-edit it. Regenerate with `npm run gen:curriculum`.
- `src/content/structure.ts` is the hand-authored level/module manifest; lesson frontmatter is the source of truth for per-lesson data.
- One responsibility per file; keep files small and focused.
- Dotted ids look like `B1.1` (`<LETTER><moduleNum>.<order>`). `prerequisites`/`references` are arrays of dotted ids that build-time `check` guarantees resolve.
- Test command for a single file: `npx vitest run <path>`. Full suite: `npm test`. Type-check + bundle: `npm run build`. Content check: `npm run check-snippets`.
- Commit message trailer (every commit): `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

New:
- `src/components/mdx/LessonLink.tsx` — the `<LessonLink id children? />` MDX component (+ `LessonLink.test.tsx`).
- `src/components/mdx/LessonRefLinks.tsx` — presentational list of LessonLinks, `inline` | `list` variants (+ `LessonRefLinks.test.tsx`).

Modified:
- `src/lib/curriculumNav.ts` — add `findByDottedId` (+ extend `curriculumNav.test.ts`).
- `src/components/mdx/mdxComponents.tsx` — register `LessonLink`.
- `src/pages/LessonPage.tsx` — render the Prerequisites strip + Where-next footer (+ extend `LessonPage.test.tsx`).
- `src/content/lessons/beginner/{what-is-cc,first-edit,review-changes}.mdx` — dogfood cross-links → regenerated `src/content/curriculum.ts`.
- `.claude/skills/new-lesson/SKILL.md`, `CLAUDE.md` — docs.

---

## Task 1: `findByDottedId` resolver

**Files:**
- Modify: `src/lib/curriculumNav.ts`
- Test: `src/lib/curriculumNav.test.ts`

**Interfaces:**
- Consumes: existing `flattenLessons(levels)`, `LessonLocation`, `Level` from this file.
- Produces: `findByDottedId(levels: Level[], dottedId: string): LessonLocation | undefined`.

- [ ] **Step 1: Write the failing test**

Add to `src/lib/curriculumNav.test.ts`. First update the import line to include `findByDottedId`:

```ts
import { findByDottedId, findLesson, firstLesson, flattenLessons, lessonPath, nextLesson, prevLesson } from './curriculumNav'
```

The existing `levels` fixture lessons have no `dottedId`, so add one lesson with a dottedId in a new test using a local fixture:

```ts
test('findByDottedId locates a lesson by its dottedId and returns undefined for unknown ids', () => {
  const withDotted: Level[] = [
    { id: 'beginner', title: 'Beginner', modules: [
      { id: 'basics', title: 'Basics', lessons: [
        { id: 'what-is-cc', dottedId: 'B1.1', title: 'What is Claude Code?', content: noop },
      ] },
    ] },
  ]
  expect(findByDottedId(withDotted, 'B1.1')?.lesson.id).toBe('what-is-cc')
  expect(findByDottedId(withDotted, 'B1.1')?.moduleId).toBe('basics')
  expect(findByDottedId(withDotted, 'ZZ9.9')).toBeUndefined()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/curriculumNav.test.ts`
Expected: FAIL — `findByDottedId is not a function` (or import error).

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/curriculumNav.ts` (after `findLesson`):

```ts
export function findByDottedId(levels: Level[], dottedId: string): LessonLocation | undefined {
  return flattenLessons(levels).find((l) => l.lesson.dottedId === dottedId)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/curriculumNav.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit**

```bash
git add src/lib/curriculumNav.ts src/lib/curriculumNav.test.ts
git commit -m "feat(crosslinks): findByDottedId resolver

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `<LessonLink>` component + registration

**Files:**
- Create: `src/components/mdx/LessonLink.tsx`
- Create: `src/components/mdx/LessonLink.test.tsx`
- Modify: `src/components/mdx/mdxComponents.tsx`

**Interfaces:**
- Consumes: `findByDottedId`, `lessonPath` (Task 1 / existing) from `../../lib/curriculumNav`; `curriculum` from `../../content/curriculum`; `Link` from `react-router-dom`.
- Produces: `LessonLink({ id, children? })` React component; registered as `LessonLink` in `mdxComponents`.

- [ ] **Step 1: Write the failing test**

Create `src/components/mdx/LessonLink.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LessonLink } from './LessonLink'

function renderLink(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

test('renders a link to the resolved lesson using its title as text', () => {
  renderLink(<LessonLink id="B1.1" />)
  const link = screen.getByRole('link', { name: /what is claude code/i })
  expect(link).toHaveAttribute('href', '/learn/beginner/basics/what-is-cc')
})

test('children override the link text', () => {
  renderLink(<LessonLink id="B1.1">start here</LessonLink>)
  expect(screen.getByRole('link', { name: 'start here' })).toHaveAttribute(
    'href',
    '/learn/beginner/basics/what-is-cc',
  )
})

test('an unknown id renders plain text with no anchor', () => {
  renderLink(<LessonLink id="ZZ9.9">missing</LessonLink>)
  expect(screen.queryByRole('link')).toBeNull()
  expect(screen.getByText('missing')).toBeInTheDocument()
})

test('an unknown id with no children falls back to the raw id', () => {
  renderLink(<LessonLink id="ZZ9.9" />)
  expect(screen.getByText('ZZ9.9')).toBeInTheDocument()
})
```

> Note: these tests read the real `curriculum` (B1.1 = what-is-cc exists on `main`). No dogfood content is required for Task 2.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/mdx/LessonLink.test.tsx`
Expected: FAIL — cannot resolve `./LessonLink`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/mdx/LessonLink.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { findByDottedId, lessonPath } from '../../lib/curriculumNav'

interface LessonLinkProps {
  /** Canonical dotted id of the target lesson, e.g. "B2.3". */
  id: string
  children?: ReactNode
}

const linkClass = 'text-link underline underline-offset-2 hover:text-primary'

export function LessonLink({ id, children }: LessonLinkProps) {
  const loc = findByDottedId(curriculum, id)
  if (!loc) return <span>{children ?? id}</span>
  return (
    <Link to={lessonPath(loc)} className={linkClass}>
      {children ?? loc.lesson.title}
    </Link>
  )
}
```

- [ ] **Step 4: Register in `mdxComponents`**

Edit `src/components/mdx/mdxComponents.tsx`. Add the import after the `ChartEmbed` import:

```tsx
import { LessonLink } from './LessonLink'
```

Add `LessonLink,` to the `mdxComponents` object, right after `ChartEmbed,`:

```tsx
  ChartEmbed,
  LessonLink,
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/mdx/LessonLink.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/mdx/LessonLink.tsx src/components/mdx/LessonLink.test.tsx src/components/mdx/mdxComponents.tsx
git commit -m "feat(crosslinks): LessonLink MDX component + registration

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `<LessonRefLinks>` presentational component

**Files:**
- Create: `src/components/mdx/LessonRefLinks.tsx`
- Create: `src/components/mdx/LessonRefLinks.test.tsx`

**Interfaces:**
- Consumes: `LessonLink` (Task 2).
- Produces: `LessonRefLinks({ label: string; ids: string[]; variant: 'inline' | 'list' })` React component. Renders `null` when `ids` is empty.

- [ ] **Step 1: Write the failing test**

Create `src/components/mdx/LessonRefLinks.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LessonRefLinks } from './LessonRefLinks'

function renderRefs(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

test('inline variant renders the label and one link per id', () => {
  renderRefs(<LessonRefLinks label="Prerequisites" ids={['B1.1', 'B1.2']} variant="inline" />)
  expect(screen.getByText('Prerequisites:')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /what is claude code/i })).toHaveAttribute(
    'href',
    '/learn/beginner/basics/what-is-cc',
  )
  expect(screen.getByRole('link', { name: /your first edit/i })).toBeInTheDocument()
})

test('list variant renders a labelled nav with a link per id', () => {
  renderRefs(<LessonRefLinks label="Where next" ids={['B1.3']} variant="list" />)
  expect(screen.getByRole('navigation', { name: 'Where next' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /reviewing changes/i })).toHaveAttribute(
    'href',
    '/learn/beginner/basics/review-changes',
  )
})

test('renders nothing when ids is empty', () => {
  const { container } = renderRefs(<LessonRefLinks label="Prerequisites" ids={[]} variant="inline" />)
  expect(container.textContent).toBe('')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/mdx/LessonRefLinks.test.tsx`
Expected: FAIL — cannot resolve `./LessonRefLinks`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/mdx/LessonRefLinks.tsx`:

```tsx
import { Fragment } from 'react'
import { LessonLink } from './LessonLink'

interface LessonRefLinksProps {
  label: string
  /** Dotted ids of the referenced lessons. */
  ids: string[]
  variant: 'inline' | 'list'
}

export function LessonRefLinks({ label, ids, variant }: LessonRefLinksProps) {
  if (ids.length === 0) return null

  if (variant === 'inline') {
    return (
      <p className="mb-6 text-sm text-muted-foreground">
        <span className="font-semibold">{label}:</span>{' '}
        {ids.map((id, i) => (
          <Fragment key={id}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            <LessonLink id={id} />
          </Fragment>
        ))}
      </p>
    )
  }

  return (
    <nav aria-label={label} className="mt-10 border-t-2 border-border pt-6">
      <h2 className="mb-2 font-mono text-lg font-semibold">{label}</h2>
      <ul className="space-y-1">
        {ids.map((id) => (
          <li key={id} className="leading-relaxed">
            <span aria-hidden="true">→ </span>
            <LessonLink id={id} />
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/mdx/LessonRefLinks.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/mdx/LessonRefLinks.tsx src/components/mdx/LessonRefLinks.test.tsx
git commit -m "feat(crosslinks): LessonRefLinks presentational component

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Dogfood sample lessons + regenerate curriculum

This task adds real cross-links to the beginner lessons so the feature renders in the app and so Task 5's integration tests have real content to assert against. It must run after Task 2 (the inline `<LessonLink>` needs the registered component) and before Task 5.

**Files:**
- Modify: `src/content/lessons/beginner/what-is-cc.mdx`
- Modify: `src/content/lessons/beginner/first-edit.mdx`
- Modify: `src/content/lessons/beginner/review-changes.mdx`
- Regenerate: `src/content/curriculum.ts`

**Interfaces:**
- Consumes: `<LessonLink>` registered in `mdxComponents` (Task 2).
- Produces: beginner lessons carry `prerequisites`/`references`; `curriculum.ts` reflects them. Concretely — B1.1 references B1.2; B1.2 has prerequisites [B1.1] + references [B1.3] + an inline LessonLink to B1.1; B1.3 has prerequisites [B1.2].

- [ ] **Step 1: Add `references` to what-is-cc frontmatter (B1.1)**

In `src/content/lessons/beginner/what-is-cc.mdx`, change the frontmatter closing so `references` is added before the `---`:

Replace:
```
volatility: "stable"
verifiedAgainstDocsAt: "2026-07-03"
---
```
with:
```
volatility: "stable"
verifiedAgainstDocsAt: "2026-07-03"
references: ["B1.2"]
---
```

- [ ] **Step 2: Add `prerequisites` + `references` + an inline link to first-edit (B1.2)**

In `src/content/lessons/beginner/first-edit.mdx`, add the two frontmatter lines the same way:

Replace:
```
volatility: "stable"
verifiedAgainstDocsAt: "2026-07-03"
---
```
with:
```
volatility: "stable"
verifiedAgainstDocsAt: "2026-07-03"
prerequisites: ["B1.1"]
references: ["B1.3"]
---
```

Then add an inline cross-reference in the body. Replace:
```
Point Claude at a function and ask it to change it.
```
with:
```
Point Claude at a function and ask it to change it. New to the tool? Start with <LessonLink id="B1.1" />.
```

- [ ] **Step 3: Add `prerequisites` to review-changes frontmatter (B1.3)**

In `src/content/lessons/beginner/review-changes.mdx`:

Replace:
```
volatility: "stable"
verifiedAgainstDocsAt: "2026-07-03"
---
```
with:
```
volatility: "stable"
verifiedAgainstDocsAt: "2026-07-03"
prerequisites: ["B1.2"]
---
```

- [ ] **Step 4: Regenerate curriculum.ts**

Run: `npm run gen:curriculum`
Expected: prints `generated .../curriculum.ts (5 lessons)` with no ERROR lines. Confirm the diff shows `prerequisites`/`references` fields added to the beginner lessons in `src/content/curriculum.ts` (do not hand-edit the file).

- [ ] **Step 5: Verify the content check and existing tests still pass**

Run: `npm run check-snippets`
Expected: `0 error(s)` (warnings about non-default pack gaps / `@@TODO@@` are fine).

Run: `npx vitest run src/pages/LessonPage.test.tsx src/components/charts/ChartEmbed.test.tsx`
Expected: PASS — adding frontmatter + an inline (registered) `<LessonLink>` does not change existing behavior.

- [ ] **Step 6: Commit**

```bash
git add src/content/lessons/beginner/what-is-cc.mdx src/content/lessons/beginner/first-edit.mdx src/content/lessons/beginner/review-changes.mdx src/content/curriculum.ts
git commit -m "content(crosslinks): dogfood prerequisites/references on beginner lessons

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: LessonPage — Prerequisites strip + Where-next footer

**Files:**
- Modify: `src/pages/LessonPage.tsx`
- Test: `src/pages/LessonPage.test.tsx`

**Interfaces:**
- Consumes: `LessonRefLinks` (Task 3); `location.lesson.prerequisites` / `location.lesson.references` (present after Task 4).
- Produces: Prerequisites strip above the MDX content; Where-next footer between the content and the Mark-complete footer.

- [ ] **Step 1: Write the failing tests**

Add to `src/pages/LessonPage.test.tsx`:

```tsx
test('renders the Prerequisites strip linking to prerequisite lessons', async () => {
  renderAt('/learn/beginner/basics/first-edit')
  await screen.findByRole('heading', { name: /your first edit/i })
  expect(screen.getByText('Prerequisites:')).toBeInTheDocument()
  const link = screen.getAllByRole('link', { name: /what is claude code/i })[0]
  expect(link).toHaveAttribute('href', '/learn/beginner/basics/what-is-cc')
})

test('renders the Where next footer from references', async () => {
  renderAt('/learn/beginner/basics/first-edit')
  await screen.findByRole('heading', { name: /your first edit/i })
  const nav = screen.getByRole('navigation', { name: 'Where next' })
  expect(nav).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /reviewing changes/i })).toHaveAttribute(
    'href',
    '/learn/beginner/basics/review-changes',
  )
})

test('omits the Prerequisites strip when the lesson has none', async () => {
  renderAt('/learn/beginner/basics/what-is-cc')
  await screen.findByRole('heading', { name: /what is claude code/i })
  expect(screen.queryByText('Prerequisites:')).toBeNull()
})
```

> `getAllByRole(...)[0]` in the first test is deliberate: first-edit also has an inline `<LessonLink id="B1.1" />` in its body (from Task 4), so two links to what-is-cc exist. The prereq strip is rendered first, so index 0 is the strip's link.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/pages/LessonPage.test.tsx`
Expected: FAIL — no "Prerequisites:" text / no "Where next" navigation yet.

- [ ] **Step 3: Wire the components into LessonPage**

Edit `src/pages/LessonPage.tsx`.

Add the import after the `Button` import:
```tsx
import { LessonRefLinks } from '../components/mdx/LessonRefLinks'
```

Insert the Prerequisites strip immediately after the `{back && (...)}` block and before the `<MDXProvider>`:
```tsx
      {location.lesson.prerequisites?.length ? (
        <LessonRefLinks label="Prerequisites" ids={location.lesson.prerequisites} variant="inline" />
      ) : null}
```

Insert the Where-next footer immediately after the closing `</MDXProvider>` and before the `<footer ...>`:
```tsx
      {location.lesson.references?.length ? (
        <LessonRefLinks label="Where next" ids={location.lesson.references} variant="list" />
      ) : null}
```

For reference, the relevant region reads (existing lines shown for placement, new lines interleaved):
```tsx
      {back && (
        <div className="mb-6">
          <Button variant="secondary" size="sm" leadingIcon={<ArrowLeftIcon />} onClick={() => navigate(back)}>
            Back
          </Button>
        </div>
      )}

      {location.lesson.prerequisites?.length ? (
        <LessonRefLinks label="Prerequisites" ids={location.lesson.prerequisites} variant="inline" />
      ) : null}

      <MDXProvider components={mdxComponents}>
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <LessonContent />
        </Suspense>
      </MDXProvider>

      {location.lesson.references?.length ? (
        <LessonRefLinks label="Where next" ids={location.lesson.references} variant="list" />
      ) : null}

      <footer className="mt-12 flex justify-end border-t-2 border-border pt-6">
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/pages/LessonPage.test.tsx`
Expected: PASS (all tests in the file, including the three new ones).

- [ ] **Step 5: Commit**

```bash
git add src/pages/LessonPage.tsx src/pages/LessonPage.test.tsx
git commit -m "feat(crosslinks): prerequisites strip + Where-next footer on LessonPage

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Skill/docs update + final acceptance

**Files:**
- Modify: `.claude/skills/new-lesson/SKILL.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: nothing new (docs only).
- Produces: authoring docs mention `<LessonLink>` and the fact that `prerequisites`/`references` now render.

- [ ] **Step 1: Document `<LessonLink>` in the new-lesson skill**

In `.claude/skills/new-lesson/SKILL.md`, in the step-3 "Inline fenced code" bullet (around line 78-84), append a sentence about `<LessonLink>`. Replace:

```
   - **Inline fenced code (` ```bash `, ` ```javascript `, …) is the default**
     for examples — write it directly in the MDX body. Only reach for
     `<Snippet id="…" />` / `<TryPrompt id="…" />` at a spot that is genuinely
     language-specific (the same walkthrough needs different code per
     language pack). Pass `--snippets`/`--prompts` at scaffold time to stub
     those ids in the default pack, then write the real code there and add
     idiomatic versions to the other packs (e.g. `python.ts`).
```
with:
```
   - **Inline fenced code (` ```bash `, ` ```javascript `, …) is the default**
     for examples — write it directly in the MDX body. Only reach for
     `<Snippet id="…" />` / `<TryPrompt id="…" />` at a spot that is genuinely
     language-specific (the same walkthrough needs different code per
     language pack). Pass `--snippets`/`--prompts` at scaffold time to stub
     those ids in the default pack, then write the real code there and add
     idiomatic versions to the other packs (e.g. `python.ts`).
   - **Cross-reference other lessons inline** with
     `<LessonLink id="B2.3" />` (renders the target lesson's title as a link;
     wrap custom text as `<LessonLink id="B2.3">as we saw earlier</LessonLink>`).
     The id must resolve — `check-snippets` fails on unknown ids.
```

- [ ] **Step 2: Note that prerequisites/references now render**

In the same file, in the optional-flags list (around line 57-59), update the `--prerequisites` and `--references` bullets. Replace:

```
   - `--prerequisites B2.2` — comma-separated dotted ids that must resolve
   - `--teaches diff-review` — comma-separated concept tags
   - `--references B2.1` — comma-separated dotted ids that must resolve
```
with:
```
   - `--prerequisites B2.2` — comma-separated dotted ids that must resolve;
     rendered as a "Prerequisites" strip at the top of the lesson, so set them
     intentionally (user-facing navigation, not just validator metadata)
   - `--teaches diff-review` — comma-separated concept tags
   - `--references B2.1` — comma-separated dotted ids that must resolve;
     rendered as the "Where next" footer at the bottom of the lesson
```

- [ ] **Step 3: Add a one-line `<LessonLink>` mention to CLAUDE.md**

In `CLAUDE.md`, in the "Adding lessons & languages" section, on the line that describes inline fenced code being the default (the bullet mentioning `<Snippet>`/`<TryPrompt>` stubs), append: `Cross-link lessons inline with \`<LessonLink id="B2.3" />\`.` Keep it to a single appended sentence on that existing bullet — do not restructure the section.

- [ ] **Step 4: Full acceptance — suite, types, lint, content check**

Run each and confirm green:

```bash
npm test
```
Expected: all test files pass (Task 1-5 additions included).

```bash
npm run build
```
Expected: `gen:curriculum` runs, `tsc` reports no errors, Vite bundles successfully. (A `gen:curriculum` re-run here must produce **no** diff to `curriculum.ts` beyond Task 4 — deterministic output.)

```bash
npm run lint
```
Expected: no new errors (pre-existing warnings — vite.config triple-slash + context fast-refresh — are unrelated and acceptable).

```bash
npm run check-snippets
```
Expected: `0 error(s)`.

- [ ] **Step 5: Confirm curriculum.ts is clean (not hand-edited, deterministic)**

Run: `npm run gen:curriculum && git status --porcelain src/content/curriculum.ts`
Expected: empty output (no diff) — proves the committed `curriculum.ts` matches generator output.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/new-lesson/SKILL.md CLAUDE.md
git commit -m "docs(crosslinks): document LessonLink + rendered prerequisites/references

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- §4.1 resolver → Task 1. ✓
- §4.2 `<LessonLink>` (found/children/unknown fallback) + registration → Task 2. ✓
- §4.3 `<LessonRefLinks>` inline/list/empty → Task 3. ✓
- §4.4 LessonPage prereq strip + Where-next → Task 5. ✓
- §5 dogfood → Task 4. ✓
- §6 skill/docs → Task 6. ✓
- §7 testing (findByDottedId, LessonLink, LessonRefLinks, LessonPage, acceptance) → Tasks 1-6. ✓
- §2 invariant (build-time validation) → relied upon, re-verified in Task 6 Step 4 (`check-snippets`). ✓

**Placeholder scan:** No TBD/TODO/"add error handling"/"similar to". All steps show concrete code or exact commands. ✓

**Type consistency:** `findByDottedId(levels: Level[], dottedId: string): LessonLocation | undefined` used identically in Tasks 1-2. `LessonLink({ id, children? })` and `LessonRefLinks({ label, ids, variant })` signatures consistent across Tasks 2, 3, 5. `variant: 'inline' | 'list'` matches everywhere. ✓

**Ordering note:** Task 4 (dogfood) intentionally precedes Task 5 because LessonPage integration tests assert against real `prerequisites`/`references` content, and the inline `<LessonLink>` added in Task 4 requires the component registered in Task 2.

# Curriculum Authoring Platform — Phase 3: `<LessonLink>` cross-links

**Date:** 2026-07-04
**Status:** Approved design, ready for implementation plan
**Initiative:** Curriculum Authoring Platform (design spec:
`docs/superpowers/specs/2026-07-03-curriculum-authoring-platform-design.md`, §6 "Aspect 3 —
dotted-id → route resolver", §10 phase 3).
**Depends on:** Phase 1 (generator emits `dottedId`, `prerequisites`, `references`,
`lessonPathById`) and Phase 2 (build-time `check` rejects unresolved prerequisite/reference
ids). Both merged to main.

## 1. Goal & scope

Consume the cross-reference data the generator already emits. Every generated `Lesson` in
`src/content/curriculum.ts` already carries `dottedId` and, when authored, `prerequisites`
and `references` (arrays of dotted ids); the file also exports
`lessonPathById: Record<string, string>`. Phase 3 is **purely runtime rendering** — no
change to the generator, validator, or emitter.

Three deliverables:

1. A dotted-id → lesson resolver.
2. A `<LessonLink id="B2.3">optional text</LessonLink>` MDX component for inline
   cross-references in lesson prose.
3. Rendering of a **Prerequisites** strip at the top of a lesson and a **Where next** footer
   from the lesson's `references`.

Plus a docs update to the `new-lesson` skill and a small dogfood pass on the sample lessons.

**Out of scope:** any change to the generator/validator/emitter; progress-based gating
("no gating" per the platform spec); prerequisite completion state (decided: plain nav
links); chart/flowchart work (Phase 4).

## 2. Invariant relied upon

Build-time validation (`npm run check-snippets` / CI, from Phase 2) already rejects any
`prerequisites`/`references` dotted id that does not resolve to an existing lesson. Therefore
runtime resolution of those ids is guaranteed to succeed. `<LessonLink>`'s unresolved-id
fallback (§4.2) is defense-in-depth for hand-typed ids in prose and for hand-built test
fixtures, not an expected runtime path.

## 3. Architecture

Data flows one direction, tree-first:

```
curriculum.ts (generated)
  └─ Lesson.{dottedId, prerequisites[], references[]}
        │
        ▼
  findByDottedId(curriculum, id)  ──►  LessonLocation { levelId, moduleId, lesson }
        │                                     │
        │                                     ├─ lessonPath(loc)   → route
        │                                     └─ lesson.title      → link text
        ▼
  <LessonLink> / <LessonRefLinks>  ──►  react-router <Link>
        ▲
        │ used by
  LessonPage (prereq strip + Where-next)   and   inline in lesson MDX
```

The lesson **tree** is the single source of truth for both route and title, so a single
lookup yields both. `lessonPathById` remains emitted (spec-compliant, useful to any external
consumer) but the runtime components resolve through the tree so title comes for free and
there is no second structure to keep in sync.

## 4. Components

### 4.1 Resolver — `findByDottedId` in `src/lib/curriculumNav.ts`

Add alongside the existing `findLesson`:

```ts
export function findByDottedId(levels: Level[], dottedId: string): LessonLocation | undefined {
  return flattenLessons(levels).find((l) => l.lesson.dottedId === dottedId)
}
```

Reuses `flattenLessons` and the existing `lessonPath(loc)` for the route. ~90 lessons is a
trivial linear scan; no memoized index (YAGNI). No change to `lessonPath`, `findLesson`, or
any other existing helper.

### 4.2 `<LessonLink>` — `src/components/mdx/LessonLink.tsx`

```tsx
interface LessonLinkProps { id: string; children?: ReactNode }
```

- Resolves via `findByDottedId(curriculum, id)`.
- **Found:** renders react-router `<Link to={lessonPath(loc)}>` with text
  `children ?? loc.lesson.title`, styled to match the existing MDX `a` component
  (`text-link underline underline-offset-2 hover:text-primary`).
- **Not found:** renders `children ?? id` inside a plain `<span>` — never a dead link, never
  a throw.
- Registered in `src/components/mdx/mdxComponents.tsx` so lessons can write
  `…as in <LessonLink id="B1.1" />`.

### 4.3 `<LessonRefLinks>` — `src/components/mdx/LessonRefLinks.tsx`

Small presentational component shared by the prereq strip and the Where-next footer:

```tsx
interface LessonRefLinksProps { label: string; ids: string[]; variant: 'inline' | 'list' }
```

- Renders nothing when `ids` is empty (callers may still guard for clarity).
- `variant='inline'`: `label:` followed by `LessonLink`s joined by a `·` separator.
- `variant='list'`: `label` heading above a vertical list of `LessonLink`s, each prefixed
  with a `→` arrow.
- Consumes semantic tokens only; no raw hex.

### 4.4 `LessonPage` wiring — `src/pages/LessonPage.tsx`

- **Prerequisites** (`variant='inline'`, label "Prerequisites"): rendered above the MDX
  content, below the Back button, only when `location.lesson.prerequisites?.length`.
- **Where next** (`variant='list'`, label "Where next"): rendered between the MDX content
  and the Mark-complete footer, only when `location.lesson.references?.length`.
- Plain navigation links, no progress/completion state.

## 5. Dogfood

Add real cross-links to the 5 migrated sample lessons so the feature renders in the running
app and exercises the whole path end-to-end:

- Add `prerequisites` and/or `references` (dotted ids) to a couple of lessons' frontmatter.
- Add one inline `<LessonLink id="…" />` reference in a lesson body.
- Regenerate `curriculum.ts` via `npm run gen:curriculum` (never hand-edited).

## 6. Skill & docs update

Docs-only; no behavioral change (the `--prerequisites`/`--references` flags and frontmatter
fields already exist from Phase 2):

- `.claude/skills/new-lesson/SKILL.md`: add `<LessonLink id="B2.3" />` to the
  authoring-primitives list (beside `<Snippet>`/`<TryPrompt>`/`<ChartEmbed>`) as the way to
  make inline backward references in prose; note that `prerequisites`/`references` now render
  as the Prerequisites strip and the Where-next footer, so authors should set them
  intentionally (user-facing navigation), not merely to satisfy the validator.
- `CLAUDE.md` "Adding lessons & languages": add a one-line mention of `<LessonLink>` only if
  it fits the existing list cleanly.

## 7. Testing

- `curriculumNav.test.ts`: `findByDottedId` resolves a known id; returns `undefined` for an
  unknown id.
- `LessonLink.test.tsx`: renders a `<Link>` with the correct `href` and the resolved title;
  `children` override the text; an unknown id renders plain text with no anchor.
- `LessonRefLinks.test.tsx`: inline vs list variants render the expected links; empty `ids`
  renders nothing.
- `LessonPage.test.tsx`: prereq strip and Where-next render when the lesson has
  `prerequisites`/`references`, and are absent when it does not.
- Acceptance: full Vitest suite, `tsc -b`, `npm run lint`, and `npm run check-snippets` all
  green; `curriculum.ts` regenerates deterministically (no diff beyond the dogfood
  additions).

## 8. Files

New:
- `src/components/mdx/LessonLink.tsx` (+ test)
- `src/components/mdx/LessonRefLinks.tsx` (+ test)

Changed:
- `src/lib/curriculumNav.ts` (+ test) — add `findByDottedId`
- `src/components/mdx/mdxComponents.tsx` — register `LessonLink`
- `src/pages/LessonPage.tsx` (+ test) — prereq strip + Where-next footer
- sample lesson `.mdx` frontmatter/body (dogfood) → regenerated `src/content/curriculum.ts`
- `.claude/skills/new-lesson/SKILL.md`, possibly `CLAUDE.md`

## 9. Execution

Small, single implementation plan. Feature branch `feat/curriculum-phase3-crosslinks` off
main, TDD, landed via a CI-gated PR to main per the initiative's workflow convention.

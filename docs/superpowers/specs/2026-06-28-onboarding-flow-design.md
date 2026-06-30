# Onboarding Flow — Design

**Status:** Approved (brainstorm)
**Date:** 2026-06-28
**Phase:** 4 (onboarding canvas + first-visit/resume routing)
**Depends on:** Phase 3 (app shell, curriculum, contexts, design system)

## Purpose

First-time visitors choose their experience before the learning app appears.
A bare, full-canvas flow (no sidebar / no topbar) walks the user through:

1. **Level** — "Your Claude Code Level" (Beginner / Intermediate / Advanced)
2. **Language** — "Preferred Programming Language" (from the `LANGUAGES` registry)
3. **Intro placeholder** — a minimal "you're all set" screen whose **Continue**
   button completes onboarding and drops the user into the app.

The sidebar and topbar (`AppShell`) appear **only after** onboarding completes.
The real intro page is out of scope for this phase; the placeholder is built so
it can be swapped cleanly later.

## Scope

In scope:
- Three onboarding screens (Level, Language, Intro placeholder), shell-free.
- A `LevelContext` + new `ccc:level` storage key.
- Route restructure so onboarding renders outside `AppShell` and lessons inside it.
- First-visit / resume routing (`RootRedirect`) and gating of `/learn/*`.
- Completion: only the Intro **Continue** sets `ccc:onboarded`.
- Tests for routing decisions, persistence, the description drawer, and completion.

Out of scope (later phases):
- The real intro page content/animation (this phase ships a placeholder).
- Re-onboarding / a "change level" entry point from inside the app.
- Any change to lesson content or the sidebar internals.

## Routing & Architecture

Onboarding lives **outside** `AppShell`; lessons live **inside** it.

```
/                              → RootRedirect (decision only, renders nothing)
/onboarding                    → LevelScreen        ┐ bare canvas,
/onboarding/language           → LanguageScreen     │ centered column,
/onboarding/intro              → IntroPlaceholder    ┘ no AppShell
/learn/:levelId/:moduleId/:lessonId → LessonPage      ← wrapped in AppShell
*                              → redirect to /
```

Structure in `App.tsx` — onboarding routes are siblings of an `AppShell` layout
branch (not nested under it), so the shell never mounts during onboarding:

```tsx
<Routes>
  <Route path="/" element={<RootRedirect />} />
  <Route path="/onboarding" element={<LevelScreen />} />
  <Route path="/onboarding/language" element={<LanguageScreen />} />
  <Route path="/onboarding/intro" element={<IntroPlaceholder />} />
  <Route
    path="/learn/:levelId/:moduleId/:lessonId"
    element={
      <RequireOnboarded>
        <AppShell>
          <LessonPage />
        </AppShell>
      </RequireOnboarded>
    }
  />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

Provider order is unchanged except a new `LevelProvider` is added alongside
`LanguageProvider`: `Theme → Language → Level → Progress → Router`.

### RootRedirect (first-visit / resume)

Pure decision component (renders `<Navigate replace>`):

- **Not onboarded** (`ccc:onboarded` !== true) → `/onboarding`.
- **Onboarded**, with a stored `ccc:lastLesson` path → navigate there.
- **Onboarded**, no `lastLesson`, with `ccc:level` → that level's first lesson.
- **Onboarded**, no `lastLesson`, no `level` → global first lesson.
- No lessons at all → friendly "No lessons yet." fallback (existing behavior).

The lesson-path/first-lesson helpers come from `curriculumNav.ts`. A small pure
helper (e.g. `resolveLandingPath(curriculum, { onboarded, level, lastLesson })`)
encapsulates this so it can be unit-tested without a router.

### Gating

`RequireOnboarded` wraps the `/learn/*` branch: if `ccc:onboarded` !== true it
redirects to `/onboarding`; otherwise renders its children. This prevents the
shell from flashing for a first-time visitor who deep-links into a lesson.

### Completion

- **LevelScreen** persists `ccc:level` and navigates to `/onboarding/language`.
- **LanguageScreen** calls `setLanguage` (persists `ccc:lang`) and navigates to
  `/onboarding/intro`.
- **IntroPlaceholder** "Continue" sets `ccc:onboarded = true`, then navigates to
  the chosen level's first lesson (via `resolveLandingPath`).

A mid-flow refresh keeps the user's level/language picks (already persisted) but
does **not** mark onboarding complete — they resume the flow, not the app.

## State & Storage

- New key in `src/lib/storageKeys.ts`: `level: 'ccc:level'`.
- New `src/context/LevelContext.tsx` mirroring `LanguageContext`:
  - `LevelId = 'beginner' | 'intermediate' | 'advanced'` (the curriculum's level ids).
  - `{ level: LevelId | null, setLevel(id) }`, persisted via `useLocalStorage`,
    memoized value. Default `null` (no level chosen yet).
- `ccc:onboarded` (boolean) and `ccc:lastLesson` (path string) keys already exist
  but are currently **never written**. This phase is the first to write both:
  `onboarded` on Intro **Continue**; `lastLesson` in `LessonPage` on each visit
  (the lesson's full `/learn/...` path), so resume can read it. `RootRedirect`
  reads both.

## Components

All under `src/components/onboarding/`. Shared shell-free layout primitive:

- **`OnboardingLayout`** — centered single column on `bg-background`, max-width
  ~32rem, vertical padding, a step indicator (`1 · 2 · 3`, current emphasized),
  and a slot for an optional secondary **Back** button. Restrained Framer Motion
  fade/slide on mount, `useReducedMotion`-aware (consistent with Phase 3b).

- **`LevelScreen`** (step 1) — heading **"Your Claude Code Level"**. Three stacked
  selectable rows (chunky `Card`/button styling, design-system tokens). Each row:
  - main clickable surface → `setLevel(id)` then navigate to `/onboarding/language`;
  - a separate chevron-down **toggle** on the right → expands an inline description
    drawer (target-audience copy) **without** navigating. Single-open (opening one
    closes others). `aria-expanded` + `aria-controls` on the toggle; the drawer
    has an id. Chevron rotates on open (reduced-motion aware).
  - **No Back button** (first step — nothing precedes it).

  Audience copy:
  - **Beginner** — "For moving from Claude chat to Claude code. Learn what is it, how to install, basic use workflows and commands and complete your first project with claude code."
  - **Intermediate** — "Have used claude code before with basic prompts but haven't tapped into its true potential. Learn about concepts like skills, hooks, mcp server etc, learn how and when to use them, and complete a project utilizing those concepts."
  - **Advanced** — "Comfortable day-to-day and want to become a power user of claude code."

  - Add a small note say all level models are accessible to any level user can users can move to higher levels after completing one level.

- **`LanguageScreen`** (step 2) — heading **"Preferred Programming Language"**.
  Options rendered from the `LANGUAGES` registry (Python, JavaScript today), each
  a selectable row. Selecting → `setLanguage(id)` then navigate to
  `/onboarding/intro`. Below the last option, a muted note:
  > **Don't see your programming language?**
  > The course is language-independent — concepts and prompts apply to any
  > language. Your selection only flavors the code-snippet examples.

  Secondary **Back** button → `/onboarding`.

- **`IntroPlaceholder`** (step 3) — heading **"You're all set"**, a one-line
  "Full intro coming soon" note, a primary **Continue** `Button` (sets
  `ccc:onboarded`, navigates to the level's first lesson), and a secondary
  **Back** button → `/onboarding/language`. This screen is replaced wholesale by
  the real intro next phase.

### Back button

Secondary `Button` variant (chunky), present on **Language** and **Intro** steps.
The Level step omits it (no previous step). Back navigates to the prior step and
does not clear persisted picks.

## Design System Compliance

- Semantic tokens only (`bg-background`, `text-foreground`/`text-muted-foreground`,
  `border-ink`, `bg-card`); no raw hex, no `--ccc-*`, no emoji.
- Brand coral for primary affordances; green reserved for success/completed only.
- Chunky primitives (`Button`, `Card`, `Badge`) reused; new rows match that style.
- Buttons: `cursor-pointer`, visible focus ring, ≥44px hit targets.
- Both light and dark verified.
- Framer Motion honors `prefers-reduced-motion`.

## Testing

Vitest + React Testing Library (jsdom), matching prior phases (pristine output).

- **`resolveLandingPath`** (pure): not-onboarded → `/onboarding`; onboarded +
  lastLesson → that path; onboarded + level, no lastLesson → level's first lesson;
  onboarded, neither → global first lesson; no lessons → null.
- **`RootRedirect`**: renders the right `<Navigate>` target for each case (via
  `MemoryRouter` + a location probe).
- **`RequireOnboarded`**: not onboarded → redirects to `/onboarding`; onboarded →
  renders children.
- **`LevelContext`**: persists to `ccc:level`; default null.
- **`LevelScreen`**: selecting a row persists level + navigates to language;
  toggling a chevron opens exactly one drawer (`aria-expanded` true) and a second
  toggle closes the first.
- **`LanguageScreen`**: renders one option per `LANGUAGES` entry; selecting calls
  `setLanguage` + navigates to intro; Back → `/onboarding`.
- **`IntroPlaceholder`**: Continue sets `ccc:onboarded` + navigates to the level's
  first lesson; Back → `/onboarding/language`.
- **`LessonPage`**: visiting a lesson writes its `/learn/...` path to `ccc:lastLesson`.

## Open Questions / Deferred

- Real intro page content + completion animation — next phase.
- In-app "change level / re-run onboarding" entry — deferred.
- A deferred a11y pass (from Phase 3b) may also cover any onboarding `<section>`
  labels and disclosure `aria-controls` consistency.

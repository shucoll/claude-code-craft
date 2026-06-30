# Intro Crawl — Design

**Status:** Approved (brainstorm)
**Date:** 2026-06-29
**Phase:** 4.5 (the real intro page — replaces the Phase 4 placeholder)
**Depends on:** Phase 4 onboarding (route `/onboarding/intro`, `setOnboarded`, `resolveLandingPath`, `LevelContext`)

## Purpose

The final beat of onboarding: a Star Wars–style opening **crawl**. On entering the
intro the screen fades into a dark, star-filled space and coral text recedes toward
a vanishing point — an opening line, a title, and a few fun paragraphs about coding
with AI. When the crawl finishes (or the user skips/continues), onboarding completes
and the user drops into their first lesson.

This **replaces** the Phase 4 `IntroPlaceholder` at the same route. The completion
behavior is unchanged (`setOnboarded()` then navigate to the resolved landing path).

## Scope

In scope:
- `IntroScene` replacing `IntroPlaceholder` at `/onboarding/intro`.
- A self-contained dark cinematic scene (starfield + crawl) that does NOT alter the
  global theme or persistence.
- The 3D perspective crawl animation, with a non-animated equivalent for
  `prefers-reduced-motion`.
- Skip / Skip & Continue / Continue controls.

Out of scope:
- Any change to the level/language onboarding steps or the lesson app.
- Audio. Replaying/seeking controls beyond Skip.
- Persisting that the intro was seen (onboarding completion already covers re-entry).

## The self-contained dark scene (key mechanism)

The scene must look dark **regardless of the user's saved light/dark preference**, and
must NOT touch `ThemeContext`, `<html>`, or storage (so there is no flash when the app
renders afterward in the user's real theme).

Mechanism: the scene's **root element carries the `dark` class**. Tailwind v4's
configured variant is `@custom-variant dark (&:where(.dark, .dark *))`, so every
semantic token used *inside* the scene (`bg-background`, `text-foreground`, the
secondary `Button`, the coral `accent`) resolves to its **dark** value — scoped to this
subtree only. This keeps the scene fully on the design system (no raw hex) while staying
dark for light-theme users, and leaves global theme state untouched.

- Backdrop: `bg-background` (dark slate) under the starfield reads as deep space.
- Crawl text: the **coral accent token** (`text-accent` / accent foreground), per the
  brand choice. In the scoped-dark subtree this is the dark-mode coral.

## Routing & completion

Route element for `/onboarding/intro` changes from `IntroPlaceholder` to `IntroScene`.
`IntroPlaceholder.tsx` and its test are deleted. Completion logic is carried over verbatim:

```tsx
const handleContinue = () => {
  setOnboarded()
  const path = resolveLandingPath(curriculum, { onboarded: true, level, lastLesson: null }) ?? '/'
  navigate(path, { replace: true })
}
```

`level` comes from `useLevel()`. There is **no Back button** on the intro (per the
finalized control set — Skip / Skip & Continue / Continue). This is a deliberate
departure from the Back-on-every-step pattern of the level/language screens, because the
crawl is the climactic end of onboarding; users change language later via the in-app
switcher.

## Components

All under `src/components/onboarding/intro/`:

- **`introContent.ts`** — the copy as a typed constant:
  ```ts
  export interface IntroContent { openingLine: string; title: string; paragraphs: string[] }
  export const INTRO_CONTENT: IntroContent = {
    openingLine: 'Long, long ago, in a galaxy far, far away….',
    title: 'CLAUDE CODE',
    paragraphs: [
      'It is a period of endless deadlines. Developers, buried under bug reports and boilerplate, cry out across the galaxy for help.',
      'From the outer rim comes a new ally — an AI that reads your code, runs your tests, and edits files at your command.',
      'But raw power is not enough. To wield it well you must master its ways: the prompts, the workflows, the tools that turn a chat into a co-pilot.',
      'Your training begins now….',
    ],
  }
  ```

- **`Starfield.tsx`** — decorative star background, `aria-hidden="true"`. CSS-generated
  stars (layered radial-gradients or box-shadow dots) with a gentle twinkle that is
  disabled under reduced motion (the global `prefers-reduced-motion` CSS already zeroes
  the keyframes; the component need not branch, but it must not be the sole carrier of
  meaning since it is decorative).

- **`Crawl.tsx`** — the animated path only. Props `{ content: IntroContent; onComplete: () => void }`.
  - An opening line that fades in then out over the first few seconds (framer or CSS).
  - A tilted plane (`[perspective:...]` on a wrapper + `rotateX(...)` on the plane) whose
    inner text (title + paragraphs) animates from the foreground upward/backward toward a
    vanishing point, with a top mask-gradient fading it into the distance.
  - Duration is a single tunable constant (start ~24s).
  - Calls `onComplete` on the crawling element's `onAnimationEnd`.

- **`StaticIntro.tsx`** — the non-animated presentation. Props `{ content: IntroContent }`.
  Renders the title (as the scene `<h1>`) and paragraphs upright and readable. Used for
  BOTH the `done` state and the reduced-motion path (DRY — one readable rendering).

- **`IntroScene.tsx`** — orchestrator (route element):
  - Root: `<div className="dark fixed inset-0 …">` containing `Starfield`, the active
    presentation, and the controls. Entry fade (framer `opacity 0→1`, ~600ms), gated by
    `useReducedMotion()`.
  - Phase state: `'playing' | 'done'`. Initial phase is `'done'` when `useReducedMotion()`
    is true (no animation to play), else `'playing'`.
  - `'playing'`: render `Crawl` (with `onComplete={() => setPhase('done')}`).
  - `'done'`: render `StaticIntro`.
  - Owns `handleContinue` (above) via `useLevel()` + `useNavigate()`.

## Controls (finalized)

Rendered over the scene (fixed, bottom):

- **Phase `playing`:**
  - **Skip** (`variant="ghost"`) → `setPhase('done')` (fast-forwards to the end state;
    does NOT navigate).
  - **Skip & Continue** (`variant="secondary"`) → `handleContinue()`.
- **Phase `done`:**
  - **Continue** (`variant="primary"`) → `handleContinue()`.

(Variants chosen for hierarchy; all use the existing `Button` primitive, which renders
correctly dark inside the scoped-`dark` root.)

## Reduced motion (required)

`prefers-reduced-motion: reduce` users get a non-animated equivalent:
- no entry fade, no 3D crawl, no twinkle;
- the scene appears already dark (scoped `dark`) with a static starfield;
- the **same content** shown via `StaticIntro` (upright, readable);
- controls start in the `done` state — a single **Continue** (no Skip, since there is
  nothing to skip).

This is detected with framer's `useReducedMotion()`, consistent with Phase 3b/4.

## Design-system compliance

- Scoped `dark` keeps the scene on **semantic tokens only** — no raw hex, no `--ccc-*`.
  `bg-background`, `text-foreground`/`text-muted-foreground`, the coral **accent** token
  for crawl text, and the `Button` primitive all resolve to dark values in-subtree.
- `bg-black` (a standard utility, not a hex literal) MAY be used for the absolute
  backdrop if deeper-than-slate space is wanted; default is `bg-background`.
- Green remains reserved for success only; no emoji.
- All motion honors `prefers-reduced-motion`.

## Testing

Vitest + RTL (jsdom). Animation *timing* is not asserted in jsdom; completion is driven
through the `onComplete` / `animationEnd` seam, and the reduced-motion branch is exercised
by mocking `useReducedMotion`.

- **Motion on** — `IntroScene` renders the crawl content (title + a paragraph). **Skip &
  Continue** calls `setOnboarded` (`ccc:onboarded` = true) and navigates to the resolved
  lesson path.
- **Skip** (motion on) collapses controls to a single **Continue** (the two playing
  buttons gone) without navigating.
- Firing the crawling element's `animationEnd` transitions to `done` (single **Continue**).
- **Continue** (done state) calls `setOnboarded` and navigates.
- **Reduced motion** (mock `useReducedMotion → true`) renders the static content and a
  single **Continue** immediately (no Skip); **Continue** completes onboarding.
- `Starfield` is `aria-hidden`.

## Open questions / deferred

- Exact crawl duration is a constant to tune during implementation/manual review.
- The opening-line beat (`'Long, long ago…'`) timing is part of `Crawl`'s internal
  animation; if it complicates the `done`/skip transition, it may render as a brief
  fade within the playing phase rather than a separate sub-phase.

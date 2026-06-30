# Intro Crawl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the onboarding intro placeholder with a Star Wars–style coral text crawl on a self-contained dark starfield, with Skip / Skip & Continue / Continue controls and a full reduced-motion equivalent, completing onboarding into the first lesson.

**Architecture:** A new `IntroScene` (route element at `/onboarding/intro`) renders inside a scoped-`dark` full-bleed container so semantic tokens resolve to dark values without touching global theme. It composes a decorative `Starfield`, an animated `Crawl` (3D perspective recede, fires `onComplete` on its CSS `animationend`) or a static `StaticIntro` (the `done`/reduced-motion presentation), and the controls. Completion reuses `setOnboarded()` + `resolveLandingPath(...)` from Phase 4.

**Tech Stack:** Vite + React + TypeScript (strict), react-router-dom v7, Framer Motion, a plain `intro.css` for the crawl/starfield keyframes, Vitest + React Testing Library (jsdom), Tailwind v4 design-system tokens.

## Global Constraints

- TypeScript strict; **no `any`** in committed code.
- The scene is **self-contained dark**: its root carries the `dark` class so all semantic tokens inside resolve to dark values. It MUST NOT touch `ThemeContext`, `<html>`, or any storage for theming.
- Consume **semantic tokens** for all React `className` colors (`bg-background`, `text-foreground`/`text-muted-foreground`, and the coral **accent** token `text-accent` for crawl text). **No raw hex, no `--ccc-*` primitives, no emoji** in TSX.
- The one **documented exception**: `intro.css` (a scene-scoped decorative stylesheet) may use the CSS named color `white` for stars and `transparent`. This is cinematic decoration, not a component token; it is intentional.
- **Green is reserved for success/completed only** — coral is the crawl/brand color.
- Reuse the existing `Button` primitive. Controls: **Skip** (`variant="ghost"`), **Skip & Continue** (`variant="secondary"`), **Continue** (default primary).
- **No Back button** on the intro (deliberate — finalized control set is Skip / Skip & Continue / Continue).
- All motion honors `prefers-reduced-motion` via `useReducedMotion()`; reduced motion gets the non-animated `StaticIntro` + a single Continue.
- Tests run with **pristine output**. Vitest globals (`test`, `expect`, `vi`, `fireEvent` via RTL) are enabled; `src/test/setup.ts` clears `localStorage` after each test and stubs `matchMedia` (so `useReducedMotion()` returns false by default).
- Run a single test file with `npm test -- <path>`.

---

## File Structure

**Create (all under `src/components/onboarding/intro/`):**
- `introContent.ts` — the crawl copy as a typed constant.
- `intro.css` — scene stylesheet: starfield + crawl keyframes (built across Tasks 2 and 4).
- `Starfield.tsx` — decorative `aria-hidden` star background.
- `StaticIntro.tsx` — upright readable title + paragraphs (used by `done` and reduced motion).
- `Crawl.tsx` — animated opening line + 3D crawl; fires `onComplete` on `animationend`.
- `IntroScene.tsx` — orchestrator / route element.
- Plus a `*.test.tsx` / `*.test.ts` beside each (IntroScene has two: a motion file and a reduced-motion file).

**Modify:**
- `src/App.tsx` — swap the `/onboarding/intro` route element from `IntroPlaceholder` to `IntroScene`.

**Delete:**
- `src/components/onboarding/IntroPlaceholder.tsx` and `src/components/onboarding/IntroPlaceholder.test.tsx`.

---

## Task 1: Intro content constant

**Files:**
- Create: `src/components/onboarding/intro/introContent.ts`
- Test: `src/components/onboarding/intro/introContent.test.ts`

**Interfaces:**
- Produces: `interface IntroContent { openingLine: string; title: string; paragraphs: string[] }` and `INTRO_CONTENT: IntroContent`.

- [ ] **Step 1: Write the failing test**

Create `src/components/onboarding/intro/introContent.test.ts`:

```ts
import { INTRO_CONTENT } from './introContent'

test('INTRO_CONTENT carries the opening line, title, and crawl paragraphs', () => {
  expect(INTRO_CONTENT.openingLine.toLowerCase()).toContain('long, long ago')
  expect(INTRO_CONTENT.title).toBe('CLAUDE CODE')
  expect(INTRO_CONTENT.paragraphs.length).toBeGreaterThanOrEqual(3)
  expect(INTRO_CONTENT.paragraphs.every((p) => p.length > 0)).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/onboarding/intro/introContent.test.ts`
Expected: FAIL — cannot resolve `./introContent`.

- [ ] **Step 3: Implement the content**

Create `src/components/onboarding/intro/introContent.ts`:

```ts
export interface IntroContent {
  openingLine: string
  title: string
  paragraphs: string[]
}

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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/onboarding/intro/introContent.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/intro/introContent.ts src/components/onboarding/intro/introContent.test.ts
git commit -m "feat: add intro crawl content constant"
```

---

## Task 2: Starfield + scene stylesheet

**Files:**
- Create: `src/components/onboarding/intro/Starfield.tsx`
- Create: `src/components/onboarding/intro/intro.css`
- Test: `src/components/onboarding/intro/Starfield.test.tsx`

**Interfaces:**
- Produces: `Starfield()` — renders `<div aria-hidden="true" class="intro-starfield …">`. The `intro.css` file defines `.intro-starfield` (it will be extended with crawl styles in Task 4 and imported by `IntroScene` in Task 5).

- [ ] **Step 1: Write the failing test**

Create `src/components/onboarding/intro/Starfield.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { Starfield } from './Starfield'

test('renders a decorative starfield hidden from assistive tech', () => {
  const { container } = render(<Starfield />)
  const el = container.querySelector('.intro-starfield')
  expect(el).not.toBeNull()
  expect(el).toHaveAttribute('aria-hidden', 'true')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/onboarding/intro/Starfield.test.tsx`
Expected: FAIL — cannot resolve `./Starfield`.

- [ ] **Step 3: Create the scene stylesheet (starfield section)**

Create `src/components/onboarding/intro/intro.css`:

```css
/* Intro scene stylesheet — scoped to the IntroScene subtree.
   Decorative cinematic styles: named colors (white/transparent) are an
   intentional documented exception to the semantic-tokens-only rule. */

.intro-starfield {
  background-image:
    radial-gradient(1px 1px at 20% 30%, white, transparent),
    radial-gradient(1px 1px at 70% 60%, white, transparent),
    radial-gradient(1.5px 1.5px at 40% 80%, white, transparent),
    radial-gradient(1px 1px at 85% 25%, white, transparent),
    radial-gradient(1px 1px at 55% 15%, white, transparent),
    radial-gradient(1.5px 1.5px at 10% 70%, white, transparent),
    radial-gradient(1px 1px at 90% 90%, white, transparent),
    radial-gradient(1px 1px at 33% 50%, white, transparent);
  opacity: 0.85;
  animation: intro-twinkle 4s ease-in-out infinite alternate;
}

@keyframes intro-twinkle {
  from { opacity: 0.6; }
  to { opacity: 0.95; }
}
```

- [ ] **Step 4: Implement Starfield**

Create `src/components/onboarding/intro/Starfield.tsx`:

```tsx
export function Starfield() {
  return <div aria-hidden="true" className="intro-starfield pointer-events-none absolute inset-0" />
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/components/onboarding/intro/Starfield.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding/intro/Starfield.tsx src/components/onboarding/intro/intro.css src/components/onboarding/intro/Starfield.test.tsx
git commit -m "feat: add intro Starfield and scene stylesheet"
```

---

## Task 3: StaticIntro (non-animated presentation)

**Files:**
- Create: `src/components/onboarding/intro/StaticIntro.tsx`
- Test: `src/components/onboarding/intro/StaticIntro.test.tsx`

**Interfaces:**
- Consumes: `IntroContent` (from `./introContent`).
- Produces: `StaticIntro({ content: IntroContent })` — renders an `<h1>` with `content.title` and one `<p>` per `content.paragraphs`. Used for the `done` state and the reduced-motion path.

- [ ] **Step 1: Write the failing test**

Create `src/components/onboarding/intro/StaticIntro.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { INTRO_CONTENT } from './introContent'
import { StaticIntro } from './StaticIntro'

test('renders the title as a heading and every paragraph', () => {
  render(<StaticIntro content={INTRO_CONTENT} />)
  expect(screen.getByRole('heading', { name: INTRO_CONTENT.title })).toBeInTheDocument()
  for (const p of INTRO_CONTENT.paragraphs) {
    expect(screen.getByText(p)).toBeInTheDocument()
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/onboarding/intro/StaticIntro.test.tsx`
Expected: FAIL — cannot resolve `./StaticIntro`.

- [ ] **Step 3: Implement StaticIntro**

Create `src/components/onboarding/intro/StaticIntro.tsx`:

```tsx
import type { IntroContent } from './introContent'

export function StaticIntro({ content }: { content: IntroContent }) {
  return (
    <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-5 px-6">
      <h1 className="text-center text-3xl font-bold text-accent sm:text-4xl">{content.title}</h1>
      {content.paragraphs.map((p, i) => (
        <p key={i} className="text-center text-base leading-relaxed text-accent/90">
          {p}
        </p>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/onboarding/intro/StaticIntro.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/intro/StaticIntro.tsx src/components/onboarding/intro/StaticIntro.test.tsx
git commit -m "feat: add StaticIntro readable presentation"
```

---

## Task 4: Crawl (animated 3D recede)

**Files:**
- Create: `src/components/onboarding/intro/Crawl.tsx`
- Modify: `src/components/onboarding/intro/intro.css` (append the crawl styles)
- Test: `src/components/onboarding/intro/Crawl.test.tsx`

**Interfaces:**
- Consumes: `IntroContent` (from `./introContent`); `motion` (framer-motion); `AnimationEvent` type (from `react`).
- Produces: `Crawl({ content: IntroContent; onComplete: () => void })`. Renders the opening line (fades in→out), then the title + paragraphs on a perspective-tilted plane that scrolls via the CSS keyframe `intro-crawl-scroll`. The scrolling element has `data-testid="intro-crawl"` and `onAnimationEnd`; `onComplete` fires only when `e.animationName === 'intro-crawl-scroll'`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/onboarding/intro/Crawl.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { INTRO_CONTENT } from './introContent'
import { Crawl } from './Crawl'

test('renders the opening line, title, and paragraphs', () => {
  render(<Crawl content={INTRO_CONTENT} onComplete={() => {}} />)
  expect(screen.getByText(INTRO_CONTENT.openingLine)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: INTRO_CONTENT.title })).toBeInTheDocument()
  expect(screen.getByText(INTRO_CONTENT.paragraphs[0])).toBeInTheDocument()
})

test('calls onComplete when the crawl scroll animation ends', () => {
  const onComplete = vi.fn()
  render(<Crawl content={INTRO_CONTENT} onComplete={onComplete} />)
  fireEvent.animationEnd(screen.getByTestId('intro-crawl'), { animationName: 'intro-crawl-scroll' })
  expect(onComplete).toHaveBeenCalledTimes(1)
})

test('ignores unrelated animationend events', () => {
  const onComplete = vi.fn()
  render(<Crawl content={INTRO_CONTENT} onComplete={onComplete} />)
  fireEvent.animationEnd(screen.getByTestId('intro-crawl'), { animationName: 'intro-twinkle' })
  expect(onComplete).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/onboarding/intro/Crawl.test.tsx`
Expected: FAIL — cannot resolve `./Crawl`.

- [ ] **Step 3: Append the crawl styles to intro.css**

Append to `src/components/onboarding/intro/intro.css`:

```css
.intro-crawl-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  perspective: 320px;
  -webkit-mask-image: linear-gradient(to top, transparent 0%, black 20%, black 68%, transparent 96%);
  mask-image: linear-gradient(to top, transparent 0%, black 20%, black 68%, transparent 96%);
}

.intro-crawl {
  position: absolute;
  top: 100%;
  left: 50%;
  width: min(92vw, 48rem);
  transform-origin: 50% 0%;
  transform: translateX(-50%) rotateX(28deg);
  animation: intro-crawl-scroll var(--intro-crawl-duration, 24s) linear forwards;
}

@keyframes intro-crawl-scroll {
  from { top: 100%; }
  to { top: -180%; }
}
```

- [ ] **Step 4: Implement Crawl**

Create `src/components/onboarding/intro/Crawl.tsx`:

```tsx
import { motion } from 'framer-motion'
import type { AnimationEvent } from 'react'
import type { IntroContent } from './introContent'

export function Crawl({ content, onComplete }: { content: IntroContent; onComplete: () => void }) {
  const handleAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'intro-crawl-scroll') onComplete()
  }

  return (
    <div className="absolute inset-0 z-10">
      <motion.p
        className="absolute left-1/2 top-[28%] w-full -translate-x-1/2 px-6 text-center text-lg text-accent sm:text-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 4, times: [0, 0.2, 0.75, 1], ease: 'easeInOut' }}
      >
        {content.openingLine}
      </motion.p>

      <div className="intro-crawl-viewport">
        <div className="intro-crawl" data-testid="intro-crawl" onAnimationEnd={handleAnimationEnd}>
          <h1 className="mb-8 text-center text-4xl font-bold tracking-wide text-accent sm:text-6xl">
            {content.title}
          </h1>
          {content.paragraphs.map((p, i) => (
            <p key={i} className="mb-6 text-justify text-xl leading-relaxed text-accent sm:text-2xl">
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/components/onboarding/intro/Crawl.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding/intro/Crawl.tsx src/components/onboarding/intro/intro.css src/components/onboarding/intro/Crawl.test.tsx
git commit -m "feat: add animated intro Crawl"
```

---

## Task 5: IntroScene orchestrator

**Files:**
- Create: `src/components/onboarding/intro/IntroScene.tsx`
- Test: `src/components/onboarding/intro/IntroScene.test.tsx`
- Test: `src/components/onboarding/intro/IntroScene.reduced-motion.test.tsx`

**Interfaces:**
- Consumes: `Starfield`, `Crawl`, `StaticIntro`, `INTRO_CONTENT` (siblings); `useLevel` (`../../../context/LevelContext`); `setOnboarded` (`../../../lib/onboarding`); `resolveLandingPath` (`../../../lib/landing`); `curriculum` (`../../../content/curriculum`); `Button` (`../../ui/Button`); `motion`/`useReducedMotion` (framer-motion); `useNavigate` (react-router-dom); imports `./intro.css`.
- Produces: `IntroScene()` — the route element for `/onboarding/intro`.

- [ ] **Step 1: Write the failing motion tests**

Create `src/components/onboarding/intro/IntroScene.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LevelProvider } from '../../../context/LevelContext'
import { INTRO_CONTENT } from './introContent'
import { IntroScene } from './IntroScene'

function renderScene() {
  return render(
    <LevelProvider>
      <MemoryRouter initialEntries={['/onboarding/intro']}>
        <Routes>
          <Route path="/onboarding/intro" element={<IntroScene />} />
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<div>LESSON PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('plays the crawl with Skip and Skip & Continue controls', () => {
  renderScene()
  expect(screen.getByRole('heading', { name: INTRO_CONTENT.title })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /skip & continue/i })).toBeInTheDocument()
})

test('Skip & Continue completes onboarding and enters the app', async () => {
  const user = userEvent.setup()
  renderScene()
  await user.click(screen.getByRole('button', { name: /skip & continue/i }))
  expect(JSON.parse(localStorage.getItem('ccc:onboarded')!)).toBe(true)
  expect(await screen.findByText('LESSON PAGE')).toBeInTheDocument()
})

test('Skip fast-forwards to the end state without leaving the intro', async () => {
  const user = userEvent.setup()
  renderScene()
  await user.click(screen.getByRole('button', { name: 'Skip' }))
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /skip & continue/i })).not.toBeInTheDocument()
  expect(screen.queryByText('LESSON PAGE')).not.toBeInTheDocument()
  expect(localStorage.getItem('ccc:onboarded')).toBeNull()
})

test('the crawl finishing collapses the controls to a single Continue', () => {
  renderScene()
  fireEvent.animationEnd(screen.getByTestId('intro-crawl'), { animationName: 'intro-crawl-scroll' })
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
})

test('Continue in the end state completes onboarding and enters the app', async () => {
  const user = userEvent.setup()
  renderScene()
  await user.click(screen.getByRole('button', { name: 'Skip' }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  expect(JSON.parse(localStorage.getItem('ccc:onboarded')!)).toBe(true)
  expect(await screen.findByText('LESSON PAGE')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/onboarding/intro/IntroScene.test.tsx`
Expected: FAIL — cannot resolve `./IntroScene`.

- [ ] **Step 3: Implement IntroScene**

Create `src/components/onboarding/intro/IntroScene.tsx`:

```tsx
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { curriculum } from '../../../content/curriculum'
import { useLevel } from '../../../context/LevelContext'
import { resolveLandingPath } from '../../../lib/landing'
import { setOnboarded } from '../../../lib/onboarding'
import { Button } from '../../ui/Button'
import { Crawl } from './Crawl'
import { Starfield } from './Starfield'
import { StaticIntro } from './StaticIntro'
import { INTRO_CONTENT } from './introContent'
import './intro.css'

type Phase = 'playing' | 'done'

export function IntroScene() {
  const navigate = useNavigate()
  const { level } = useLevel()
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(reduce ? 'done' : 'playing')

  const handleContinue = () => {
    setOnboarded()
    const path = resolveLandingPath(curriculum, { onboarded: true, level, lastLesson: null }) ?? '/'
    navigate(path, { replace: true })
  }

  return (
    <motion.main
      className="dark fixed inset-0 z-[var(--z-modal)] flex flex-col overflow-hidden bg-background"
      initial={{ opacity: reduce ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.6, ease: 'easeInOut' }}
    >
      <Starfield />

      <div className="relative flex flex-1 items-center justify-center">
        {phase === 'playing' ? (
          <Crawl content={INTRO_CONTENT} onComplete={() => setPhase('done')} />
        ) : (
          <StaticIntro content={INTRO_CONTENT} />
        )}
      </div>

      <div className="relative z-20 flex justify-center gap-3 p-6">
        {phase === 'playing' ? (
          <>
            <Button variant="ghost" onClick={() => setPhase('done')}>
              Skip
            </Button>
            <Button variant="secondary" onClick={handleContinue}>
              Skip &amp; Continue
            </Button>
          </>
        ) : (
          <Button onClick={handleContinue}>Continue</Button>
        )}
      </div>
    </motion.main>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/onboarding/intro/IntroScene.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the reduced-motion tests**

Create `src/components/onboarding/intro/IntroScene.reduced-motion.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LevelProvider } from '../../../context/LevelContext'
import { INTRO_CONTENT } from './introContent'

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>()
  return { ...actual, useReducedMotion: () => true }
})

import { IntroScene } from './IntroScene'

function renderScene() {
  return render(
    <LevelProvider>
      <MemoryRouter initialEntries={['/onboarding/intro']}>
        <Routes>
          <Route path="/onboarding/intro" element={<IntroScene />} />
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<div>LESSON PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('reduced motion shows static content and a single Continue (no Skip, no crawl)', () => {
  renderScene()
  expect(screen.getByRole('heading', { name: INTRO_CONTENT.title })).toBeInTheDocument()
  expect(screen.getByText(INTRO_CONTENT.paragraphs[0])).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
  expect(screen.queryByTestId('intro-crawl')).not.toBeInTheDocument()
})

test('reduced-motion Continue completes onboarding and enters the app', async () => {
  const user = userEvent.setup()
  renderScene()
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  expect(JSON.parse(localStorage.getItem('ccc:onboarded')!)).toBe(true)
  expect(await screen.findByText('LESSON PAGE')).toBeInTheDocument()
})
```

- [ ] **Step 6: Run the reduced-motion tests to verify they pass**

Run: `npm test -- src/components/onboarding/intro/IntroScene.reduced-motion.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding/intro/IntroScene.tsx src/components/onboarding/intro/IntroScene.test.tsx src/components/onboarding/intro/IntroScene.reduced-motion.test.tsx
git commit -m "feat: add IntroScene orchestrating the crawl"
```

---

## Task 6: Wire IntroScene into routing; remove the placeholder

**Files:**
- Modify: `src/App.tsx`
- Delete: `src/components/onboarding/IntroPlaceholder.tsx`, `src/components/onboarding/IntroPlaceholder.test.tsx`

**Interfaces:**
- Consumes: `IntroScene` (`./components/onboarding/intro/IntroScene`).

- [ ] **Step 1: Swap the import in App.tsx**

In `src/App.tsx`, replace the line:

```tsx
import { IntroPlaceholder } from './components/onboarding/IntroPlaceholder'
```

with:

```tsx
import { IntroScene } from './components/onboarding/intro/IntroScene'
```

- [ ] **Step 2: Swap the route element**

In `src/App.tsx`, change the intro route from:

```tsx
                <Route path="/onboarding/intro" element={<IntroPlaceholder />} />
```

to:

```tsx
                <Route path="/onboarding/intro" element={<IntroScene />} />
```

- [ ] **Step 3: Delete the placeholder and its test**

Run:

```bash
git rm src/components/onboarding/IntroPlaceholder.tsx src/components/onboarding/IntroPlaceholder.test.tsx
```

- [ ] **Step 4: Run the full suite + type-check/build**

Run: `npm test`
Expected: PASS, pristine output. (The old `IntroPlaceholder.test.tsx` is gone; the new intro tests cover the route element. `App.test.tsx` does not reference the intro and still passes.)

Run: `npm run build`
Expected: `tsc -b && vite build` succeed with no errors (confirms no dangling `IntroPlaceholder` references and that `./intro.css` resolves).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: route the onboarding intro to the Star Wars crawl"
```

---

## Manual verification (after all tasks)

Run `npm run dev`, complete onboarding to the intro (level → language → intro):

1. The screen fades into darkness; a starfield appears; the opening line fades in/out; coral title + paragraphs recede toward the top. Works in both light and dark app themes (the scene stays dark either way), and the app returns to the user's real theme after Continue (no flash).
2. During the crawl: **Skip** jumps to the settled end state (single **Continue**) without leaving; **Skip & Continue** jumps straight into the first lesson.
3. Letting the crawl finish on its own collapses the controls to a single **Continue**.
4. **Continue** lands on the chosen level's first lesson with the app shell present.
5. With OS "reduce motion" on: no fade/crawl/twinkle — static coral title + paragraphs on a static starfield, single **Continue** that works.

---

## Self-Review Notes

- **Spec coverage:** scoped-dark self-contained scene (T5 root `dark` + `bg-background`); coral accent text (T3/T4/`text-accent`); Starfield aria-hidden (T2); animated crawl + opening line + `onComplete` seam (T4); StaticIntro for done/reduced (T3); IntroScene phases + controls + completion reuse (T5); reduced-motion equivalent (T5 reduced file); no Back button (T5 controls); replaces placeholder at the route (T6). All spec sections map to a task.
- **Type consistency:** `IntroContent`/`INTRO_CONTENT` defined T1, consumed T3/T4/T5; `Crawl`'s `onComplete: () => void` defined T4, consumed T5; `data-testid="intro-crawl"` + `animationName === 'intro-crawl-scroll'` consistent across T4 impl and T4/T5 tests.
- **No placeholders:** every code/test step carries full content. `intro.css` named-color exception is documented in Global Constraints.

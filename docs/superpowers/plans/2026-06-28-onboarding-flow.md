# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First-time visitors pick a level then a language on a bare, shell-free canvas, hit an intro placeholder whose **Continue** completes onboarding and drops them into the app; returning visitors resume where they left off.

**Architecture:** Onboarding routes (`/onboarding`, `/onboarding/language`, `/onboarding/intro`) render outside `AppShell`; lesson routes render inside it behind a `RequireOnboarded` gate. A pure `resolveLandingPath` helper drives both the root redirect (first-visit vs resume) and the intro's Continue. A new `LevelContext` (+`ccc:level`) persists the chosen level; `ccc:onboarded` and `ccc:lastLesson` are written for the first time (on Continue, and on each lesson visit).

**Tech Stack:** Vite + React + TypeScript (strict), react-router-dom v7, Framer Motion, Vitest + React Testing Library (jsdom), Tailwind v4 design-system tokens.

## Global Constraints

- TypeScript strict; **no `any`** in committed code.
- Consume **semantic tokens only** (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-ink`, `bg-primary`, …). **No raw hex, no `--ccc-*` primitives, no emoji.**
- **Green is reserved for success/completed only** — never for brand/primary affordances (coral is brand).
- All localStorage keys live in `src/lib/storageKeys.ts`, `ccc:` namespace.
- Reuse design-system primitives (`Button` etc.) and the "chunky" style (`border-2 border-ink shadow-hard`). Interactive controls: `cursor-pointer`, visible focus ring (inherited from base layer), ≥44px hit targets.
- All animation honors `prefers-reduced-motion` via `useReducedMotion()` (duration → 0 when reduced).
- Verify both light and dark modes.
- Tests must run with **pristine output** — when a test asserts a thrown error, wrap the render in `vi.spyOn(console, 'error').mockImplementation(() => {})` and restore after.
- Vitest globals are enabled (`test`, `expect`, `vi` need no import). `localStorage` is cleared after each test by `src/test/setup.ts`.

---

## File Structure

**Create:**
- `src/context/LevelContext.tsx` — `LevelProvider` / `useLevel`; persists `ccc:level`.
- `src/lib/onboarding.ts` — imperative localStorage accessors for `ccc:onboarded` / `ccc:lastLesson`.
- `src/lib/landing.ts` — pure `resolveLandingPath` (first-visit / resume decision).
- `src/components/onboarding/OnboardingLayout.tsx` — shared shell-free canvas + step indicator.
- `src/components/onboarding/LevelScreen.tsx` — step 1.
- `src/components/onboarding/LanguageScreen.tsx` — step 2.
- `src/components/onboarding/IntroPlaceholder.tsx` — step 3.
- `src/components/onboarding/RootRedirect.tsx` — `/` decision component.
- `src/components/onboarding/RequireOnboarded.tsx` — gate for `/learn/*`.
- Plus a `*.test.tsx` / `*.test.ts` beside each of the above.

**Modify:**
- `src/lib/storageKeys.ts` — add `level: 'ccc:level'`.
- `src/lib/curriculumNav.ts` — add exported `lessonPath(loc)` helper.
- `src/pages/LessonPage.tsx` — write `ccc:lastLesson` on visit.
- `src/App.tsx` — restructure routes + add `LevelProvider`; replace inline `RootRedirect`.
- `src/App.test.tsx` — entry now shows onboarding for a fresh user; shell appears when onboarded.

---

## Task 1: Level storage key + LevelContext

**Files:**
- Modify: `src/lib/storageKeys.ts`
- Create: `src/context/LevelContext.tsx`
- Test: `src/context/LevelContext.test.tsx`

**Interfaces:**
- Produces: `LevelId = 'beginner' | 'intermediate' | 'advanced'`; `LevelProvider({ children })`; `useLevel(): { level: LevelId | null; setLevel: (id: LevelId) => void }`. `STORAGE_KEYS.level === 'ccc:level'`.

- [ ] **Step 1: Add the storage key**

In `src/lib/storageKeys.ts`, add the `level` entry:

```ts
export const STORAGE_KEYS = {
  theme: 'ccc:theme',
  lang: 'ccc:lang',
  progress: 'ccc:progress',
  onboarded: 'ccc:onboarded',
  lastLesson: 'ccc:lastLesson',
  level: 'ccc:level',
} as const
```

- [ ] **Step 2: Write the failing test**

Create `src/context/LevelContext.test.tsx`:

```tsx
import { act, render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { LevelProvider, useLevel } from './LevelContext'

const wrapper = ({ children }: { children: ReactNode }) => <LevelProvider>{children}</LevelProvider>

test('defaults to null when nothing is stored', () => {
  const { result } = renderHook(() => useLevel(), { wrapper })
  expect(result.current.level).toBeNull()
})

test('reads a persisted level from localStorage', () => {
  localStorage.setItem('ccc:level', JSON.stringify('intermediate'))
  const { result } = renderHook(() => useLevel(), { wrapper })
  expect(result.current.level).toBe('intermediate')
})

test('setLevel updates and persists', () => {
  const { result } = renderHook(() => useLevel(), { wrapper })
  act(() => result.current.setLevel('advanced'))
  expect(result.current.level).toBe('advanced')
  expect(JSON.parse(localStorage.getItem('ccc:level')!)).toBe('advanced')
})

test('useLevel throws when used outside a provider', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<BareConsumer />)).toThrow(/LevelProvider/)
  errorSpy.mockRestore()
})

function BareConsumer() {
  useLevel()
  return <div>x</div>
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/context/LevelContext.test.tsx`
Expected: FAIL — cannot resolve `./LevelContext`.

- [ ] **Step 4: Implement LevelContext**

Create `src/context/LevelContext.tsx` (mirrors `LanguageContext.tsx`):

```tsx
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storageKeys'

export type LevelId = 'beginner' | 'intermediate' | 'advanced'

interface LevelContextValue {
  level: LevelId | null
  setLevel: (id: LevelId) => void
}

const LevelContext = createContext<LevelContextValue | null>(null)

export function LevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useLocalStorage<LevelId | null>(STORAGE_KEYS.level, null)
  const value = useMemo<LevelContextValue>(() => ({ level, setLevel }), [level, setLevel])
  return <LevelContext.Provider value={value}>{children}</LevelContext.Provider>
}

export function useLevel(): LevelContextValue {
  const ctx = useContext(LevelContext)
  if (!ctx) throw new Error('useLevel must be used within a LevelProvider')
  return ctx
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/context/LevelContext.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/storageKeys.ts src/context/LevelContext.tsx src/context/LevelContext.test.tsx
git commit -m "feat: add LevelContext and ccc:level storage key"
```

---

## Task 2: Routing core — lessonPath, onboarding state, resolveLandingPath

**Files:**
- Modify: `src/lib/curriculumNav.ts`
- Create: `src/lib/onboarding.ts`
- Create: `src/lib/landing.ts`
- Test: `src/lib/onboarding.test.ts`, `src/lib/landing.test.ts`

**Interfaces:**
- Consumes: `flattenLessons`, `firstLesson`, `LessonLocation` (from `curriculumNav`); `STORAGE_KEYS` (from `storageKeys`); `Level` (from `content/curriculum`).
- Produces:
  - `lessonPath(loc: LessonLocation): string` → `/learn/{levelId}/{moduleId}/{lessonId}`.
  - `isOnboarded(): boolean`, `setOnboarded(): void`, `getLastLesson(): string | null`, `setLastLesson(path: string): void`.
  - `resolveLandingPath(levels: Level[], input: { onboarded: boolean; level: string | null; lastLesson: string | null }): string | null`.

- [ ] **Step 1: Add the failing tests**

Append to `src/lib/curriculumNav.test.ts` (inside the same file, after the existing tests; the `levels` fixture is already defined there):

```ts
import { lessonPath } from './curriculumNav' // add to the existing import line

test('lessonPath builds the /learn route for a location', () => {
  expect(lessonPath(flattenLessons(levels)[0])).toBe('/learn/l1/m1/a')
})
```

Create `src/lib/onboarding.test.ts`:

```ts
import { getLastLesson, isOnboarded, setLastLesson, setOnboarded } from './onboarding'

test('isOnboarded is false when nothing is stored', () => {
  expect(isOnboarded()).toBe(false)
})

test('setOnboarded persists true and isOnboarded reads it', () => {
  setOnboarded()
  expect(isOnboarded()).toBe(true)
  expect(JSON.parse(localStorage.getItem('ccc:onboarded')!)).toBe(true)
})

test('lastLesson round-trips through storage', () => {
  expect(getLastLesson()).toBeNull()
  setLastLesson('/learn/beginner/basics/what-is-cc')
  expect(getLastLesson()).toBe('/learn/beginner/basics/what-is-cc')
})
```

Create `src/lib/landing.test.ts`:

```ts
import type { Level } from '../content/curriculum'
import { resolveLandingPath } from './landing'

const noop = () => Promise.resolve({ default: () => null })
const levels: Level[] = [
  { id: 'beginner', title: 'Beginner', modules: [
    { id: 'basics', title: 'Basics', lessons: [{ id: 'what-is-cc', title: 'W', content: noop }] },
  ] },
  { id: 'intermediate', title: 'Intermediate', modules: [
    { id: 'workflows', title: 'Workflows', lessons: [{ id: 'slash-commands', title: 'S', content: noop }] },
  ] },
]

test('not onboarded → /onboarding', () => {
  expect(resolveLandingPath(levels, { onboarded: false, level: null, lastLesson: null })).toBe('/onboarding')
})

test('onboarded with a lastLesson → that path', () => {
  expect(
    resolveLandingPath(levels, { onboarded: true, level: 'beginner', lastLesson: '/learn/intermediate/workflows/slash-commands' }),
  ).toBe('/learn/intermediate/workflows/slash-commands')
})

test('onboarded, no lastLesson, with level → first lesson of that level', () => {
  expect(resolveLandingPath(levels, { onboarded: true, level: 'intermediate', lastLesson: null })).toBe(
    '/learn/intermediate/workflows/slash-commands',
  )
})

test('onboarded, no lastLesson, no level → global first lesson', () => {
  expect(resolveLandingPath(levels, { onboarded: true, level: null, lastLesson: null })).toBe(
    '/learn/beginner/basics/what-is-cc',
  )
})

test('onboarded but no lessons exist → null', () => {
  expect(resolveLandingPath([], { onboarded: true, level: null, lastLesson: null })).toBeNull()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/onboarding.test.ts src/lib/landing.test.ts src/lib/curriculumNav.test.ts`
Expected: FAIL — `lessonPath`, `./onboarding`, `./landing` unresolved.

- [ ] **Step 3: Implement lessonPath**

In `src/lib/curriculumNav.ts`, add (after `flattenLessons`):

```ts
export function lessonPath(loc: LessonLocation): string {
  return `/learn/${loc.levelId}/${loc.moduleId}/${loc.lesson.id}`
}
```

- [ ] **Step 4: Implement onboarding state accessors**

Create `src/lib/onboarding.ts`:

```ts
import { STORAGE_KEYS } from './storageKeys'

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.onboarded) === JSON.stringify(true)
  } catch {
    return false
  }
}

export function setOnboarded(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.onboarded, JSON.stringify(true))
  } catch {
    /* ignore write failures (e.g. private mode quota) */
  }
}

export function getLastLesson(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.lastLesson)
    return raw === null ? null : (JSON.parse(raw) as string)
  } catch {
    return null
  }
}

export function setLastLesson(path: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.lastLesson, JSON.stringify(path))
  } catch {
    /* ignore write failures */
  }
}
```

- [ ] **Step 5: Implement resolveLandingPath**

Create `src/lib/landing.ts`:

```ts
import type { Level } from '../content/curriculum'
import { firstLesson, flattenLessons, lessonPath } from './curriculumNav'

export interface LandingInput {
  onboarded: boolean
  level: string | null
  lastLesson: string | null
}

export function resolveLandingPath(levels: Level[], input: LandingInput): string | null {
  if (!input.onboarded) return '/onboarding'
  if (input.lastLesson) return input.lastLesson
  if (input.level) {
    const loc = flattenLessons(levels).find((l) => l.levelId === input.level)
    if (loc) return lessonPath(loc)
  }
  const first = firstLesson(levels)
  return first ? lessonPath(first) : null
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- src/lib/onboarding.test.ts src/lib/landing.test.ts src/lib/curriculumNav.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/curriculumNav.ts src/lib/curriculumNav.test.ts src/lib/onboarding.ts src/lib/onboarding.test.ts src/lib/landing.ts src/lib/landing.test.ts
git commit -m "feat: add lessonPath, onboarding state, and resolveLandingPath"
```

---

## Task 3: OnboardingLayout (shell-free canvas + step indicator)

**Files:**
- Create: `src/components/onboarding/OnboardingLayout.tsx`
- Test: `src/components/onboarding/OnboardingLayout.test.tsx`

**Interfaces:**
- Consumes: `cn` (from `lib/cn`), `motion`/`useReducedMotion` (framer-motion).
- Produces: `OnboardingLayout({ step: 1 | 2 | 3, heading: string, children: ReactNode, back?: ReactNode })`. Renders a centered column, a `<h1>` with `heading`, a step indicator with `aria-label="Step {step} of 3"`, and `back` in a footer slot when provided.

- [ ] **Step 1: Write the failing test**

Create `src/components/onboarding/OnboardingLayout.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { OnboardingLayout } from './OnboardingLayout'

test('renders the heading and step indicator', () => {
  render(
    <OnboardingLayout step={2} heading="Pick one">
      <p>body</p>
    </OnboardingLayout>,
  )
  expect(screen.getByRole('heading', { name: 'Pick one' })).toBeInTheDocument()
  expect(screen.getByLabelText('Step 2 of 3')).toBeInTheDocument()
  expect(screen.getByText('body')).toBeInTheDocument()
})

test('renders the back slot only when provided', () => {
  const { rerender } = render(
    <OnboardingLayout step={1} heading="H">
      <p>x</p>
    </OnboardingLayout>,
  )
  expect(screen.queryByText('GO BACK')).not.toBeInTheDocument()

  rerender(
    <OnboardingLayout step={1} heading="H" back={<button>GO BACK</button>}>
      <p>x</p>
    </OnboardingLayout>,
  )
  expect(screen.getByText('GO BACK')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/onboarding/OnboardingLayout.test.tsx`
Expected: FAIL — cannot resolve `./OnboardingLayout`.

- [ ] **Step 3: Implement OnboardingLayout**

Create `src/components/onboarding/OnboardingLayout.tsx`:

```tsx
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

const TOTAL_STEPS = 3

interface OnboardingLayoutProps {
  step: 1 | 2 | 3
  heading: string
  children: ReactNode
  back?: ReactNode
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={cn(
            'h-2 rounded-pill transition-all duration-150',
            n === step ? 'w-8 bg-primary' : 'w-2 bg-muted',
          )}
        />
      ))}
    </div>
  )
}

export function OnboardingLayout({ step, heading, children, back }: OnboardingLayoutProps) {
  const reduce = useReducedMotion()
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex w-full max-w-lg flex-col gap-8"
      >
        <StepIndicator step={step} />
        <h1 className="text-3xl text-foreground">{heading}</h1>
        <div className="flex flex-col gap-4">{children}</div>
        {back && <div className="pt-2">{back}</div>}
      </motion.div>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/onboarding/OnboardingLayout.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/OnboardingLayout.tsx src/components/onboarding/OnboardingLayout.test.tsx
git commit -m "feat: add OnboardingLayout canvas with step indicator"
```

---

## Task 4: LevelScreen (step 1)

**Files:**
- Create: `src/components/onboarding/LevelScreen.tsx`
- Test: `src/components/onboarding/LevelScreen.test.tsx`

**Interfaces:**
- Consumes: `OnboardingLayout`; `useLevel` + `LevelId` (from `LevelContext`); `useNavigate` (react-router); `cn`; `motion`/`useReducedMotion`.
- Produces: `LevelScreen()`. Selecting a level row calls `setLevel(id)` then `navigate('/onboarding/language')`. Each row has a chevron toggle (`aria-expanded`, `aria-label="About the {Label} level"`) that opens exactly one description drawer at a time. No Back button.

- [ ] **Step 1: Write the failing test**

Create `src/components/onboarding/LevelScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LevelProvider } from '../../context/LevelContext'
import { LevelScreen } from './LevelScreen'

function renderScreen() {
  return render(
    <LevelProvider>
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<LevelScreen />} />
          <Route path="/onboarding/language" element={<div>LANGUAGE STEP</div>} />
        </Routes>
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('shows the heading and the three levels', () => {
  renderScreen()
  expect(screen.getByRole('heading', { name: /your claude code level/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Beginner' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Intermediate' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Advanced' })).toBeInTheDocument()
})

test('selecting a level persists it and advances to the language step', async () => {
  const user = userEvent.setup()
  renderScreen()
  await user.click(screen.getByRole('button', { name: 'Beginner' }))
  expect(JSON.parse(localStorage.getItem('ccc:level')!)).toBe('beginner')
  expect(await screen.findByText('LANGUAGE STEP')).toBeInTheDocument()
})

test('the chevron toggle opens one description drawer at a time', async () => {
  const user = userEvent.setup()
  renderScreen()
  const beginnerToggle = screen.getByRole('button', { name: /about the beginner level/i })
  const intermediateToggle = screen.getByRole('button', { name: /about the intermediate level/i })

  expect(beginnerToggle).toHaveAttribute('aria-expanded', 'false')
  await user.click(beginnerToggle)
  expect(beginnerToggle).toHaveAttribute('aria-expanded', 'true')
  expect(await screen.findByText(/from claude chat to claude code/i)).toBeInTheDocument()

  await user.click(intermediateToggle)
  expect(intermediateToggle).toHaveAttribute('aria-expanded', 'true')
  expect(beginnerToggle).toHaveAttribute('aria-expanded', 'false')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/onboarding/LevelScreen.test.tsx`
Expected: FAIL — cannot resolve `./LevelScreen`.

- [ ] **Step 3: Implement LevelScreen**

Create `src/components/onboarding/LevelScreen.tsx`:

```tsx
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLevel, type LevelId } from '../../context/LevelContext'
import { cn } from '../../lib/cn'
import { OnboardingLayout } from './OnboardingLayout'

interface LevelOption {
  id: LevelId
  label: string
  description: string
}

const LEVELS: LevelOption[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description:
      'For moving from Claude chat to Claude Code. Learn what it is, how to install it, basic workflows and commands, and complete your first project with Claude Code.',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description:
      "You've used Claude Code with basic prompts but haven't tapped its full potential. Learn concepts like skills, hooks, and MCP servers — how and when to use them — and complete a project that puts them to work.",
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: "Comfortable with Claude Code day-to-day and ready to become a power user.",
  },
]

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('h-4 w-4 transition-transform duration-150', open && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

export function LevelScreen() {
  const navigate = useNavigate()
  const { setLevel } = useLevel()
  const [openId, setOpenId] = useState<LevelId | null>(null)
  const reduce = useReducedMotion()

  const select = (id: LevelId) => {
    setLevel(id)
    navigate('/onboarding/language')
  }

  return (
    <OnboardingLayout step={1} heading="Your Claude Code Level">
      {LEVELS.map((lvl) => {
        const open = openId === lvl.id
        return (
          <div key={lvl.id} className="rounded-card border-2 border-ink bg-card shadow-hard">
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={() => select(lvl.id)}
                className="flex min-h-[44px] flex-1 cursor-pointer items-center px-5 py-4 text-left font-mono text-lg font-semibold text-card-foreground hover:bg-muted"
              >
                {lvl.label}
              </button>
              <button
                type="button"
                aria-label={`About the ${lvl.label} level`}
                aria-expanded={open}
                aria-controls={`level-desc-${lvl.id}`}
                onClick={() => setOpenId((prev) => (prev === lvl.id ? null : lvl.id))}
                className="flex w-12 shrink-0 cursor-pointer items-center justify-center border-l-2 border-ink text-muted-foreground hover:bg-muted"
              >
                <Chevron open={open} />
              </button>
            </div>
            {open && (
              <motion.div
                id={`level-desc-${lvl.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduce ? 0 : 0.15 }}
                className="border-t-2 border-border"
              >
                <p className="px-5 py-4 text-sm text-muted-foreground">{lvl.description}</p>
              </motion.div>
            )}
          </div>
        )
      })}

      <p className="text-sm text-muted-foreground">
        Every level's lessons are open to everyone — your pick just sets where you start. Finish a
        level and you can move up to the next.
      </p>
    </OnboardingLayout>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/onboarding/LevelScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/LevelScreen.tsx src/components/onboarding/LevelScreen.test.tsx
git commit -m "feat: add LevelScreen with expandable level descriptions"
```

---

## Task 5: LanguageScreen (step 2)

**Files:**
- Create: `src/components/onboarding/LanguageScreen.tsx`
- Test: `src/components/onboarding/LanguageScreen.test.tsx`

**Interfaces:**
- Consumes: `OnboardingLayout`; `LANGUAGES` (from `content/snippets`); `useLanguage` (from `LanguageContext`); `Button` (from `ui/Button`); `useNavigate`.
- Produces: `LanguageScreen()`. Renders one selectable row per `LANGUAGES` entry; selecting calls `setLanguage(id)` then `navigate('/onboarding/intro')`. Includes the "Don't see your programming language?" note and a secondary **Back** button → `/onboarding`.

- [ ] **Step 1: Write the failing test**

Create `src/components/onboarding/LanguageScreen.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import { LanguageScreen } from './LanguageScreen'

function renderScreen() {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/onboarding/language']}>
        <Routes>
          <Route path="/onboarding" element={<div>LEVEL STEP</div>} />
          <Route path="/onboarding/language" element={<LanguageScreen />} />
          <Route path="/onboarding/intro" element={<div>INTRO STEP</div>} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

test('renders one option per language and the fallback note', () => {
  renderScreen()
  expect(screen.getByRole('heading', { name: /preferred programming language/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Python' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'JavaScript' })).toBeInTheDocument()
  expect(screen.getByText(/don't see your programming language/i)).toBeInTheDocument()
})

test('selecting a language persists it and advances to the intro step', async () => {
  const user = userEvent.setup()
  renderScreen()
  await user.click(screen.getByRole('button', { name: 'Python' }))
  expect(JSON.parse(localStorage.getItem('ccc:lang')!)).toBe('python')
  expect(await screen.findByText('INTRO STEP')).toBeInTheDocument()
})

test('Back returns to the level step', async () => {
  const user = userEvent.setup()
  renderScreen()
  await user.click(screen.getByRole('button', { name: /back/i }))
  expect(await screen.findByText('LEVEL STEP')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/onboarding/LanguageScreen.test.tsx`
Expected: FAIL — cannot resolve `./LanguageScreen`.

- [ ] **Step 3: Implement LanguageScreen**

Create `src/components/onboarding/LanguageScreen.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { LANGUAGES } from '../../content/snippets'
import { useLanguage } from '../../context/LanguageContext'
import { Button } from '../ui/Button'
import { OnboardingLayout } from './OnboardingLayout'

export function LanguageScreen() {
  const navigate = useNavigate()
  const { setLanguage } = useLanguage()

  const select = (id: string) => {
    setLanguage(id)
    navigate('/onboarding/intro')
  }

  return (
    <OnboardingLayout
      step={2}
      heading="Preferred Programming Language"
      back={
        <Button variant="secondary" onClick={() => navigate('/onboarding')}>
          Back
        </Button>
      }
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          type="button"
          onClick={() => select(lang.id)}
          className="flex min-h-[44px] cursor-pointer items-center rounded-card border-2 border-ink bg-card px-5 py-4 text-left font-mono text-lg font-semibold text-card-foreground shadow-hard hover:bg-muted"
        >
          {lang.label}
        </button>
      ))}

      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Don't see your programming language?</span>{' '}
        The course is language-independent — the concepts and prompts apply to any language. Your
        selection only flavors the code-snippet examples.
      </p>
    </OnboardingLayout>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/onboarding/LanguageScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/LanguageScreen.tsx src/components/onboarding/LanguageScreen.test.tsx
git commit -m "feat: add LanguageScreen reading the LANGUAGES registry"
```

---

## Task 6: IntroPlaceholder (step 3)

**Files:**
- Create: `src/components/onboarding/IntroPlaceholder.tsx`
- Test: `src/components/onboarding/IntroPlaceholder.test.tsx`

**Interfaces:**
- Consumes: `OnboardingLayout`; `useLevel`; `setOnboarded` (from `lib/onboarding`); `resolveLandingPath` (from `lib/landing`); `curriculum` (from `content/curriculum`); `Button`; `useNavigate`.
- Produces: `IntroPlaceholder()`. **Continue** calls `setOnboarded()` then `navigate(resolveLandingPath(curriculum, { onboarded: true, level, lastLesson: null }) ?? '/', { replace: true })`. Secondary **Back** → `/onboarding/language`.

- [ ] **Step 1: Write the failing test**

Create `src/components/onboarding/IntroPlaceholder.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LevelProvider } from '../../context/LevelContext'
import { IntroPlaceholder } from './IntroPlaceholder'

function renderScreen() {
  return render(
    <LevelProvider>
      <MemoryRouter initialEntries={['/onboarding/intro']}>
        <Routes>
          <Route path="/onboarding/language" element={<div>LANGUAGE STEP</div>} />
          <Route path="/onboarding/intro" element={<IntroPlaceholder />} />
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<div>LESSON PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('Continue marks onboarding complete and enters the app', async () => {
  const user = userEvent.setup()
  localStorage.setItem('ccc:level', JSON.stringify('intermediate'))
  renderScreen()
  await user.click(screen.getByRole('button', { name: /continue/i }))
  expect(JSON.parse(localStorage.getItem('ccc:onboarded')!)).toBe(true)
  expect(await screen.findByText('LESSON PAGE')).toBeInTheDocument()
})

test('Back returns to the language step', async () => {
  const user = userEvent.setup()
  renderScreen()
  await user.click(screen.getByRole('button', { name: /back/i }))
  expect(await screen.findByText('LANGUAGE STEP')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/onboarding/IntroPlaceholder.test.tsx`
Expected: FAIL — cannot resolve `./IntroPlaceholder`.

- [ ] **Step 3: Implement IntroPlaceholder**

Create `src/components/onboarding/IntroPlaceholder.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { useLevel } from '../../context/LevelContext'
import { resolveLandingPath } from '../../lib/landing'
import { setOnboarded } from '../../lib/onboarding'
import { Button } from '../ui/Button'
import { OnboardingLayout } from './OnboardingLayout'

export function IntroPlaceholder() {
  const navigate = useNavigate()
  const { level } = useLevel()

  const handleContinue = () => {
    setOnboarded()
    const path = resolveLandingPath(curriculum, { onboarded: true, level, lastLesson: null }) ?? '/'
    navigate(path, { replace: true })
  }

  return (
    <OnboardingLayout
      step={3}
      heading="You're all set"
      back={
        <Button variant="secondary" onClick={() => navigate('/onboarding/language')}>
          Back
        </Button>
      }
    >
      <p className="text-muted-foreground">
        A full intro to Claude Code is coming soon. For now, jump straight into your first lesson.
      </p>
      <Button onClick={handleContinue}>Continue</Button>
    </OnboardingLayout>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/onboarding/IntroPlaceholder.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/IntroPlaceholder.tsx src/components/onboarding/IntroPlaceholder.test.tsx
git commit -m "feat: add IntroPlaceholder completing onboarding"
```

---

## Task 7: RootRedirect + RequireOnboarded

**Files:**
- Create: `src/components/onboarding/RootRedirect.tsx`
- Create: `src/components/onboarding/RequireOnboarded.tsx`
- Test: `src/components/onboarding/RootRedirect.test.tsx`, `src/components/onboarding/RequireOnboarded.test.tsx`

**Interfaces:**
- Consumes: `resolveLandingPath`; `isOnboarded`, `getLastLesson`; `useLevel`; `curriculum`; `Navigate` (react-router).
- Produces: `RootRedirect()` — renders `<Navigate replace>` to the resolved landing path, or a "No lessons yet." fallback when null. `RequireOnboarded({ children })` — renders children when onboarded, else `<Navigate to="/onboarding" replace>`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/onboarding/RootRedirect.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { LevelProvider } from '../../context/LevelContext'
import { RootRedirect } from './RootRedirect'

function PathProbe() {
  return <div data-testid="path">{useLocation().pathname}</div>
}

function renderRoot() {
  return render(
    <LevelProvider>
      <MemoryRouter initialEntries={['/']}>
        <PathProbe />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/onboarding" element={<div>ONBOARDING</div>} />
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<div>LESSON</div>} />
        </Routes>
      </MemoryRouter>
    </LevelProvider>,
  )
}

test('a fresh visitor is sent to onboarding', () => {
  renderRoot()
  expect(screen.getByTestId('path')).toHaveTextContent('/onboarding')
})

test('an onboarded visitor resumes their last lesson', () => {
  localStorage.setItem('ccc:onboarded', JSON.stringify(true))
  localStorage.setItem('ccc:lastLesson', JSON.stringify('/learn/intermediate/workflows/slash-commands'))
  renderRoot()
  expect(screen.getByTestId('path')).toHaveTextContent('/learn/intermediate/workflows/slash-commands')
})
```

Create `src/components/onboarding/RequireOnboarded.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RequireOnboarded } from './RequireOnboarded'

function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/learn/x']}>
      <Routes>
        <Route path="/onboarding" element={<div>ONBOARDING</div>} />
        <Route
          path="/learn/x"
          element={
            <RequireOnboarded>
              <div>PROTECTED</div>
            </RequireOnboarded>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

test('redirects to onboarding when not onboarded', () => {
  renderGuarded()
  expect(screen.getByText('ONBOARDING')).toBeInTheDocument()
})

test('renders children when onboarded', () => {
  localStorage.setItem('ccc:onboarded', JSON.stringify(true))
  renderGuarded()
  expect(screen.getByText('PROTECTED')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/onboarding/RootRedirect.test.tsx src/components/onboarding/RequireOnboarded.test.tsx`
Expected: FAIL — modules unresolved.

- [ ] **Step 3: Implement RootRedirect**

Create `src/components/onboarding/RootRedirect.tsx`:

```tsx
import { Navigate } from 'react-router-dom'
import { curriculum } from '../../content/curriculum'
import { useLevel } from '../../context/LevelContext'
import { resolveLandingPath } from '../../lib/landing'
import { getLastLesson, isOnboarded } from '../../lib/onboarding'

export function RootRedirect() {
  const { level } = useLevel()
  const path = resolveLandingPath(curriculum, {
    onboarded: isOnboarded(),
    level,
    lastLesson: getLastLesson(),
  })
  if (!path) return <p className="p-8 text-muted-foreground">No lessons yet.</p>
  return <Navigate to={path} replace />
}
```

- [ ] **Step 4: Implement RequireOnboarded**

Create `src/components/onboarding/RequireOnboarded.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isOnboarded } from '../../lib/onboarding'

export function RequireOnboarded({ children }: { children: ReactNode }) {
  if (!isOnboarded()) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/components/onboarding/RootRedirect.test.tsx src/components/onboarding/RequireOnboarded.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding/RootRedirect.tsx src/components/onboarding/RootRedirect.test.tsx src/components/onboarding/RequireOnboarded.tsx src/components/onboarding/RequireOnboarded.test.tsx
git commit -m "feat: add RootRedirect resume logic and RequireOnboarded gate"
```

---

## Task 8: LessonPage writes ccc:lastLesson on visit

**Files:**
- Modify: `src/pages/LessonPage.tsx`
- Test: `src/pages/LessonPage.test.tsx`

**Interfaces:**
- Consumes: `setLastLesson` (from `lib/onboarding`), `lessonPath` (from `lib/curriculumNav`).

- [ ] **Step 1: Write the failing test**

Add to `src/pages/LessonPage.test.tsx` (new test; the `renderAt` helper already exists in this file):

```tsx
test('records the lesson path to ccc:lastLesson on visit', async () => {
  renderAt('/learn/beginner/basics/first-edit')
  await screen.findByRole('heading', { name: /your first edit/i })
  expect(JSON.parse(localStorage.getItem('ccc:lastLesson')!)).toBe('/learn/beginner/basics/first-edit')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/pages/LessonPage.test.tsx`
Expected: FAIL — `ccc:lastLesson` is null.

- [ ] **Step 3: Implement the write**

In `src/pages/LessonPage.tsx`, add imports:

```tsx
import { lessonPath } from '../lib/curriculumNav'
import { setLastLesson } from '../lib/onboarding'
```

(Adjust the existing `curriculumNav` import to also include `lessonPath`: `import { findLesson, lessonPath, nextLesson } from '../lib/curriculumNav'`.)

Update the visit effect:

```tsx
  useEffect(() => {
    if (location) {
      markVisited(location.lesson.id)
      setLastLesson(lessonPath(location))
    }
  }, [location, markVisited])
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/pages/LessonPage.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/LessonPage.tsx src/pages/LessonPage.test.tsx
git commit -m "feat: persist last visited lesson for resume"
```

---

## Task 9: Wire onboarding into App routing

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: all onboarding components + `LevelProvider` + `AppShell` + `LessonPage`.

- [ ] **Step 1: Update App.test for the new entry behavior**

Replace the contents of `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('a fresh visitor lands on the onboarding level screen (no shell)', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /your claude code level/i })).toBeInTheDocument()
  // The app chrome is absent until onboarding completes.
  expect(screen.queryByRole('navigation', { name: /lessons/i })).not.toBeInTheDocument()
})

test('an onboarded visitor sees the app shell and chrome', async () => {
  localStorage.setItem('ccc:onboarded', JSON.stringify(true))
  render(<App />)
  expect(await screen.findByText('Claude Code Craft')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: /language/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL — current `App` renders the shell at `/` (no onboarding heading; the second test's chrome may render but the first test's negative assertion fails).

- [ ] **Step 3: Rewrite App.tsx**

Replace `src/App.tsx` with:

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { IntroPlaceholder } from './components/onboarding/IntroPlaceholder'
import { LanguageScreen } from './components/onboarding/LanguageScreen'
import { LevelScreen } from './components/onboarding/LevelScreen'
import { RequireOnboarded } from './components/onboarding/RequireOnboarded'
import { RootRedirect } from './components/onboarding/RootRedirect'
import { AppShell } from './components/shell/AppShell'
import { LanguageProvider } from './context/LanguageContext'
import { LevelProvider } from './context/LevelContext'
import { ProgressProvider } from './context/ProgressContext'
import { ThemeProvider } from './context/ThemeContext'
import { LessonPage } from './pages/LessonPage'

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LevelProvider>
          <ProgressProvider>
            <BrowserRouter>
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
            </BrowserRouter>
          </ProgressProvider>
        </LevelProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
```

Note: `AppShell` now wraps only the lesson element (previously it wrapped the whole `Routes`), so onboarding screens render shell-free. The inline `RootRedirect`/`firstLesson` imports that used to live here are gone — `RootRedirect` is now its own component.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite + type-check**

Run: `npm test`
Expected: PASS, pristine output (no stray `console.error`).

Run: `npm run build`
Expected: type-check + bundle succeed.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: route first-time visitors through onboarding"
```

---

## Manual verification (after all tasks)

Run `npm run dev` and confirm in the browser (both light and dark):

1. Fresh visitor (clear `localStorage`) at `/` → redirected to the level screen, **no sidebar/topbar**, step indicator on 1.
2. Chevron on a level expands its description; opening another closes the first.
3. Clicking a level → language screen (step 2); the "Don't see your language?" note shows; **Back** returns to levels.
4. Clicking a language → intro placeholder (step 3); **Back** returns to languages.
5. **Continue** → app shell appears with sidebar/topbar at the chosen level's first lesson.
6. Reload → resumes the last lesson (no onboarding). Visiting a different lesson then reloading resumes *that* lesson.
7. Deep-link to `/learn/...` after clearing `localStorage` → redirected to onboarding (gate).
8. `prefers-reduced-motion` on → screens appear without slide/fade animation.

---

## Self-Review Notes

- **Spec coverage:** routing restructure (T9), RootRedirect resume (T2 logic + T7 wiring), gating (T7), LevelContext + `ccc:level` (T1), `onboarded`/`lastLesson` first writes (T2 accessors, T6 Continue, T8 visit), three screens + OnboardingLayout (T3–T6), Back on steps 2–3 (T5/T6), level note about open access + level-up (T4 copy), language note (T5). All spec sections map to a task.
- **Type consistency:** `LevelId` defined in T1, consumed in T4/T7; `resolveLandingPath` signature fixed in T2, consumed in T6/T7; `lessonPath(LessonLocation)` defined in T2, consumed in T2/T8.
- **No placeholders:** every code/test step carries full content.

# App Shell UI Implementation Plan (Phase 3b of 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the visible app shell on top of the Phase 3a plumbing and the merged design system: a collapsible hierarchical sidebar with progress glyphs, a global progress bar, a language switcher, a polished tokenized lesson page with a "Mark complete / Next" flow, and restrained Framer Motion animations.

**Architecture:** Pure client-side SPA. All UI consumes the design system: semantic tokens from `src/styles/index.css` and primitives from `src/components/ui/` (`Button`, `Card`, `Badge`) and `src/components/shell/` (`ProgressGlyph`, `ThemeToggle`). The shell (`AppShell`) wraps the routed lesson content with a persistent header + sidebar derived from `curriculum.ts`. Progress comes from `ProgressContext`; language from `LanguageContext`.

**Tech Stack:** Builds on Phases 1–3a + the design system. New dep: `framer-motion`.

## Global Constraints

- TypeScript strict; no `any` in committed code.
- **Design system is mandatory.** Consume **semantic tokens only** (`bg-background`, `text-foreground`, `bg-card`, `bg-muted`, `text-muted-foreground`, `border-border`, `border-ink`, `bg-primary`, `bg-accent-soft`, `text-accent-foreground`, `text-link`, `bg-success`, …). **Never** raw hex or `--ccc-*` primitives in components. Use the `cn()` helper from `src/lib/cn.ts`.
- Reuse primitives — do not re-implement buttons/cards/badges. `Button`/`Card`/`Badge` from `src/components/ui`; `ProgressGlyph`/`ThemeToggle` from `src/components/shell`. The design rules are in `design-system/MASTER.md`.
- Coral = brand/active; green (`success`) = completed only. **No emoji — inline SVG icons.** Interactive elements: `cursor-pointer` + visible focus (the base layer already gives `:focus-visible` a ring). Touch targets ≥ 44px (`Button` `size="md"`/`"icon"`).
- `prefers-reduced-motion` must be honored for all Framer Motion animations (use `useReducedMotion`).
- `curriculum.ts` stays the single source of truth — the sidebar, progress bar, and next-lesson navigation derive from it.
- localStorage `ccc:` namespace (progress `ccc:progress`, language `ccc:lang`) — already defined in `src/lib/storageKeys.ts`.
- Tests: Vitest globals + RTL + jsdom; TDD; pristine output. Animations are verified by build + manual check, not pixel assertions.
- Note the two `LessonStatus` types: `ProgressContext` exports `'unvisited' | 'visited' | 'completed'`; `ProgressGlyph` uses `'completed' | 'current' | 'unvisited'`. Map between them explicitly (a lesson is `'current'` when it is the active route).

---

### Task 1: Hardening — memoize context values, deps cleanup, test fix

**Files:**
- Modify: `src/context/ThemeContext.tsx`, `src/context/LanguageContext.tsx`, `src/context/ProgressContext.tsx`
- Modify: `package.json` (move `@mdx-js/rollup` to `devDependencies`)
- Modify: `src/pages/LessonPage.test.tsx` (add `ThemeProvider` wrapper)

**Interfaces:**
- Produces: stable callback/value identities from all three context providers (so the upcoming "Mark complete" button and lesson effects don't hinge on incidental render behavior). No public API change.

- [ ] **Step 1: Memoize `ThemeContext` value**

In `src/context/ThemeContext.tsx`, import `useCallback, useMemo`. Replace the inline `value` object:

```tsx
  const toggleTheme = useCallback(
    () => setStoredTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [setStoredTheme],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme: setStoredTheme, toggleTheme }),
    [theme, setStoredTheme, toggleTheme],
  )
```

(`setStoredTheme` from `useLocalStorage` is already a stable `useCallback`.)

- [ ] **Step 2: Memoize `LanguageContext` value**

In `src/context/LanguageContext.tsx`, import `useMemo`:

```tsx
  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage }),
    [language, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
```

- [ ] **Step 3: Memoize `ProgressContext` callbacks + value**

In `src/context/ProgressContext.tsx`, import `useCallback, useMemo`:

```tsx
  const getStatus = useCallback(
    (lessonId: string): LessonStatus => progress[lessonId] ?? 'unvisited',
    [progress],
  )

  const markVisited = useCallback(
    (lessonId: string) =>
      setProgress((prev) => (prev[lessonId] ? prev : { ...prev, [lessonId]: 'visited' })),
    [setProgress],
  )

  const markCompleted = useCallback(
    (lessonId: string) => setProgress((prev) => ({ ...prev, [lessonId]: 'completed' })),
    [setProgress],
  )

  const value = useMemo<ProgressContextValue>(
    () => ({ progress, getStatus, markVisited, markCompleted }),
    [progress, getStatus, markVisited, markCompleted],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
```

- [ ] **Step 4: Move `@mdx-js/rollup` to devDependencies**

```bash
npm install -D @mdx-js/rollup
```

Confirm `package.json` now lists `@mdx-js/rollup` under `devDependencies` only (not `dependencies`). `@mdx-js/react` stays in `dependencies` (runtime).

- [ ] **Step 5: Add `ThemeProvider` to the LessonPage test wrapper**

In `src/pages/LessonPage.test.tsx`, wrap the existing `renderAt` tree with `ThemeProvider` as the outermost provider, matching production:

```tsx
import { ThemeProvider } from '../context/ThemeContext'
// ...
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/learn/:levelId/:moduleId/:lessonId" element={<LessonPage />} />
            </Routes>
          </MemoryRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>,
  )
```

- [ ] **Step 6: Run the full suite + build (this is a behavior-preserving refactor; existing tests are the safety net)**

Run: `npm test`
Expected: all existing tests still pass (70), pristine.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: memoize context values, move mdx-rollup to devDeps, harden lesson test"
```

---

### Task 2: `ProgressBar` (global completion)

**Files:**
- Create: `src/components/shell/ProgressBar.tsx`
- Create: `src/components/shell/ProgressBar.test.tsx`

**Interfaces:**
- Consumes: `useProgress` (progress map), `curriculum`, `lessonIds`/`percentComplete` (`progressMath`).
- Produces: `<ProgressBar className?: string />` — an accessible `role="progressbar"` showing overall % complete.

- [ ] **Step 1: Write the failing test `src/components/shell/ProgressBar.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ProgressProvider } from '../../context/ProgressContext'
import { ProgressBar } from './ProgressBar'

function wrap(ui: ReactNode) {
  return render(<ProgressProvider>{ui}</ProgressProvider>)
}

test('renders an accessible progressbar at 0% when nothing is completed', () => {
  wrap(<ProgressBar />)
  const bar = screen.getByRole('progressbar', { name: /overall progress/i })
  expect(bar).toHaveAttribute('aria-valuenow', '0')
})

test('reflects completed lessons as a percentage', () => {
  // 4 lessons in the stub curriculum; completing 1 → 25%
  localStorage.setItem('ccc:progress', JSON.stringify({ 'what-is-cc': 'completed' }))
  wrap(<ProgressBar />)
  expect(screen.getByRole('progressbar', { name: /overall progress/i })).toHaveAttribute(
    'aria-valuenow',
    '25',
  )
  expect(screen.getByText('25%')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ProgressBar`
Expected: FAIL — cannot find module `./ProgressBar`.

- [ ] **Step 3: Implement `src/components/shell/ProgressBar.tsx`**

```tsx
import { cn } from '../../lib/cn'
import { curriculum } from '../../content/curriculum'
import { useProgress } from '../../context/ProgressContext'
import { lessonIds, percentComplete } from '../../lib/progressMath'

export function ProgressBar({ className }: { className?: string }) {
  const { progress } = useProgress()
  const pct = percentComplete(lessonIds(curriculum), progress)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-label="Overall progress"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-3 w-32 overflow-hidden rounded-pill border-2 border-ink bg-muted"
      >
        <div
          className="h-full rounded-pill bg-accent transition-[width] duration-300 ease-[var(--ease-out-soft)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ProgressBar`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add global ProgressBar"
```

---

### Task 3: `LanguageSwitcher`

**Files:**
- Create: `src/components/shell/LanguageSwitcher.tsx`
- Create: `src/components/shell/LanguageSwitcher.test.tsx`

**Interfaces:**
- Consumes: `useLanguage`, `LANGUAGES` (`src/content/snippets`).
- Produces: `<LanguageSwitcher className?: string />` — a tokenized native `<select>` (role `combobox`) bound to the language registry; persists to `ccc:lang`.

- [ ] **Step 1: Write the failing test `src/components/shell/LanguageSwitcher.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { LanguageProvider } from '../../context/LanguageContext'
import { LanguageSwitcher } from './LanguageSwitcher'

function wrap(ui: ReactNode) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

test('lists the available languages and reflects the active one', () => {
  wrap(<LanguageSwitcher />)
  const select = screen.getByRole('combobox', { name: /language/i }) as HTMLSelectElement
  expect(select.value).toBe('javascript')
  expect(screen.getByRole('option', { name: 'Python' })).toBeInTheDocument()
})

test('switching the language persists to ccc:lang', async () => {
  const user = userEvent.setup()
  wrap(<LanguageSwitcher />)
  await user.selectOptions(screen.getByRole('combobox', { name: /language/i }), 'python')
  expect(JSON.parse(localStorage.getItem('ccc:lang')!)).toBe('python')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- LanguageSwitcher`
Expected: FAIL — cannot find module `./LanguageSwitcher`.

- [ ] **Step 3: Implement `src/components/shell/LanguageSwitcher.tsx`**

```tsx
import { cn } from '../../lib/cn'
import { LANGUAGES } from '../../content/snippets'
import { useLanguage } from '../../context/LanguageContext'

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage()
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <select
        aria-label="Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className={cn(
          'h-9 cursor-pointer appearance-none rounded-control border-2 border-ink bg-card pl-3 pr-8',
          'font-mono text-sm font-medium text-card-foreground shadow-hard-sm',
          'transition-[box-shadow,transform] duration-150 ease-[var(--ease-out-soft)]',
          'hover:-translate-x-px hover:-translate-y-px hover:shadow-hard',
        )}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.label}
          </option>
        ))}
      </select>
      <ChevronIcon />
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- LanguageSwitcher`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add LanguageSwitcher"
```

---

### Task 4: `Sidebar` (hierarchical nav with progress)

**Files:**
- Create: `src/components/shell/Sidebar.tsx`
- Create: `src/components/shell/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `curriculum`, `useProgress` (`getStatus`, `progress`), `levelPercent` (`progressMath`), `ProgressGlyph`, `Badge`, `react-router-dom` `NavLink`.
- Produces: `<Sidebar />` — `<nav aria-label="Lessons">` rendering levels → modules → lessons; each lesson is a `NavLink` with a `ProgressGlyph` (mapping progress + active route → `completed | current | unvisited`); each level header shows a completion `Badge` and toggles its modules.

- [ ] **Step 1: Write the failing test `src/components/shell/Sidebar.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ProgressProvider } from '../../context/ProgressContext'
import { Sidebar } from './Sidebar'

function wrap(ui: ReactNode, path = '/learn/beginner/basics/first-edit') {
  return render(
    <ProgressProvider>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </ProgressProvider>,
  )
}

test('renders the curriculum hierarchy as navigation', () => {
  wrap(<Sidebar />)
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  expect(screen.getByText('Beginner')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /your first edit/i })).toBeInTheDocument()
})

test('marks the active route lesson with the current glyph', () => {
  wrap(<Sidebar />)
  const activeLink = screen.getByRole('link', { name: /your first edit/i })
  expect(activeLink.querySelector('[aria-label="Current lesson"]')).toBeInTheDocument()
})

test('shows the completed glyph for completed lessons', () => {
  localStorage.setItem('ccc:progress', JSON.stringify({ 'what-is-cc': 'completed' }))
  wrap(<Sidebar />)
  const completedLink = screen.getByRole('link', { name: /what is claude code/i })
  expect(completedLink.querySelector('[aria-label="Completed"]')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- Sidebar`
Expected: FAIL — cannot find module `./Sidebar`.

- [ ] **Step 3: Implement `src/components/shell/Sidebar.tsx`**

```tsx
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { curriculum } from '../../content/curriculum'
import { useProgress } from '../../context/ProgressContext'
import { levelPercent } from '../../lib/progressMath'
import { Badge } from '../ui/Badge'
import { ProgressGlyph, type LessonStatus as GlyphStatus } from './ProgressGlyph'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('h-4 w-4 shrink-0 transition-transform duration-150', open && 'rotate-90')}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  )
}

function glyphFor(isActive: boolean, completed: boolean): GlyphStatus {
  if (isActive) return 'current'
  return completed ? 'completed' : 'unvisited'
}

export function Sidebar() {
  const { progress, getStatus } = useProgress()
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(curriculum.map((level) => [level.id, true])),
  )

  return (
    <nav aria-label="Lessons" className="flex flex-col gap-1 p-3">
      {curriculum.map((level) => {
        const pct = levelPercent(level, progress)
        const isOpen = open[level.id]
        return (
          <section key={level.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen((o) => ({ ...o, [level.id]: !o[level.id] }))}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-control px-2 py-2 text-left hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <ChevronIcon open={isOpen} />
                <span className="font-mono text-sm font-semibold">{level.title}</span>
              </span>
              <Badge tone={pct === 100 ? 'success' : 'neutral'}>{pct}%</Badge>
            </button>

            {isOpen && (
              <div className="mb-2 ml-3 border-l-2 border-border pl-2">
                {level.modules.map((mod) => (
                  <div key={mod.id} className="mt-1">
                    <p className="px-2 py-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
                      {mod.title}
                    </p>
                    <ul className="flex flex-col gap-0.5">
                      {mod.lessons.map((lesson) => {
                        const completed = getStatus(lesson.id) === 'completed'
                        return (
                          <li key={lesson.id}>
                            <NavLink
                              to={`/learn/${level.id}/${mod.id}/${lesson.id}`}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center gap-2 rounded-control px-2 py-1.5 text-sm',
                                  isActive
                                    ? 'bg-accent-soft font-medium text-accent-foreground'
                                    : 'text-foreground hover:bg-muted',
                                )
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <ProgressGlyph status={glyphFor(isActive, completed)} />
                                  <span>{lesson.title}</span>
                                </>
                              )}
                            </NavLink>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- Sidebar`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add hierarchical Sidebar with progress glyphs"
```

---

### Task 5: `AppShell` + wire into `App`

**Files:**
- Create: `src/components/shell/AppShell.tsx`
- Create: `src/components/shell/AppShell.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `Sidebar`, `ProgressBar`, `LanguageSwitcher`, `ThemeToggle`, `Button`.
- Produces: `<AppShell>{children}</AppShell>` — persistent header (sidebar toggle + brand on the left; ProgressBar + LanguageSwitcher + ThemeToggle on the right) and a collapsible sidebar beside the scrollable main content. `App` renders `<AppShell>` around its `<Routes>`.

- [ ] **Step 1: Write the failing test `src/components/shell/AppShell.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import { ProgressProvider } from '../../context/ProgressContext'
import { ThemeProvider } from '../../context/ThemeContext'
import { AppShell } from './AppShell'

function wrap() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <MemoryRouter initialEntries={['/learn/beginner/basics/first-edit']}>
            <AppShell>
              <p>lesson body</p>
            </AppShell>
          </MemoryRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>,
  )
}

test('renders brand, chrome controls, sidebar, and children', () => {
  wrap()
  expect(screen.getByText('Claude Code Craft')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: /language/i })).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  expect(screen.getByText('lesson body')).toBeInTheDocument()
})

test('the sidebar toggle hides and shows the nav', async () => {
  const user = userEvent.setup()
  wrap()
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /collapse sidebar/i }))
  expect(screen.queryByRole('navigation', { name: /lessons/i })).not.toBeInTheDocument()
})
```

Note: `ThemeToggle`'s accessible name is "Switch to light/dark theme"; if `/toggle theme/i` does not match the current design-system `ThemeToggle`, assert the present accessible name instead — read `src/components/shell/ThemeToggle.tsx` and match its real `aria-label`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- AppShell`
Expected: FAIL — cannot find module `./AppShell`.

- [ ] **Step 3: Implement `src/components/shell/AppShell.tsx`**

Static collapse (conditional render) here; Framer Motion animation is added in Task 7.

```tsx
import { useState, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ProgressBar } from './ProgressBar'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'

function PanelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-[var(--z-sticky)] flex items-center justify-between gap-4 border-b-2 border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <PanelIcon />
          </Button>
          <span className="font-mono text-lg font-bold">Claude Code Craft</span>
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar className="hidden sm:flex" />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-72 shrink-0 overflow-y-auto border-r-2 border-border bg-card/40 z-[var(--z-sidebar)]">
            <Sidebar />
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- AppShell`
Expected: 2 passed. (If the theme-toggle assertion fails on its accessible name, fix the test to match `ThemeToggle`'s real `aria-label` — do not change the component.)

- [ ] **Step 5: Wire `AppShell` into `src/App.tsx`**

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/shell/AppShell'
import { curriculum } from './content/curriculum'
import { LanguageProvider } from './context/LanguageContext'
import { ProgressProvider } from './context/ProgressContext'
import { ThemeProvider } from './context/ThemeContext'
import { firstLesson } from './lib/curriculumNav'
import { LessonPage } from './pages/LessonPage'

function RootRedirect() {
  const first = firstLesson(curriculum)
  if (!first) return <p className="p-8">No lessons yet.</p>
  return <Navigate to={`/learn/${first.levelId}/${first.moduleId}/${first.lesson.id}`} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <BrowserRouter>
            <AppShell>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/learn/:levelId/:moduleId/:lessonId" element={<LessonPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 6: Update `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the brand header, sidebar, and chrome controls', () => {
  render(<App />)
  expect(screen.getByText('Claude Code Craft')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: /language/i })).toBeInTheDocument()
})
```

- [ ] **Step 7: Run the full suite + build**

Run: `npm test`
Expected: all tests pass, pristine.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add AppShell and wire it into the app"
```

---

### Task 6: `LessonPage` polish — tokenized prose + Mark complete / Next

**Files:**
- Modify: `src/components/mdx/mdxComponents.ts` (add tokenized prose element overrides)
- Modify: `src/pages/LessonPage.tsx` (tokenized layout + completion footer)
- Modify: `src/pages/LessonPage.test.tsx` (add the Mark-complete test)

**Interfaces:**
- Consumes: `useProgress` (`markCompleted`), `nextLesson` (`curriculumNav`), `useNavigate`, `Button`.
- Produces: lesson MDX styled via token-based element overrides; a footer button that marks the lesson completed and navigates to the next lesson.

- [ ] **Step 1: Extend `src/components/mdx/mdxComponents.ts` with tokenized prose elements**

Keep the existing custom components; add element overrides. The code-block element (`<pre>`) is left to the always-dark `Snippet`; only inline `code` is restyled.

```ts
import type { MDXComponents } from 'mdx/types'
import { cn } from '../../lib/cn'
import { Snippet } from './Snippet'
import { TryPrompt } from './TryPrompt'
import { WhenLang } from './WhenLang'

export const mdxComponents = {
  Snippet,
  TryPrompt,
  WhenLang,
  h1: (props) => <h1 className="mt-0 mb-4 font-mono text-3xl font-bold" {...props} />,
  h2: (props) => <h2 className="mt-8 mb-3 font-mono text-2xl font-semibold" {...props} />,
  h3: (props) => <h3 className="mt-6 mb-2 font-mono text-xl font-semibold" {...props} />,
  p: (props) => <p className="my-4 leading-relaxed text-foreground" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-1 pl-6" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-1 pl-6" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => (
    <a className="text-link underline underline-offset-2 hover:text-primary" {...props} />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn('rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em]', className)}
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-4 border-l-4 border-accent bg-muted/50 py-2 pl-4 text-muted-foreground"
      {...props}
    />
  ),
} satisfies MDXComponents
```

- [ ] **Step 2: Update `src/pages/LessonPage.tsx` — tokenized layout + completion footer**

All hooks remain unconditional before the early return.

```tsx
import { MDXProvider } from '@mdx-js/react'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { mdxComponents } from '../components/mdx/mdxComponents'
import { Button } from '../components/ui/Button'
import { curriculum } from '../content/curriculum'
import { useProgress } from '../context/ProgressContext'
import { findLesson, nextLesson } from '../lib/curriculumNav'

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

export function LessonPage() {
  const { levelId, moduleId, lessonId } = useParams()
  const { markCompleted, markVisited } = useProgress()
  const navigate = useNavigate()

  const location = useMemo(
    () =>
      levelId && moduleId && lessonId
        ? findLesson(curriculum, levelId, moduleId, lessonId)
        : undefined,
    [levelId, moduleId, lessonId],
  )

  useEffect(() => {
    if (location) markVisited(location.lesson.id)
  }, [location, markVisited])

  const LessonContent = useMemo(() => (location ? lazy(location.lesson.content) : null), [location])
  const next = useMemo(() => (location ? nextLesson(curriculum, location.lesson.id) : undefined), [location])

  if (!location || !LessonContent) return <Navigate to="/" replace />

  const handleComplete = () => {
    markCompleted(location.lesson.id)
    if (next) navigate(`/learn/${next.levelId}/${next.moduleId}/${next.lesson.id}`)
  }

  return (
    <article className="mx-auto max-w-2xl px-6 py-10">
      <MDXProvider components={mdxComponents}>
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <LessonContent />
        </Suspense>
      </MDXProvider>

      <footer className="mt-12 flex justify-end border-t-2 border-border pt-6">
        <Button onClick={handleComplete} trailingIcon={next ? <ArrowRightIcon /> : undefined}>
          {next ? 'Mark complete & continue' : 'Mark complete'}
        </Button>
      </footer>
    </article>
  )
}
```

- [ ] **Step 3: Add the Mark-complete test to `src/pages/LessonPage.test.tsx`**

Add a route for the next lesson so navigation can be asserted. Append this test (keep the existing two; the wrapper already includes `ThemeProvider` from Task 1):

```tsx
import userEvent from '@testing-library/user-event'

test('Mark complete records completion and advances to the next lesson', async () => {
  const user = userEvent.setup()
  renderAt('/learn/beginner/basics/what-is-cc')
  await screen.findByRole('heading', { name: /what is claude code/i })

  await user.click(screen.getByRole('button', { name: /mark complete/i }))

  expect(JSON.parse(localStorage.getItem('ccc:progress')!)['what-is-cc']).toBe('completed')
  // next lesson in the stub curriculum is "Your First Edit"
  expect(await screen.findByRole('heading', { name: /your first edit/i })).toBeInTheDocument()
})
```

For this test's navigation to resolve, ensure `renderAt`'s `<Routes>` keeps the single param route `"/learn/:levelId/:moduleId/:lessonId"` (it already matches the next lesson path too).

- [ ] **Step 4: Run the LessonPage tests**

Run: `npm test -- LessonPage`
Expected: 3 passed (the original 2 + the new Mark-complete test).

- [ ] **Step 5: Run the full suite + build**

Run: `npm test`
Expected: all pass, pristine.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: tokenized lesson prose and Mark complete / Next flow"
```

---

### Task 7: Framer Motion animations (restrained, reduced-motion aware)

**Files:**
- Modify: `src/components/shell/AppShell.tsx` (animate sidebar collapse)
- Modify: `src/components/shell/Sidebar.tsx` (animate module expand/collapse)
- Modify: `src/pages/LessonPage.tsx` (fade lesson content on navigation)
- Create: `src/components/shell/AppShell.animation.test.tsx` (reduced-motion + still-renders smoke test)

**Interfaces:**
- Consumes: `framer-motion` (`motion`, `AnimatePresence`, `useReducedMotion`).
- Produces: animated sidebar collapse and lesson transitions that fully collapse to instant when `prefers-reduced-motion` is set. No behavior change — the same elements render; only motion is added.

- [ ] **Step 1: Install Framer Motion**

```bash
npm install framer-motion
```

- [ ] **Step 2: Animate the sidebar collapse in `AppShell.tsx`**

Wrap the `<aside>` in `AnimatePresence`; animate width/opacity. Honor reduced motion by snapping durations to 0.

```tsx
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
// ...inside AppShell, after useState:
  const reduce = useReducedMotion()
  const duration = reduce ? 0 : 0.22
// ...replace the {sidebarOpen && <aside>...} block with:
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0 overflow-y-auto overflow-x-hidden border-r-2 border-border bg-card/40 z-[var(--z-sidebar)]"
            >
              <div className="w-72">
                <Sidebar />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
```

(The inner fixed-width `w-72` wrapper keeps the nav from reflowing while the `aside` width animates.)

- [ ] **Step 3: Animate module expand/collapse in `Sidebar.tsx`**

Wrap each level's modules block in `AnimatePresence`/`motion.div` animating `height`/`opacity`, honoring `useReducedMotion`. Replace the `{isOpen && (<div ...>...</div>)}` with:

```tsx
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
// inside Sidebar component body:
  const reduce = useReducedMotion()
// replace the modules block:
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="modules"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mb-2 ml-3 border-l-2 border-border pl-2">
                      {/* existing modules.map(...) content unchanged */}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
```

Keep the inner modules `.map(...)` exactly as in Task 4.

- [ ] **Step 4: Fade lesson content on navigation in `LessonPage.tsx`**

Wrap the `<article>` inner content (or the article) in a `motion.div` keyed by the lesson id so it re-animates on lesson change:

```tsx
import { motion, useReducedMotion } from 'framer-motion'
// inside LessonPage, before return (after hooks):
  const reduce = useReducedMotion()
// wrap the article body:
    <motion.article
      key={location.lesson.id}
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl px-6 py-10"
    >
      {/* existing MDXProvider + footer content unchanged */}
    </motion.article>
```

- [ ] **Step 5: Write `src/components/shell/AppShell.animation.test.tsx`**

Verifies the shell still renders with motion in place and that toggling still hides the nav (motion must not break behavior). `framer-motion` respects jsdom; `AnimatePresence` exit may be async, so assert hide with `findBy`/`waitFor`.

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import { ProgressProvider } from '../../context/ProgressContext'
import { ThemeProvider } from '../../context/ThemeContext'
import { AppShell } from './AppShell'

test('sidebar collapse still works with animation', async () => {
  const user = userEvent.setup()
  render(
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <MemoryRouter initialEntries={['/learn/beginner/basics/first-edit']}>
            <AppShell>
              <p>body</p>
            </AppShell>
          </MemoryRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>,
  )
  expect(screen.getByRole('navigation', { name: /lessons/i })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /collapse sidebar/i }))
  await waitFor(() =>
    expect(screen.queryByRole('navigation', { name: /lessons/i })).not.toBeInTheDocument(),
  )
})
```

- [ ] **Step 6: Run the full suite + build**

Run: `npm test`
Expected: all pass, pristine. (If `AnimatePresence` exit timing makes the AppShell Task-5 hide test flaky, update that assertion to `waitFor` as above.)

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Manual verification (animations are visual)**

Run `npm run dev` and confirm: sidebar collapse/expand animates smoothly; module sections expand/collapse; lesson content fades on navigation; with OS "reduce motion" enabled, transitions are instant. Report what was observed.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add restrained Framer Motion animations (reduced-motion aware)"
```

---

## Self-Review

**Spec coverage (Phase 3b scope, spec §6/§7 + design system):** Collapsible hierarchical sidebar with per-lesson progress glyphs and per-level completion badges (Task 4); global progress bar (Task 2); language switcher reading the registry (Task 3); `AppShell` with the canvas-style collapse and persistent chrome (Task 5); tokenized lesson page with the "Mark complete / Next" progression (Task 6, spec §6 "explicit completion action"); restrained animations honoring reduced motion (Task 7). Context memoization (Task 1) makes the completion action's effects robust. Everything consumes the merged design system (tokens + `Button`/`Card`/`Badge`/`ProgressGlyph`/`ThemeToggle`). Deferred to later phases: onboarding canvas + first-visit/resume routing (Phase 4), interactive charts (Phase 5), skills/CI extras (Phase 6).

**Placeholder scan:** No TBD/TODO; each code step shows complete code (Task 7 shows the exact motion wrappers and notes which existing content is unchanged).

**Type consistency:** The two `LessonStatus` unions are mapped explicitly via `glyphFor` (Task 4) — `ProgressContext`'s `'unvisited'|'visited'|'completed'` → `ProgressGlyph`'s `'completed'|'current'|'unvisited'`. `nextLesson`/`findLesson` signatures (Phase 3a) match their use in `LessonPage` (Task 6). `mdxComponents` stays `satisfies MDXComponents` with the added element overrides (Task 6). `percentComplete(lessonIds(curriculum), progress)` (Task 2) and `levelPercent(level, progress)` (Task 4) match `progressMath` (Phase 3a). `Button`/`Badge`/`ProgressGlyph` props match the design-system primitives read from the codebase.

# Foundation Implementation Plan (Phase 1 of 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a running, tested Vite + React + TypeScript app with Tailwind v4 dark mode and a localStorage-backed theme system, plus the Claude Code project setup files — proving the full stack (Context + localStorage + dark mode + Vitest) end to end.

**Architecture:** Pure client-side SPA. Cross-cutting state lives in React Context and persists to `localStorage` under the `ccc:` namespace. This phase delivers the first such concern — theme — as a vertical slice that later phases (content engine, app shell, onboarding, charts) build on.

**Tech Stack:** Vite, React 18+, TypeScript (strict), Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first config), Vitest + React Testing Library + jsdom.

## Global Constraints

- Language: TypeScript, `strict: true`. No `any` in committed code.
- Tailwind: **v4** — CSS-first config via `@import "tailwindcss"` and `@custom-variant`; **no `tailwind.config.js`** (supersedes spec §3's `tailwind.config.ts` mention).
- Dark mode: class strategy — `dark` class toggled on `<html>` (`document.documentElement`).
- localStorage keys: namespaced `ccc:` (e.g. `ccc:theme`), as defined in spec §6.
- Tests: Vitest with `globals: true`; component tests use React Testing Library; environment `jsdom`.
- No backend, no network calls, no custom MCP.
- Do NOT auto-commit unless the user has said to. (Steps include commit commands; if the user prefers to handle git themselves, skip the commit step and tell them.)

---

### Task 1: Scaffold project, install dependencies, configure Vite + Tailwind

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`, `src/vite-env.d.ts`
- Create dirs (with `.gitkeep`): `src/context/`, `src/components/shell/`, `src/hooks/`, `src/lib/`

**Interfaces:**
- Produces: a runnable app. `npm run dev` serves it; `npm run build` type-checks and bundles; `npm run lint` runs ESLint.

- [ ] **Step 1: Scaffold the Vite React-TS template into the current directory**

The project directory already exists (and contains `docs/`). Scaffold in place:

```bash
npm create vite@latest . -- --template react-ts
```

If prompted that the directory is not empty, choose **"Ignore files and continue"** (it will not touch `docs/`).

- [ ] **Step 2: Install runtime + dev dependencies**

```bash
npm install
npm install tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Replace `vite.config.ts` with Tailwind + Vitest config**

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

- [ ] **Step 4: Replace `src/styles/index.css` with the Tailwind import + dark variant**

Delete the default `src/index.css` and `src/App.css` if present, and create `src/styles/index.css`:

```css
@import "tailwindcss";

/* Class-based dark mode (Tailwind v4 CSS-first). */
@custom-variant dark (&:where(.dark, .dark *));

:root {
  color-scheme: light dark;
}
```

- [ ] **Step 5: Replace `src/main.tsx` to import the new stylesheet path**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: Replace `src/App.tsx` with a minimal styled placeholder**

```tsx
export default function App() {
  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-2xl font-bold">Claude Code Craft</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Foundation is up.</p>
      </div>
    </main>
  )
}
```

- [ ] **Step 7: Create the placeholder directories**

```bash
mkdir -p src/context src/components/shell src/hooks src/lib src/test
touch src/context/.gitkeep src/components/shell/.gitkeep src/hooks/.gitkeep src/lib/.gitkeep
```

- [ ] **Step 8: Add a `lint` script if the template didn't (verify `package.json`)**

Ensure `package.json` `scripts` contains at least:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 9: Verify build and dev server**

Run: `npm run build`
Expected: type-check + bundle succeed, no errors, `dist/` produced.

Run: `npm run dev` (then Ctrl-C)
Expected: dev server starts and prints a local URL with no errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS app with Tailwind v4"
```

---

### Task 2: Configure Vitest + Testing Library, smoke test

**Files:**
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx`
- Modify: `tsconfig.json` (add vitest globals + jest-dom types)

**Interfaces:**
- Consumes: `vite.config.ts` test block from Task 1.
- Produces: `npm test` runs and passes; `setup.ts` registers jest-dom matchers and a `matchMedia` mock used by later tasks.

- [ ] **Step 1: Create `src/test/setup.ts`**

`jsdom` does not implement `matchMedia`; the theme system (Task 4) needs it, so mock it here once.

```ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// jsdom lacks matchMedia; provide a controllable mock (defaults to light).
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
```

- [ ] **Step 2: Add type references to `tsconfig.json`**

In the `compilerOptions.types` array (create it if absent), add:

```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 3: Write the smoke test `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the app title', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /claude code craft/i })).toBeInTheDocument()
})
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: configure Vitest + Testing Library with smoke test"
```

---

### Task 3: `useLocalStorage` hook (TDD)

**Files:**
- Create: `src/hooks/useLocalStorage.ts`
- Create: `src/hooks/useLocalStorage.test.ts`

**Interfaces:**
- Produces:
  `function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void]`
  Reads `key` from localStorage on init (JSON-parsed), falling back to `initialValue` when absent or unparseable. Writing updates both state and localStorage.

- [ ] **Step 1: Write the failing test `src/hooks/useLocalStorage.test.ts`**

```ts
import { act, renderHook } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

test('returns initial value when key is absent', () => {
  const { result } = renderHook(() => useLocalStorage('ccc:test', 'fallback'))
  expect(result.current[0]).toBe('fallback')
})

test('reads an existing value from localStorage', () => {
  localStorage.setItem('ccc:test', JSON.stringify('stored'))
  const { result } = renderHook(() => useLocalStorage('ccc:test', 'fallback'))
  expect(result.current[0]).toBe('stored')
})

test('persists updates to localStorage', () => {
  const { result } = renderHook(() => useLocalStorage('ccc:test', 'a'))
  act(() => result.current[1]('b'))
  expect(result.current[0]).toBe('b')
  expect(JSON.parse(localStorage.getItem('ccc:test')!)).toBe('b')
})

test('supports functional updates', () => {
  const { result } = renderHook(() => useLocalStorage('ccc:count', 1))
  act(() => result.current[1]((prev) => prev + 1))
  expect(result.current[0]).toBe(2)
})

test('falls back to initial value on unparseable data', () => {
  localStorage.setItem('ccc:test', '{not json')
  const { result } = renderHook(() => useLocalStorage('ccc:test', 'safe'))
  expect(result.current[0]).toBe('safe')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- useLocalStorage`
Expected: FAIL — cannot find module `./useLocalStorage`.

- [ ] **Step 3: Implement `src/hooks/useLocalStorage.ts`**

```ts
import { useCallback, useState } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initialValue : (JSON.parse(raw) as T)
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          /* ignore write failures (e.g. private mode quota) */
        }
        return next
      })
    },
    [key],
  )

  return [stored, setValue]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- useLocalStorage`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add useLocalStorage hook"
```

---

### Task 4: Theme storage keys + `ThemeProvider` / `useTheme` (TDD)

**Files:**
- Create: `src/lib/storageKeys.ts`
- Create: `src/context/ThemeContext.tsx`
- Create: `src/context/ThemeContext.test.tsx`

**Interfaces:**
- Consumes: `useLocalStorage` (Task 3).
- Produces:
  - `src/lib/storageKeys.ts`: `export const STORAGE_KEYS = { theme: 'ccc:theme', lang: 'ccc:lang', progress: 'ccc:progress', onboarded: 'ccc:onboarded', lastLesson: 'ccc:lastLesson' } as const`
  - `type Theme = 'light' | 'dark'`
  - `<ThemeProvider>` — applies/removes `dark` class on `document.documentElement`; initial value from `ccc:theme`, else `prefers-color-scheme`.
  - `function useTheme(): { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void }`

- [ ] **Step 1: Create `src/lib/storageKeys.ts`**

```ts
export const STORAGE_KEYS = {
  theme: 'ccc:theme',
  lang: 'ccc:lang',
  progress: 'ccc:progress',
  onboarded: 'ccc:onboarded',
  lastLesson: 'ccc:lastLesson',
} as const
```

- [ ] **Step 2: Write the failing test `src/context/ThemeContext.test.tsx`**

```tsx
import { act, render, renderHook, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

test('defaults to light when nothing stored and prefers-color-scheme is light', () => {
  const { result } = renderHook(() => useTheme(), { wrapper })
  expect(result.current.theme).toBe('light')
  expect(document.documentElement.classList.contains('dark')).toBe(false)
})

test('reads persisted theme from localStorage', () => {
  localStorage.setItem('ccc:theme', JSON.stringify('dark'))
  const { result } = renderHook(() => useTheme(), { wrapper })
  expect(result.current.theme).toBe('dark')
  expect(document.documentElement.classList.contains('dark')).toBe(true)
})

test('toggleTheme flips theme and html class and persists', () => {
  const { result } = renderHook(() => useTheme(), { wrapper })
  act(() => result.current.toggleTheme())
  expect(result.current.theme).toBe('dark')
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  expect(JSON.parse(localStorage.getItem('ccc:theme')!)).toBe('dark')
})

test('useTheme throws when used outside provider', () => {
  expect(() => render(<BareConsumer />)).toThrow(/ThemeProvider/)
})

function BareConsumer() {
  useTheme()
  return <div>x</div>
}

// guard against unused-import lint in this test file
void screen
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- ThemeContext`
Expected: FAIL — cannot find module `./ThemeContext`.

- [ ] **Step 4: Implement `src/context/ThemeContext.tsx`**

```tsx
import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storageKeys'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setStoredTheme] = useLocalStorage<Theme>(STORAGE_KEYS.theme, getSystemTheme())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const value: ThemeContextValue = {
    theme,
    setTheme: setStoredTheme,
    toggleTheme: () => setStoredTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- ThemeContext`
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add theme context with persistence and dark-class sync"
```

---

### Task 5: `ThemeToggle` component + integrate into App (TDD)

**Files:**
- Create: `src/components/shell/ThemeToggle.tsx`
- Create: `src/components/shell/ThemeToggle.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useTheme` (Task 4), `ThemeProvider` (Task 4).
- Produces: `<ThemeToggle />` — a button with accessible name "Toggle theme" that calls `toggleTheme`; `App` wraps its tree in `<ThemeProvider>` and renders `<ThemeToggle />`.

- [ ] **Step 1: Write the failing test `src/components/shell/ThemeToggle.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../../context/ThemeContext'
import { ThemeToggle } from './ThemeToggle'

function setup() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

test('renders an accessible toggle button', () => {
  setup()
  expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
})

test('clicking toggles the dark class on html', async () => {
  const user = userEvent.setup()
  setup()
  expect(document.documentElement.classList.contains('dark')).toBe(false)
  await user.click(screen.getByRole('button', { name: /toggle theme/i }))
  expect(document.documentElement.classList.contains('dark')).toBe(true)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ThemeToggle`
Expected: FAIL — cannot find module `./ThemeToggle`.

- [ ] **Step 3: Implement `src/components/shell/ThemeToggle.tsx`**

```tsx
import { useTheme } from '../../context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium
                 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ThemeToggle`
Expected: 2 passed.

- [ ] **Step 5: Integrate into `src/App.tsx`**

```tsx
import { ThemeProvider } from './context/ThemeContext'
import { ThemeToggle } from './components/shell/ThemeToggle'

export default function App() {
  return (
    <ThemeProvider>
      <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto flex max-w-2xl items-center justify-between p-8">
          <h1 className="text-2xl font-bold">Claude Code Craft</h1>
          <ThemeToggle />
        </div>
      </main>
    </ThemeProvider>
  )
}
```

- [ ] **Step 6: Update `src/App.test.tsx` (App now renders its own provider)**

The smoke test still renders `<App />` directly; no provider wrapper needed since `App` includes `ThemeProvider`. Confirm it still reads:

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the app title and theme toggle', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /claude code craft/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
})
```

- [ ] **Step 7: Run the full suite + build**

Run: `npm test`
Expected: all tests pass.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add theme toggle and wire into app shell"
```

---

### Task 6: Claude Code project setup (`CLAUDE.md`, `.claude/settings.json`)

**Files:**
- Create: `CLAUDE.md`
- Create: `.claude/settings.json`

**Interfaces:**
- Consumes: the conventions established in Tasks 1–5.
- Produces: project memory + a permission allowlist for safe repeated commands.

- [ ] **Step 1: Create `CLAUDE.md`**

```markdown
# Claude Code Craft

Interactive, browser-based platform that teaches Claude Code via Beginner/
Intermediate/Advanced pathways. Pure frontend, no backend.

## Stack
- Vite + React + TypeScript (strict)
- Tailwind CSS v4 (CSS-first config; `@import "tailwindcss"` + `@custom-variant`;
  **no tailwind.config.js**)
- Framer Motion (animations), MDX (lesson content) — added in later phases
- State: React Context + localStorage (`ccc:` namespace)
- Tests: Vitest + React Testing Library (jsdom)

## Conventions
- TypeScript strict; no `any` in committed code.
- Dark mode: `dark` class on `<html>`; never inline-toggle styles.
- All localStorage keys live in `src/lib/storageKeys.ts`, namespaced `ccc:`.
- One responsibility per file; keep files small and focused.

## Load-bearing invariants (later phases)
- `src/content/curriculum.ts` is the single source of truth for sidebar,
  routing, and progress.
- All language-specific content lives in `src/content/snippets/*` (one file per
  language) and resolves with fallback to the default pack (JavaScript).

## Commands
- `npm run dev` — dev server
- `npm run build` — type-check + bundle
- `npm test` — run Vitest once
- `npm run lint` — ESLint

## Spec & plans
- Design: `docs/superpowers/specs/2026-06-27-claude-code-craft-design.md`
- Plans: `docs/superpowers/plans/`
```

- [ ] **Step 2: Create `.claude/settings.json`**

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run dev:*)",
      "Bash(npm run build:*)",
      "Bash(npm run lint:*)",
      "Bash(npm test:*)",
      "Bash(npm install:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ]
  }
}
```

- [ ] **Step 3: Verify settings.json is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add CLAUDE.md and Claude Code permission settings"
```

---

## Self-Review

**Spec coverage (this phase only):** Phase 1 covers spec §3 (stack — Vite/React/TS/Tailwind/Vitest scaffolded), §4's persistence namespace + a Context concern (theme), §6 theme behavior (class strategy, persistence, prefers-color-scheme fallback, `ccc:theme` key) and the storage-keys foundation for §6/§7, and §9 (CLAUDE.md + settings.json). Out of scope by design (later phases): language engine §5, sidebar/progress §6, onboarding/routing §7, charts §8, CI/testing breadth §10, custom skills §9.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every command shows expected output.

**Type consistency:** `Theme` (`'light' | 'dark'`) is used consistently across Tasks 4–5. `STORAGE_KEYS.theme === 'ccc:theme'` matches the key asserted in tests. `useTheme` returns `{ theme, toggleTheme, setTheme }` and `ThemeToggle` uses `theme` + `toggleTheme` — consistent. `useLocalStorage` signature matches its usage in `ThemeContext`.

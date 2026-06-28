# Content & Language Engine Implementation Plan (Phase 2 of 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the language-aware content engine — typed language packs (JavaScript + Python), a snippet/prompt resolver with graceful fallback to the default pack, a `LanguageContext`, and the three MDX-consumable React components (`Snippet`, `TryPrompt`, `WhenLang`).

**Architecture:** Pure client-side. Lesson content (Phase 3) references language-specific values by key; this phase provides the data (one pack file per language), the resolution layer (active language → value, falling back to the default pack and flagging when it does), and the React components lessons will use. Components are plain React and are tested with React Testing Library inside a `LanguageProvider`; MDX file rendering is wired in Phase 3.

**Tech Stack:** React + TypeScript (strict), Vitest + React Testing Library + jsdom, Tailwind v4. Builds on Phase 1 (`useLocalStorage`, `STORAGE_KEYS`, `ThemeContext` pattern).

## Global Constraints

- Language: TypeScript, `strict: true`. No `any` in committed code.
- localStorage: selected language persists under `STORAGE_KEYS.lang` (`'ccc:lang'`), already defined in `src/lib/storageKeys.ts`.
- Default language: `'javascript'` (`DEFAULT_LANGUAGE`). It is the fallback pack for any missing key.
- Adding a language must stay "one file + one registry line": a new `src/content/snippets/<id>.ts` plus a line in `src/content/snippets/index.ts`. No other file should need editing to add a language.
- `LanguageContext` mirrors the existing `ThemeContext` pattern (`src/context/ThemeContext.tsx`): context defaults to `null`, hook throws outside its provider, value persisted via `useLocalStorage`.
- Components are plain React consumed by MDX later — **no MDX tooling (`@mdx-js/rollup`) in this phase.**
- Tailwind v4 classes only; every component must include `dark:` variants for dark mode.
- Tests: Vitest with `globals: true` (so `vi`, `test`, `expect` are global), RTL, jsdom. Every feature is TDD (RED→GREEN). Test output must be pristine — when asserting a thrown render error, silence `console.error` with a `vi.spyOn` for that assertion (see Phase 1's `ThemeContext.test.tsx`).

---

### Task 1: Content types + language packs + registry

**Files:**
- Create: `src/content/types.ts`
- Create: `src/content/snippets/javascript.ts`
- Create: `src/content/snippets/python.ts`
- Create: `src/content/snippets/index.ts`
- Test: `src/content/snippets/index.test.ts`

**Interfaces:**
- Produces:
  - `interface SnippetValue { code: string; filename?: string }`
  - `interface LanguageMeta { id: string; label: string; icon?: string }`
  - `interface LanguagePack { meta: LanguageMeta; snippets: Record<string, SnippetValue>; prompts: Record<string, string>; blocks?: Record<string, string> }`
  - `type LanguageId = string`
  - `LANGUAGE_PACKS: Record<string, LanguagePack>` (keys `'javascript'`, `'python'`)
  - `DEFAULT_LANGUAGE = 'javascript'`
  - `LANGUAGES: LanguageMeta[]`
  - `languageLabel(id: string): string`
  - The two packs ship identical key sets. Snippet keys: `'hello-world'`, `'edit-function'`. Prompt keys: `'first-edit'`, `'refactor'`.

- [ ] **Step 1: Create `src/content/types.ts`**

```ts
export interface SnippetValue {
  code: string
  filename?: string
}

export interface LanguageMeta {
  id: string
  label: string
  icon?: string
}

export interface LanguagePack {
  meta: LanguageMeta
  snippets: Record<string, SnippetValue>
  prompts: Record<string, string>
  /** Optional longer per-key prose overrides; reserved for future components. */
  blocks?: Record<string, string>
}

export type LanguageId = string
```

- [ ] **Step 2: Create `src/content/snippets/javascript.ts` (the default/fallback pack)**

```ts
import type { LanguagePack } from '../types'

const javascript: LanguagePack = {
  meta: { id: 'javascript', label: 'JavaScript', icon: '🟨' },
  snippets: {
    'hello-world': {
      filename: 'hello.js',
      code: `function greet(name) {\n  return \`Hello, \${name}!\`\n}\n\nconsole.log(greet('world'))`,
    },
    'edit-function': {
      filename: 'math.js',
      code: `export function add(a, b) {\n  return a + b\n}`,
    },
  },
  prompts: {
    'first-edit': 'Ask Claude to add an `isEven(n)` helper to math.js and a test for it.',
    refactor: 'Ask Claude to extract the validation logic in handler.js into its own function.',
  },
}

export default javascript
```

- [ ] **Step 3: Create `src/content/snippets/python.ts`**

```ts
import type { LanguagePack } from '../types'

const python: LanguagePack = {
  meta: { id: 'python', label: 'Python', icon: '🐍' },
  snippets: {
    'hello-world': {
      filename: 'hello.py',
      code: `def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\n\nprint(greet("world"))`,
    },
    'edit-function': {
      filename: 'math.py',
      code: `def add(a: int, b: int) -> int:\n    return a + b`,
    },
  },
  prompts: {
    'first-edit': 'Ask Claude to add an `is_even(n)` helper to math.py and a test for it.',
    refactor: 'Ask Claude to extract the validation logic in handler.py into its own function.',
  },
}

export default python
```

- [ ] **Step 4: Create `src/content/snippets/index.ts` (the registry)**

```ts
import type { LanguageMeta, LanguagePack } from '../types'
import javascript from './javascript'
import python from './python'

export const LANGUAGE_PACKS: Record<string, LanguagePack> = {
  javascript,
  python,
}

export const DEFAULT_LANGUAGE = 'javascript'

export const LANGUAGES: LanguageMeta[] = Object.values(LANGUAGE_PACKS).map((p) => p.meta)

export function languageLabel(id: string): string {
  return LANGUAGE_PACKS[id]?.meta.label ?? id
}
```

- [ ] **Step 5: Write the test `src/content/snippets/index.test.ts`**

```ts
import { DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_PACKS, languageLabel } from './index'

test('registry contains javascript and python', () => {
  expect(Object.keys(LANGUAGE_PACKS).sort()).toEqual(['javascript', 'python'])
})

test('default language exists in the registry', () => {
  expect(LANGUAGE_PACKS[DEFAULT_LANGUAGE]).toBeDefined()
})

test('each pack meta.id matches its registry key', () => {
  for (const [key, pack] of Object.entries(LANGUAGE_PACKS)) {
    expect(pack.meta.id).toBe(key)
  }
})

test('the two packs ship identical key sets', () => {
  const js = LANGUAGE_PACKS.javascript
  const py = LANGUAGE_PACKS.python
  expect(Object.keys(py.snippets).sort()).toEqual(Object.keys(js.snippets).sort())
  expect(Object.keys(py.prompts).sort()).toEqual(Object.keys(js.prompts).sort())
})

test('LANGUAGES lists every pack meta', () => {
  expect(LANGUAGES.map((m) => m.id).sort()).toEqual(['javascript', 'python'])
})

test('languageLabel returns the label, or the id when unknown', () => {
  expect(languageLabel('python')).toBe('Python')
  expect(languageLabel('ruby')).toBe('ruby')
})
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- snippets/index`
Expected: 6 passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add language pack types, JS/Python packs, and registry"
```

---

### Task 2: Content resolver + missing-key checker (TDD)

**Files:**
- Create: `src/lib/resolveContent.ts`
- Create: `src/lib/resolveContent.test.ts`
- Create: `src/lib/checkMissingKeys.ts`
- Create: `src/lib/checkMissingKeys.test.ts`

**Interfaces:**
- Consumes: `LANGUAGE_PACKS`, `DEFAULT_LANGUAGE` (Task 1); `LanguagePack`, `SnippetValue`, `LanguageId` (Task 1).
- Produces:
  - `interface Resolved<T> { value: T; lang: LanguageId; fellBack: boolean }`
  - `resolveEntryFrom<T>(packs, defaultId, section, lang, id): Resolved<T> | null` — pure core.
  - `resolveSnippet(lang: LanguageId, id: string): Resolved<SnippetValue> | null` — registry-bound.
  - `resolvePrompt(lang: LanguageId, id: string): Resolved<string> | null` — registry-bound.
  - `interface MissingReport { lang: string; missingSnippets: string[]; missingPrompts: string[] }`
  - `findMissingKeys(packs, defaultId): MissingReport[]`

- [ ] **Step 1: Write the failing test `src/lib/resolveContent.test.ts`**

```ts
import type { LanguagePack } from '../content/types'
import { resolveEntryFrom, resolvePrompt, resolveSnippet } from './resolveContent'

const packs: Record<string, LanguagePack> = {
  en: { meta: { id: 'en', label: 'English' }, snippets: { a: { code: 'A-en' } }, prompts: { p: 'P-en' } },
  fr: { meta: { id: 'fr', label: 'French' }, snippets: { a: { code: 'A-fr' } }, prompts: {} },
}
const snippets = (p: LanguagePack) => p.snippets
const prompts = (p: LanguagePack) => p.prompts

test('returns the active value when present (no fallback)', () => {
  expect(resolveEntryFrom(packs, 'en', snippets, 'fr', 'a')).toEqual({
    value: { code: 'A-fr' }, lang: 'fr', fellBack: false,
  })
})

test('falls back to the default when missing in the active pack', () => {
  expect(resolveEntryFrom(packs, 'en', prompts, 'fr', 'p')).toEqual({
    value: 'P-en', lang: 'en', fellBack: true,
  })
})

test('no fallback flag when the active pack IS the default', () => {
  expect(resolveEntryFrom(packs, 'en', snippets, 'en', 'a')).toEqual({
    value: { code: 'A-en' }, lang: 'en', fellBack: false,
  })
})

test('an unknown language falls back to the default', () => {
  expect(resolveEntryFrom(packs, 'en', snippets, 'ruby', 'a')).toEqual({
    value: { code: 'A-en' }, lang: 'en', fellBack: true,
  })
})

test('returns null when the key is missing everywhere', () => {
  expect(resolveEntryFrom(packs, 'en', snippets, 'fr', 'zzz')).toBeNull()
})

test('registry-bound resolvers read the real packs', () => {
  const s = resolveSnippet('python', 'hello-world')
  expect(s?.value.code).toContain('greet')
  expect(s?.fellBack).toBe(false)
  const p = resolvePrompt('python', 'first-edit')
  expect(p?.value).toContain('is_even')
  expect(p?.fellBack).toBe(false)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- resolveContent`
Expected: FAIL — cannot find module `./resolveContent`.

- [ ] **Step 3: Implement `src/lib/resolveContent.ts`**

```ts
import { DEFAULT_LANGUAGE, LANGUAGE_PACKS } from '../content/snippets'
import type { LanguageId, LanguagePack, SnippetValue } from '../content/types'

export interface Resolved<T> {
  value: T
  lang: LanguageId
  fellBack: boolean
}

export function resolveEntryFrom<T>(
  packs: Record<string, LanguagePack>,
  defaultId: LanguageId,
  section: (pack: LanguagePack) => Record<string, T> | undefined,
  lang: LanguageId,
  id: string,
): Resolved<T> | null {
  const active = packs[lang]
  const fromActive = active ? section(active)?.[id] : undefined
  if (fromActive !== undefined) {
    return { value: fromActive, lang, fellBack: false }
  }
  const fallback = packs[defaultId]
  const fromDefault = fallback ? section(fallback)?.[id] : undefined
  if (fromDefault !== undefined) {
    return { value: fromDefault, lang: defaultId, fellBack: lang !== defaultId }
  }
  return null
}

export function resolveSnippet(lang: LanguageId, id: string): Resolved<SnippetValue> | null {
  return resolveEntryFrom(LANGUAGE_PACKS, DEFAULT_LANGUAGE, (p) => p.snippets, lang, id)
}

export function resolvePrompt(lang: LanguageId, id: string): Resolved<string> | null {
  return resolveEntryFrom(LANGUAGE_PACKS, DEFAULT_LANGUAGE, (p) => p.prompts, lang, id)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- resolveContent`
Expected: 6 passed.

- [ ] **Step 5: Write the failing test `src/lib/checkMissingKeys.test.ts`**

```ts
import { DEFAULT_LANGUAGE, LANGUAGE_PACKS } from '../content/snippets'
import type { LanguagePack } from '../content/types'
import { findMissingKeys } from './checkMissingKeys'

const packs: Record<string, LanguagePack> = {
  base: { meta: { id: 'base', label: 'Base' }, snippets: { a: { code: '' }, b: { code: '' } }, prompts: { x: '' } },
  partial: { meta: { id: 'partial', label: 'Partial' }, snippets: { a: { code: '' } }, prompts: {} },
}

test('reports keys missing from a non-default pack', () => {
  expect(findMissingKeys(packs, 'base')).toEqual([
    { lang: 'partial', missingSnippets: ['b'], missingPrompts: ['x'] },
  ])
})

test('excludes the default pack from the report', () => {
  expect(findMissingKeys(packs, 'base').find((r) => r.lang === 'base')).toBeUndefined()
})

test('the shipped packs are complete (no missing keys)', () => {
  expect(findMissingKeys(LANGUAGE_PACKS, DEFAULT_LANGUAGE)).toEqual([
    { lang: 'python', missingSnippets: [], missingPrompts: [] },
  ])
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test -- checkMissingKeys`
Expected: FAIL — cannot find module `./checkMissingKeys`.

- [ ] **Step 7: Implement `src/lib/checkMissingKeys.ts`**

```ts
import type { LanguagePack } from '../content/types'

export interface MissingReport {
  lang: string
  missingSnippets: string[]
  missingPrompts: string[]
}

export function findMissingKeys(
  packs: Record<string, LanguagePack>,
  defaultId: string,
): MissingReport[] {
  const base = packs[defaultId]
  if (!base) return []
  const snippetKeys = Object.keys(base.snippets)
  const promptKeys = Object.keys(base.prompts)
  return Object.entries(packs)
    .filter(([id]) => id !== defaultId)
    .map(([id, pack]) => ({
      lang: id,
      missingSnippets: snippetKeys.filter((k) => !(k in pack.snippets)),
      missingPrompts: promptKeys.filter((k) => !(k in pack.prompts)),
    }))
}
```

- [ ] **Step 8: Run both lib test files to verify they pass**

Run: `npm test -- resolveContent checkMissingKeys`
Expected: 9 passed total.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add content resolver with fallback and missing-key checker"
```

---

### Task 3: `LanguageContext` / `useLanguage` (TDD)

**Files:**
- Create: `src/context/LanguageContext.tsx`
- Create: `src/context/LanguageContext.test.tsx`

**Interfaces:**
- Consumes: `useLocalStorage` (Phase 1), `STORAGE_KEYS.lang` (Phase 1), `DEFAULT_LANGUAGE` (Task 1), `LanguageId` (Task 1).
- Produces:
  - `<LanguageProvider>` — persists selected language to `ccc:lang`, default `DEFAULT_LANGUAGE`.
  - `useLanguage(): { language: LanguageId; setLanguage: (id: LanguageId) => void }` — throws outside provider.

- [ ] **Step 1: Write the failing test `src/context/LanguageContext.test.tsx`**

```tsx
import { act, render, renderHook } from '@testing-library/react'
import { LanguageProvider, useLanguage } from './LanguageContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
)

test('defaults to javascript when nothing is stored', () => {
  const { result } = renderHook(() => useLanguage(), { wrapper })
  expect(result.current.language).toBe('javascript')
})

test('reads a persisted language from localStorage', () => {
  localStorage.setItem('ccc:lang', JSON.stringify('python'))
  const { result } = renderHook(() => useLanguage(), { wrapper })
  expect(result.current.language).toBe('python')
})

test('setLanguage updates and persists', () => {
  const { result } = renderHook(() => useLanguage(), { wrapper })
  act(() => result.current.setLanguage('python'))
  expect(result.current.language).toBe('python')
  expect(JSON.parse(localStorage.getItem('ccc:lang')!)).toBe('python')
})

test('useLanguage throws when used outside a provider', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<BareConsumer />)).toThrow(/LanguageProvider/)
  errorSpy.mockRestore()
})

function BareConsumer() {
  useLanguage()
  return <div>x</div>
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- LanguageContext`
Expected: FAIL — cannot find module `./LanguageContext`.

- [ ] **Step 3: Implement `src/context/LanguageContext.tsx`**

```tsx
import { createContext, useContext, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storageKeys'
import { DEFAULT_LANGUAGE } from '../content/snippets'
import type { LanguageId } from '../content/types'

interface LanguageContextValue {
  language: LanguageId
  setLanguage: (id: LanguageId) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<LanguageId>(STORAGE_KEYS.lang, DEFAULT_LANGUAGE)
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- LanguageContext`
Expected: 4 passed, output pristine.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add language context with persistence"
```

---

### Task 4: `Snippet` component (TDD)

**Files:**
- Create: `src/components/mdx/Snippet.tsx`
- Create: `src/components/mdx/Snippet.test.tsx`

**Interfaces:**
- Consumes: `useLanguage` (Task 3), `resolveSnippet` (Task 2), `languageLabel` (Task 1).
- Produces: `<Snippet id={string} />` — renders the active language's code block (with optional filename caption); shows a "Example shown in <Label>." note when it fell back; renders a `role="alert"` placeholder when the key is missing everywhere.

- [ ] **Step 1: Write the failing test `src/components/mdx/Snippet.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../../context/LanguageContext'
import { Snippet } from './Snippet'

function renderWithLang(lang: string, ui: React.ReactNode) {
  localStorage.setItem('ccc:lang', JSON.stringify(lang))
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

test('renders the snippet code for the active language', () => {
  const { container } = renderWithLang('python', <Snippet id="hello-world" />)
  expect(container.querySelector('code')).toHaveTextContent('def greet')
})

test('shows a fallback note when the language lacks the key', () => {
  // "ruby" is not in the registry, so it falls back to the default (JavaScript) pack
  renderWithLang('ruby', <Snippet id="hello-world" />)
  expect(screen.getByText(/example shown in javascript/i)).toBeInTheDocument()
})

test('renders an alert for a completely missing snippet', () => {
  renderWithLang('javascript', <Snippet id="does-not-exist" />)
  expect(screen.getByRole('alert')).toHaveTextContent(/missing snippet/i)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- Snippet`
Expected: FAIL — cannot find module `./Snippet`.

- [ ] **Step 3: Implement `src/components/mdx/Snippet.tsx`**

```tsx
import { languageLabel } from '../../content/snippets'
import { useLanguage } from '../../context/LanguageContext'
import { resolveSnippet } from '../../lib/resolveContent'

export function Snippet({ id }: { id: string }) {
  const { language } = useLanguage()
  const result = resolveSnippet(language, id)

  if (!result) {
    return (
      <div
        role="alert"
        className="my-4 rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
      >
        Missing snippet: <code>{id}</code>
      </div>
    )
  }

  const { value, lang, fellBack } = result
  return (
    <figure className="my-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
      {value.filename && (
        <figcaption className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {value.filename}
        </figcaption>
      )}
      <pre className="overflow-x-auto bg-slate-950 p-4 text-sm text-slate-100">
        <code>{value.code}</code>
      </pre>
      {fellBack && (
        <p className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Example shown in {languageLabel(lang)}.
        </p>
      )}
    </figure>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- Snippet`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Snippet component with language fallback"
```

---

### Task 5: `TryPrompt` component (TDD)

**Files:**
- Create: `src/components/mdx/TryPrompt.tsx`
- Create: `src/components/mdx/TryPrompt.test.tsx`

**Interfaces:**
- Consumes: `useLanguage` (Task 3), `resolvePrompt` (Task 2), `languageLabel` (Task 1).
- Produces: `<TryPrompt id={string} />` — a styled "Try this 👉" card showing the active language's prompt; a "Prompt shown for <Label>." note on fallback; a `role="alert"` placeholder when missing.

- [ ] **Step 1: Write the failing test `src/components/mdx/TryPrompt.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../../context/LanguageContext'
import { TryPrompt } from './TryPrompt'

function renderWithLang(lang: string, ui: React.ReactNode) {
  localStorage.setItem('ccc:lang', JSON.stringify(lang))
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

test('renders the prompt text for the active language', () => {
  renderWithLang('python', <TryPrompt id="first-edit" />)
  expect(screen.getByText(/is_even/)).toBeInTheDocument()
})

test('shows a fallback note for an unknown language', () => {
  renderWithLang('ruby', <TryPrompt id="first-edit" />)
  expect(screen.getByText(/prompt shown for javascript/i)).toBeInTheDocument()
})

test('renders an alert for a missing prompt', () => {
  renderWithLang('javascript', <TryPrompt id="nope" />)
  expect(screen.getByRole('alert')).toHaveTextContent(/missing prompt/i)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- TryPrompt`
Expected: FAIL — cannot find module `./TryPrompt`.

- [ ] **Step 3: Implement `src/components/mdx/TryPrompt.tsx`**

```tsx
import { languageLabel } from '../../content/snippets'
import { useLanguage } from '../../context/LanguageContext'
import { resolvePrompt } from '../../lib/resolveContent'

export function TryPrompt({ id }: { id: string }) {
  const { language } = useLanguage()
  const result = resolvePrompt(language, id)

  if (!result) {
    return (
      <div
        role="alert"
        className="my-4 rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
      >
        Missing prompt: <code>{id}</code>
      </div>
    )
  }

  const { value, lang, fellBack } = result
  return (
    <aside className="my-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700/60 dark:bg-amber-950/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Try this 👉
      </p>
      <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{value}</p>
      {fellBack && (
        <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-400/80">
          Prompt shown for {languageLabel(lang)}.
        </p>
      )}
    </aside>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- TryPrompt`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add TryPrompt component with language fallback"
```

---

### Task 6: `WhenLang` component + mdx barrel (TDD)

**Files:**
- Create: `src/components/mdx/WhenLang.tsx`
- Create: `src/components/mdx/WhenLang.test.tsx`
- Create: `src/components/mdx/index.ts`

**Interfaces:**
- Consumes: `useLanguage` (Task 3).
- Produces:
  - `<WhenLang is={string | string[]}>...</WhenLang>` — renders children only when the active language matches `is` (string) or is included in `is` (array); renders nothing otherwise.
  - `src/components/mdx/index.ts` re-exports `Snippet`, `TryPrompt`, `WhenLang` for Phase 3's MDX provider wiring.

- [ ] **Step 1: Write the failing test `src/components/mdx/WhenLang.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../../context/LanguageContext'
import { WhenLang } from './WhenLang'

function renderWithLang(lang: string, ui: React.ReactNode) {
  localStorage.setItem('ccc:lang', JSON.stringify(lang))
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

test('renders children when the language matches', () => {
  renderWithLang('python', <WhenLang is="python">py-only</WhenLang>)
  expect(screen.getByText('py-only')).toBeInTheDocument()
})

test('renders nothing when the language does not match', () => {
  renderWithLang('javascript', <WhenLang is="python">py-only</WhenLang>)
  expect(screen.queryByText('py-only')).not.toBeInTheDocument()
})

test('matches any language listed in an array', () => {
  renderWithLang('go', <WhenLang is={['python', 'go']}>multi</WhenLang>)
  expect(screen.getByText('multi')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- WhenLang`
Expected: FAIL — cannot find module `./WhenLang`.

- [ ] **Step 3: Implement `src/components/mdx/WhenLang.tsx`**

```tsx
import type { ReactNode } from 'react'
import { useLanguage } from '../../context/LanguageContext'

export function WhenLang({ is, children }: { is: string | string[]; children: ReactNode }) {
  const { language } = useLanguage()
  const langs = Array.isArray(is) ? is : [is]
  return langs.includes(language) ? <>{children}</> : null
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- WhenLang`
Expected: 3 passed.

- [ ] **Step 5: Create the barrel `src/components/mdx/index.ts`**

```ts
export { Snippet } from './Snippet'
export { TryPrompt } from './TryPrompt'
export { WhenLang } from './WhenLang'
```

- [ ] **Step 6: Run the full suite + build**

Run: `npm test`
Expected: all tests pass (Phase 1's 12 + Phase 2's additions), output pristine.

Run: `npm run build`
Expected: type-checked build succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add WhenLang component and mdx component barrel"
```

---

## Self-Review

**Spec coverage (Phase 2 scope, spec §5):** Three tiers of language-awareness — shared prose needs no code (handled by MDX authoring in Phase 3); inline values via `Snippet` (Task 4) + `TryPrompt` (Task 5); whole-block conditionals via `WhenLang` (Task 6). One data file per language with `meta`/`snippets`/`prompts`/`blocks` shape (Task 1). Resolver with graceful fallback to the default pack + flag (Task 2) — the spec's key guarantee. Dev-only missing-key check (Task 2, `findMissingKeys`; the `/check-snippets` slash command that surfaces it is Phase 6). `LanguageContext` persisting `ccc:lang` (Task 3). Out of scope by design: MDX tooling + real lessons (Phase 3), curriculum/sidebar/progress (Phase 3), onboarding language picker (Phase 4 — it will read the `LANGUAGES` registry from Task 1).

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every command shows expected output.

**Type consistency:** `LanguagePack`/`SnippetValue`/`LanguageMeta`/`LanguageId` defined in Task 1 and used identically in Tasks 2–6. `Resolved<T>` defined in Task 2 and consumed by Task 4 (`value`/`lang`/`fellBack`) and Task 5. `resolveSnippet`/`resolvePrompt`/`languageLabel`/`DEFAULT_LANGUAGE`/`LANGUAGE_PACKS` names are consistent across producer (Tasks 1–2) and consumers (Tasks 3–6). `STORAGE_KEYS.lang === 'ccc:lang'` (Phase 1) matches the literal asserted in Task 3's test. Snippet/prompt keys (`hello-world`, `edit-function`, `first-edit`, `refactor`) are consistent between the packs (Task 1) and the component tests (Tasks 4–5).

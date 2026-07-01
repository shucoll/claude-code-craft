# Interactive Charts (Card-Flow) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SVG node-graph chart with a responsive HTML **card-flow** renderer — a vertical stack of tone-tinted content cards + connector pills + auto arrows — while keeping the existing click→lesson/popup and lesson Back-button behavior.

**Architecture:** A rows-based `ChartDef` (rows of `ChartCard`s or `connector` pills; each card has a tone + optional target) drives a presentational `<Chart>` that renders `<ChartCardView>`s in a responsive grid with centered arrows between rows. `ChartEmbed` (already wired) resolves card activation to routing or a `ChartPopup`. Chart-scoped tone tokens are added to the design system.

**Tech Stack:** Vite + React + TS (strict), react-router-dom v7, Framer Motion, Tailwind v4 (CSS-first `@theme`), MDX, Vitest + React Testing Library (jsdom).

## Global Constraints

- TypeScript strict; **no `any`**.
- **Semantic tokens only**, plus the new **chart tone palette** (documented, chart-scoped exception). Success-green is **excluded** from the palette (use `teal`); coral stays brand.
- Cards use the chunky style: `border-2 border-ink shadow-hard rounded-card`, tone tint via `bg-chart-<tone>-bg` / `border-chart-<tone>-border` / heading `text-chart-<tone>-text`.
- All animation honors `useReducedMotion()`.
- 2–3-card rows split on `sm+` and **stack to one column on mobile**.
- `curriculum.ts` is the single source of truth; charts add **no** sidebar entries; **no new routes; no new dependencies**.
- Reuse the existing `Popup`, `ChartPopup`, `useBackTarget`, Back button, and Sidebar `state.from` **unchanged**.
- `cn` helper at `src/lib/cn`. Tests render router-dependent components in `MemoryRouter`; MDX needs `LanguageProvider` (+ `ThemeProvider`/`ProgressProvider` for `LessonPage`).
- Commands: `npm test`, `npm run build`, `npm run lint`.

---

### Task 1: Card-flow data model + registry + demo chart

**Files:**
- Modify (rewrite): `src/content/charts/types.ts`
- Create: `src/content/charts/demo.ts`
- Modify: `src/content/charts/index.ts`
- Delete: `src/content/charts/loop.ts`, `src/content/charts/popups/prompt.mdx`
- Modify: `src/content/charts/index.test.ts`

**Interfaces:**
- Produces: `ChartTone`, `ChartCard`, `ChartRow`, `ChartDef` (rows-based), plus unchanged `ChartTarget`/`PopupTarget`/`LessonRef`; `getChart(id): ChartDef | undefined`; `demo: ChartDef` (id `"demo"`).

- [ ] **Step 1: Rewrite the failing registry test**

```ts
// src/content/charts/index.test.ts
import { getChart } from './index'

test('getChart returns the demo chart by id', () => {
  const chart = getChart('demo')
  expect(chart?.id).toBe('demo')
  expect(chart?.rows.length).toBeGreaterThanOrEqual(3)
})

test('getChart returns undefined for an unknown id', () => {
  expect(getChart('nope')).toBeUndefined()
})

test('demo exercises all three card kinds and a connector', () => {
  const rows = getChart('demo')!.rows
  const cards = rows.flatMap((r) => (r.kind === 'cards' ? r.cards : []))
  expect(cards.some((c) => c.target?.kind === 'lesson')).toBe(true)
  expect(cards.some((c) => c.target?.kind === 'popup')).toBe(true)
  expect(cards.some((c) => c.target === undefined)).toBe(true)
  expect(rows.some((r) => r.kind === 'connector')).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/content/charts/index.test.ts`
Expected: FAIL — `rows` does not exist on the old `ChartDef` / `demo` not found.

- [ ] **Step 3: Rewrite the types**

```ts
// src/content/charts/types.ts
import type { ComponentType } from 'react'

/** Reference to an existing curriculum lesson (validated against curriculum.ts). */
export interface LessonRef {
  level: string
  module: string
  lesson: string
}

export type ChartTarget =
  | { kind: 'lesson'; ref: LessonRef }
  | { kind: 'popup'; title?: string; content: () => Promise<{ default: ComponentType }> }

export type PopupTarget = Extract<ChartTarget, { kind: 'popup' }>

export type ChartTone = 'neutral' | 'blue' | 'violet' | 'amber' | 'rose' | 'teal'

export interface ChartCard {
  id: string
  title: string
  /** Muted description lines, e.g. "operator · the turn". */
  lines?: string[]
  /** Defaults to 'neutral'. */
  tone?: ChartTone
  /** Omitted => a plain, non-interactive card. */
  target?: ChartTarget
}

export type ChartRow =
  | { kind: 'cards'; cards: ChartCard[] }
  | { kind: 'connector'; label: string }

export interface ChartDef {
  id: string
  title?: string
  subtitle?: string
  rows: ChartRow[]
}
```

- [ ] **Step 4: Write the demo chart**

```ts
// src/content/charts/demo.ts
import type { ChartDef } from './types'

/**
 * Demo card-flow chart. Exercises all three card kinds (targetless, lesson,
 * popup), a two-card split row, a connector pill, and several tones.
 */
export const demo: ChartDef = {
  id: 'demo',
  title: 'Claude Code: levels',
  subtitle: 'Click a layer to go deeper →',
  rows: [
    {
      kind: 'cards',
      cards: [{ id: 'start', title: 'Start here', lines: ['Pick a path and go deeper'], tone: 'neutral' }],
    },
    {
      kind: 'cards',
      cards: [
        {
          id: 'beginner',
          title: 'Beginner',
          lines: ['operator · the turn', 'approve diffs · /init'],
          tone: 'blue',
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } },
        },
        {
          id: 'bash',
          title: 'Bash',
          lines: ['run shell commands'],
          tone: 'amber',
          target: { kind: 'popup', title: 'Bash', content: () => import('./popups/bash.mdx') },
        },
      ],
    },
    { kind: 'connector', label: 'unlock: configure the agent’s environment' },
    {
      kind: 'cards',
      cards: [{ id: 'advanced', title: 'Advanced', lines: ['orchestrator · the fleet', 'parallel agents · CI'], tone: 'violet' }],
    },
  ],
}
```

- [ ] **Step 5: Update the registry, delete the old SVG demo + unused popup**

```ts
// src/content/charts/index.ts
import { demo } from './demo'
import type { ChartDef } from './types'

const charts: Record<string, ChartDef> = {
  [demo.id]: demo,
}

export function getChart(id: string): ChartDef | undefined {
  return charts[id]
}

export type { ChartDef, ChartCard, ChartRow, ChartTone, ChartTarget, PopupTarget, LessonRef } from './types'
```

Then delete the superseded files:

```bash
git rm src/content/charts/loop.ts src/content/charts/popups/prompt.mdx
```

- [ ] **Step 6: Run tests + build**

Run: `npm test -- src/content/charts/index.test.ts`
Expected: PASS (3 tests).
Run: `npm run build`
Expected: clean (confirms `./popups/bash.mdx` import resolves and no dangling `loop`/`prompt` references).

- [ ] **Step 7: Commit**

```bash
git add src/content/charts
git commit -m "feat: card-flow chart data model, registry, and demo chart"
```

---

### Task 2: Chart tone tokens + ChartCardView

**Files:**
- Modify: `src/styles/index.css` (add tone tokens in the light `:root`, the `.dark` block, and the `@theme inline` map)
- Create: `src/components/charts/ChartCardView.tsx`
- Test: `src/components/charts/ChartCardView.test.tsx`

**Interfaces:**
- Consumes: `ChartCard`, `ChartTone` (Task 1); `cn`; `motion`/`useReducedMotion`.
- Produces: `ChartCardView(props: { card: ChartCard; onActivate: (card: ChartCard) => void }): JSX.Element`
- Produces (CSS): utilities `bg-chart-<tone>-bg`, `border-chart-<tone>-border`, `text-chart-<tone>-text` for each tone.

- [ ] **Step 1: Add the tone tokens to `index.css`**

In the **light** `:root` semantic block, after the `--destructive-foreground` line (~line 84), add:

```css
  /* Chart tone palette — chart-scoped exception (documented). Not for general UI.
     Success-green is intentionally excluded; charts use `teal`. */
  --chart-neutral-bg: #f1f5f9; --chart-neutral-border: #cbd5e1; --chart-neutral-text: #334155;
  --chart-blue-bg:    #dbeafe; --chart-blue-border:    #93c5fd; --chart-blue-text:    #1d4ed8;
  --chart-violet-bg:  #ede9fe; --chart-violet-border:  #c4b5fd; --chart-violet-text:  #6d28d9;
  --chart-amber-bg:   #fef3c7; --chart-amber-border:   #fcd34d; --chart-amber-text:   #b45309;
  --chart-rose-bg:    #ffe4e6; --chart-rose-border:    #fda4af; --chart-rose-text:    #be123c;
  --chart-teal-bg:    #ccfbf1; --chart-teal-border:    #5eead4; --chart-teal-text:    #0f766e;
```

In the **`.dark`** block, after its `--destructive-foreground` line (~line 124), add:

```css
  /* Chart tone palette — dark. Deep muted fills with lighter heading text. */
  --chart-neutral-bg: #1e293b; --chart-neutral-border: #334155; --chart-neutral-text: #e2e8f0;
  --chart-blue-bg:    #172554; --chart-blue-border:    #1e40af; --chart-blue-text:    #93c5fd;
  --chart-violet-bg:  #2e1065; --chart-violet-border:  #5b21b6; --chart-violet-text:  #c4b5fd;
  --chart-amber-bg:   #451a03; --chart-amber-border:   #92400e; --chart-amber-text:   #fcd34d;
  --chart-rose-bg:    #4c0519; --chart-rose-border:    #9f1239; --chart-rose-text:    #fda4af;
  --chart-teal-bg:    #042f2e; --chart-teal-border:    #115e59; --chart-teal-text:    #5eead4;
```

In the **`@theme inline`** map, after `--color-destructive-foreground` (~line 151), add:

```css
  --color-chart-neutral-bg: var(--chart-neutral-bg);
  --color-chart-neutral-border: var(--chart-neutral-border);
  --color-chart-neutral-text: var(--chart-neutral-text);
  --color-chart-blue-bg: var(--chart-blue-bg);
  --color-chart-blue-border: var(--chart-blue-border);
  --color-chart-blue-text: var(--chart-blue-text);
  --color-chart-violet-bg: var(--chart-violet-bg);
  --color-chart-violet-border: var(--chart-violet-border);
  --color-chart-violet-text: var(--chart-violet-text);
  --color-chart-amber-bg: var(--chart-amber-bg);
  --color-chart-amber-border: var(--chart-amber-border);
  --color-chart-amber-text: var(--chart-amber-text);
  --color-chart-rose-bg: var(--chart-rose-bg);
  --color-chart-rose-border: var(--chart-rose-border);
  --color-chart-rose-text: var(--chart-rose-text);
  --color-chart-teal-bg: var(--chart-teal-bg);
  --color-chart-teal-border: var(--chart-teal-border);
  --color-chart-teal-text: var(--chart-teal-text);
```

- [ ] **Step 2: Write the failing test**

```tsx
// src/components/charts/ChartCardView.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChartCardView } from './ChartCardView'
import type { ChartCard } from '../../content/charts/types'

const lessonCard: ChartCard = {
  id: 'c1',
  title: 'Beginner',
  lines: ['operator · the turn'],
  tone: 'blue',
  target: { kind: 'popup', content: () => Promise.resolve({ default: () => null }) },
}
const inertCard: ChartCard = { id: 'c2', title: 'Just a label', tone: 'neutral' }

test('interactive card is a button showing title + lines and fires onActivate on click and keyboard', async () => {
  const user = userEvent.setup()
  const onActivate = vi.fn()
  render(<ChartCardView card={lessonCard} onActivate={onActivate} />)
  const btn = screen.getByRole('button', { name: 'Beginner' })
  expect(screen.getByText('operator · the turn')).toBeInTheDocument()

  await user.click(btn)
  btn.focus()
  await user.keyboard('{Enter}')
  await user.keyboard(' ')
  expect(onActivate).toHaveBeenCalledTimes(3)
  expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' }))
})

test('targetless card is inert and applies its tone surface class', () => {
  render(<ChartCardView card={inertCard} onActivate={() => {}} />)
  expect(screen.queryByRole('button')).toBeNull()
  const el = screen.getByText('Just a label').closest('div')
  expect(el?.className).toContain('bg-chart-neutral-bg')
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/components/charts/ChartCardView.test.tsx`
Expected: FAIL — cannot find module `./ChartCardView`.

- [ ] **Step 4: Implement `ChartCardView`**

```tsx
// src/components/charts/ChartCardView.tsx
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/cn'
import type { ChartCard, ChartTone } from '../../content/charts/types'

const TONE: Record<ChartTone, { surface: string; heading: string }> = {
  neutral: { surface: 'bg-chart-neutral-bg border-chart-neutral-border', heading: 'text-chart-neutral-text' },
  blue: { surface: 'bg-chart-blue-bg border-chart-blue-border', heading: 'text-chart-blue-text' },
  violet: { surface: 'bg-chart-violet-bg border-chart-violet-border', heading: 'text-chart-violet-text' },
  amber: { surface: 'bg-chart-amber-bg border-chart-amber-border', heading: 'text-chart-amber-text' },
  rose: { surface: 'bg-chart-rose-bg border-chart-rose-border', heading: 'text-chart-rose-text' },
  teal: { surface: 'bg-chart-teal-bg border-chart-teal-border', heading: 'text-chart-teal-text' },
}

interface ChartCardViewProps {
  card: ChartCard
  onActivate: (card: ChartCard) => void
}

export function ChartCardView({ card, onActivate }: ChartCardViewProps) {
  const reduce = useReducedMotion()
  const tone = TONE[card.tone ?? 'neutral']
  const interactive = card.target !== undefined

  const body = (
    <>
      <h3 className={cn('font-mono text-lg font-bold', tone.heading)}>{card.title}</h3>
      {card.lines?.map((line, i) => (
        <p key={i} className="mt-1 text-sm text-muted-foreground">
          {line}
        </p>
      ))}
    </>
  )

  const surface = cn('block w-full rounded-card border-2 border-ink p-4 text-left shadow-hard', tone.surface)
  const entrance = {
    initial: reduce ? false : { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: reduce ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] as const },
  }

  if (!interactive) {
    return (
      <motion.div aria-hidden="true" className={surface} {...entrance}>
        {body}
      </motion.div>
    )
  }

  return (
    <motion.button
      type="button"
      aria-label={card.title}
      onClick={() => onActivate(card)}
      className={cn(
        surface,
        'cursor-pointer transition-shadow hover:shadow-hard-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
      whileHover={reduce ? undefined : { x: -1, y: -1 }}
      {...entrance}
    >
      {body}
    </motion.button>
  )
}
```

- [ ] **Step 5: Run test to verify it passes + build**

Run: `npm test -- src/components/charts/ChartCardView.test.tsx`
Expected: PASS (2 tests).
Run: `npm run build`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/styles/index.css src/components/charts/ChartCardView.tsx src/components/charts/ChartCardView.test.tsx
git commit -m "feat: chart tone palette tokens + ChartCardView"
```

---

### Task 3: `<Chart>` card-flow renderer

**Files:**
- Modify (rewrite): `src/components/charts/Chart.tsx`
- Modify (rewrite): `src/components/charts/Chart.test.tsx`

**Interfaces:**
- Consumes: `ChartDef`, `ChartCard` (Task 1); `ChartCardView` (Task 2); `cn`.
- Produces: `Chart(props: { def: ChartDef; onActivate: (card: ChartCard) => void }): JSX.Element`

- [ ] **Step 1: Rewrite the failing test**

```tsx
// src/components/charts/Chart.test.tsx
import { render, screen } from '@testing-library/react'
import { Chart } from './Chart'
import type { ChartDef } from '../../content/charts/types'

const def: ChartDef = {
  id: 't',
  title: 'Demo',
  rows: [
    { kind: 'cards', cards: [{ id: 'a', title: 'Solo' }] },
    { kind: 'cards', cards: [
      { id: 'b', title: 'Left', target: { kind: 'popup', content: () => Promise.resolve({ default: () => null }) } },
      { id: 'c', title: 'Right' },
    ] },
    { kind: 'connector', label: 'unlock: next' },
  ],
}

test('renders the header and every card + connector', () => {
  render(<Chart def={def} onActivate={() => {}} />)
  expect(screen.getByRole('heading', { name: 'Demo' })).toBeInTheDocument()
  expect(screen.getByText('Solo')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Left' })).toBeInTheDocument()
  expect(screen.getByText('Right')).toBeInTheDocument()
  expect(screen.getByText('unlock: next')).toBeInTheDocument()
})

test('a 1-card row is full-width and a 2-card row splits on sm+', () => {
  const { container } = render(<Chart def={def} onActivate={() => {}} />)
  const grids = container.querySelectorAll('[data-testid="chart-cards-row"]')
  expect(grids[0].className).toContain('sm:grid-cols-1')
  expect(grids[1].className).toContain('sm:grid-cols-2')
})

test('renders one arrow between each pair of consecutive rows', () => {
  const { container } = render(<Chart def={def} onActivate={() => {}} />)
  // 3 rows => 2 gaps => 2 arrows
  expect(container.querySelectorAll('[data-testid="chart-arrow"]')).toHaveLength(2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/charts/Chart.test.tsx`
Expected: FAIL — the new assertions don't match the old SVG renderer (no `chart-cards-row`/`chart-arrow`).

- [ ] **Step 3: Rewrite `Chart`**

```tsx
// src/components/charts/Chart.tsx
import { cn } from '../../lib/cn'
import type { ChartCard, ChartDef } from '../../content/charts/types'
import { ChartCardView } from './ChartCardView'

const COLS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
}

function DownArrow() {
  return (
    <div data-testid="chart-arrow" className="flex justify-center py-2" aria-hidden="true">
      <svg viewBox="0 0 16 16" className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v10M4 9l4 4 4-4" />
      </svg>
    </div>
  )
}

interface ChartProps {
  def: ChartDef
  onActivate: (card: ChartCard) => void
}

export function Chart({ def, onActivate }: ChartProps) {
  return (
    <div role="group" aria-label={def.title ?? 'Diagram'} className="w-full max-w-2xl">
      {(def.title || def.subtitle) && (
        <header className="mb-6 text-center">
          {def.title && <h2 className="font-mono text-xl font-bold text-foreground">{def.title}</h2>}
          {def.subtitle && <p className="mt-1 text-sm text-muted-foreground">{def.subtitle}</p>}
        </header>
      )}

      {def.rows.map((row, i) => (
        <div key={i}>
          {i > 0 && <DownArrow />}
          {row.kind === 'connector' ? (
            <div className="flex justify-center">
              <div className="rounded-pill border-2 border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
                {row.label}
              </div>
            </div>
          ) : (
            <div
              data-testid="chart-cards-row"
              className={cn('grid grid-cols-1 gap-4', COLS[row.cards.length] ?? 'sm:grid-cols-1')}
            >
              {row.cards.map((card) => (
                <ChartCardView key={card.id} card={card} onActivate={onActivate} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/charts/Chart.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/Chart.tsx src/components/charts/Chart.test.tsx
git commit -m "feat: HTML card-flow Chart renderer with responsive rows, connectors, arrows"
```

---

### Task 4: Adapt `ChartEmbed`, demo embed, and dependent tests

**Files:**
- Modify: `src/components/charts/ChartEmbed.tsx`
- Modify (rewrite): `src/components/charts/ChartEmbed.test.tsx`
- Modify: `src/content/lessons/advanced/subagents.mdx`
- Modify: `src/pages/LessonPage.test.tsx` (the scroll-anchor test references a chart button name)

**Interfaces:**
- Consumes: `getChart`, `ChartCard`, `PopupTarget` (Task 1); `Chart` (Task 3); `ChartPopup`; `findLesson`/`lessonPath`.
- Produces: `ChartEmbed({ id }: { id: string })` — unchanged behavior; `onActivate` now takes a `ChartCard`.

- [ ] **Step 1: Update `ChartEmbed` to the card model**

Change the type import and the handler signature in `src/components/charts/ChartEmbed.tsx`:

```tsx
import type { ChartCard, PopupTarget } from '../../content/charts/types'
```

```tsx
  function handleActivate(card: ChartCard) {
    const target = card.target
    if (!target) return
    if (target.kind === 'popup') {
      setPopup(target)
      return
    }
    const { level, module, lesson } = target.ref
    const loc = findLesson(curriculum, level, module, lesson)
    if (!loc) return
    navigate(lessonPath(loc), { state: { from: `${pathname}#chart-${id}` } })
  }
```

(Everything else in the file — the `getChart`/null guard, the `<div id={`chart-${id}`}>` anchor, `<Chart>` + `<ChartPopup>` — stays identical.)

- [ ] **Step 2: Rewrite `ChartEmbed.test.tsx` for the demo card model**

```tsx
// src/components/charts/ChartEmbed.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import { ChartEmbed } from './ChartEmbed'

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname}|{JSON.stringify(loc.state)}</div>
}

function renderEmbed(id: string) {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/learn/advanced/power/subagents']}>
        <Routes>
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<><ChartEmbed id={id} /><LocationProbe /></>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

test('renders nothing for an unknown chart id', () => {
  const { container } = renderEmbed('nope')
  expect(container.querySelector('[id^="chart-"]')).toBeNull()
})

test('exposes the scroll anchor id', () => {
  const { container } = renderEmbed('demo')
  expect(container.querySelector('#chart-demo')).not.toBeNull()
})

test('a lesson card navigates with state.from set to the anchor', async () => {
  const user = userEvent.setup()
  renderEmbed('demo')
  await user.click(screen.getByRole('button', { name: 'Beginner' }))
  const loc = screen.getByTestId('loc').textContent ?? ''
  expect(loc).toContain('/learn/beginner/basics/first-edit')
  expect(loc).toContain('/learn/advanced/power/subagents#chart-demo')
})

test('a popup card opens the modal instead of navigating', async () => {
  const user = userEvent.setup()
  renderEmbed('demo')
  await user.click(screen.getByRole('button', { name: 'Bash' }))
  expect(await screen.findByRole('dialog')).toHaveAccessibleName('Bash')
  expect(screen.getByTestId('loc').textContent).toContain('/learn/advanced/power/subagents')
})
```

- [ ] **Step 3: Update the lesson embed id**

In `src/content/lessons/advanced/subagents.mdx`, change the embedded chart section to:

```mdx
## Levels

<ChartEmbed id="demo" />
```

- [ ] **Step 4: Fix the LessonPage scroll-anchor test's card name**

The scroll-restore test in `src/pages/LessonPage.test.tsx` waits for a chart button that used to be named `Edit`. The demo's lesson-target card is now titled **Beginner**. Update that test's `findByRole` to:

```tsx
  expect(await screen.findByRole('button', { name: 'Beginner' })).toBeInTheDocument()
```

(Only that button-name string changes; the rest of the test — the `#chart-...` hash entry and the `scrollSpy` assertion — stays. Note the hash in that test's initial entry must target the demo anchor: ensure it is `/learn/advanced/power/subagents#chart-demo`.)

- [ ] **Step 5: Run focused tests, full suite, and build**

Run: `npm test -- src/components/charts/ChartEmbed.test.tsx src/pages/LessonPage.test.tsx`
Expected: PASS.
Run: `npm test`
Expected: PASS (all files — confirms no other test referenced the old chart).
Run: `npm run build`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/charts/ChartEmbed.tsx src/components/charts/ChartEmbed.test.tsx src/content/lessons/advanced/subagents.mdx src/pages/LessonPage.test.tsx
git commit -m "feat: wire ChartEmbed to card activation; embed demo chart in lesson"
```

---

### Task 5: Authoring guide + CLAUDE.md pointer

**Files:**
- Create: `src/content/charts/README.md`
- Modify: `CLAUDE.md`

**Interfaces:** none (documentation).

- [ ] **Step 1: Write the authoring guide**

Create `src/content/charts/README.md` documenting the **shipped** API. It MUST include, accurately reflecting the final code:
- One-paragraph overview (charts are card-flow stacks embedded in lessons; click a card → lesson or popup).
- The data model: `ChartDef` (`id`, `title?`, `subtitle?`, `rows`), `ChartRow` (`cards` | `connector`), `ChartCard` (`id`, `title`, `lines?`, `tone?`, `target?`), and the `ChartTone` list (`neutral`, `blue`, `violet`, `amber`, `rose`, `teal` — note success-green is intentionally excluded).
- The three target kinds: `{ kind: 'lesson', ref: { level, module, lesson } }` (must match a real `curriculum.ts` lesson), `{ kind: 'popup', title?, content: () => import('./popups/x.mdx') }`, or omit `target` for an inert card.
- Step-by-step "Add a chart": (1) create `src/content/charts/<id>.ts` exporting a `ChartDef`; (2) register it in `src/content/charts/index.ts`; (3) add any popup MDX under `src/content/charts/popups/`; (4) embed in a lesson MDX with `<ChartEmbed id="<id>" />`.
- Layout notes: a `cards` row with 1 card is full-width; 2–3 split and stack on mobile; a `connector` row is a labeled pill; arrows are automatic between rows.
- A copy-paste example (adapt from `demo.ts`).
- A one-line note that genuinely graph-shaped charts (loops, multi-edges, edge labels) are a future React Flow renderer behind the same contract — not supported by this card-flow renderer.

- [ ] **Step 2: Add the CLAUDE.md pointer**

In `CLAUDE.md`, under the "Load-bearing invariants (later phases)" or "Conventions" area, add a short entry:

```markdown
## Adding a chart
Charts are card-flow stacks (`src/content/charts/`), embedded in lessons via
`<ChartEmbed id="…" />`. To add one: define a `ChartDef`, register it in
`index.ts`, and embed it. Full guide: `src/content/charts/README.md`.
```

- [ ] **Step 3: Verify build/lint unaffected**

Run: `npm run build`
Expected: clean (docs-only change; sanity check nothing else broke).

- [ ] **Step 4: Commit**

```bash
git add src/content/charts/README.md CLAUDE.md
git commit -m "docs: chart authoring guide + CLAUDE.md pointer"
```

---

## Self-Review

**Spec coverage:**
- Card-flow data model (rows/cards/tones, kept target model) → Task 1. ✓
- Chart tone palette tokens (documented exception, green excluded) → Task 2. ✓
- `ChartCardView` (tone tint, interactive/inert, chunky) → Task 2. ✓
- `<Chart>` HTML renderer (responsive rows, connector pills, auto arrows, reduced-motion) → Task 3. ✓
- `ChartEmbed` card activation (lesson nav / popup / no-op, anchor) + demo embed → Task 4. ✓
- Reused unchanged: `Popup`/`ChartPopup`/`useBackTarget`/Back/Sidebar — not re-touched (Task 4 only updates a LessonPage **test** string). ✓
- Demo exercises all card kinds + split + connector + tones → Task 1 `demo`. ✓
- Authoring guide + CLAUDE.md pointer → Task 5. ✓
- No new routes/deps; responsive; jsdom-testable → honored throughout. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; Task 5's doc content is enumerated as required sections (a doc, not code). ✓

**Type consistency:** `ChartCard`/`ChartRow`/`ChartTone`/`ChartDef` defined in Task 1 and used identically in Tasks 2–4; `onActivate: (card: ChartCard) => void` consistent between `ChartCardView` (T2), `Chart` (T3), and `ChartEmbed` (T4); tone utility names `bg-chart-<tone>-bg`/`border-chart-<tone>-border`/`text-chart-<tone>-text` match between the `@theme` map (T2 CSS) and `TONE` lookup (T2 component). ✓

**Note for executor:** the tone `@theme` mappings must exist for the `bg-chart-*`/`text-chart-*` utilities to generate; if a card renders unstyled in the browser, re-check Task 2 Step 1's three insertion points. Keep everything tokenized — do not fall back to raw hex in components.

# Guided Decision-Tree Traversal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a learner walk a branching `flow` decision-tree chart one question at a time (guided mode, the default), with the existing static graph available as an "explore" view.

**Architecture:** Three cleanly separated units mirroring the Phase 4 chart split — an opt-in `guided` data flag on the flow row; a **pure** traversal module (`flowTraversal.ts`, no React/DOM/dagre) that derives the root, ordered options, leaf detection, and path summary from the node/edge JSON; and a `GuidedFlow` component that owns guided/explore mode, rendering a focused Q&A stepper in guided mode and delegating to the existing `FlowView` in explore mode. The chart activation path (leaf → `onActivate` → navigate/popup) is reused verbatim.

**Tech Stack:** React + TypeScript (strict), Tailwind v4 (semantic tokens), Framer Motion (via existing `ChartCardView`), Vitest + React Testing Library (jsdom).

## Global Constraints

- TypeScript strict; **no `any`** in committed code.
- **Semantic tokens only** (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-ink`, …) — never raw hex or `--ccc-*`. **No green** (reserved for success/completed); use **teal** for positive/recommendation accents.
- **Additive only** — existing charts and tests must keep passing. A flow row without `guided` still renders as the static `FlowView` (agentic-loop untouched).
- **`curriculum.ts` stays no-diff** — no lesson frontmatter changes. Verify with `git diff --exit-code src/content/curriculum.ts` after `npm run gen:curriculum`.
- **No generator/validator/emitter/`chartIds.ts`/route changes.**
- Honor `prefers-reduced-motion` (inherited via `ChartCardView` / `Button`).
- Commit trailer on every commit: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Single-file test: `npx vitest run <path>`. Full suite: `npm test`. Types+bundle: `npm run build`. Content check: `npm run check-snippets`.

---

### Task 1: Data flag + pure traversal engine

**Files:**
- Modify: `src/content/charts/types.ts` (flow member of `ChartRow`)
- Create: `src/components/charts/flowTraversal.ts`
- Test: `src/components/charts/flowTraversal.test.ts`

**Interfaces:**
- Consumes: `FlowNode`, `FlowEdge` from `src/content/charts/types.ts`.
- Produces (later tasks rely on these exact signatures):
  - `findRoot(nodes: FlowNode[], edges: FlowEdge[]): FlowNode`
  - `optionsAt(nodeId: string, edges: FlowEdge[]): FlowEdge[]`
  - `isLeaf(node: FlowNode, edges: FlowEdge[]): boolean`
  - `pathSummary(steps: FlowEdge[]): string[]`
  - `guided?: boolean` field on the `flow` row.

- [ ] **Step 1: Add the `guided` flag to the flow row type**

In `src/content/charts/types.ts`, change the `flow` member of the `ChartRow` union (currently ends at `direction?: FlowDirection }`):

```ts
  | { kind: 'flow'; nodes: FlowNode[]; edges: FlowEdge[]; direction?: FlowDirection; guided?: boolean }
```

- [ ] **Step 2: Write the failing traversal tests**

Create `src/components/charts/flowTraversal.test.ts`:

```ts
import { findRoot, optionsAt, isLeaf, pathSummary } from './flowTraversal'
import type { FlowNode, FlowEdge } from '../../content/charts/types'

const nodes: FlowNode[] = [
  { id: 'root', title: 'Root', role: 'question' },
  { id: 'mid', title: 'Mid', role: 'question' },
  { id: 'a', title: 'Leaf A', role: 'leaf' },
  { id: 'b', title: 'Leaf B', role: 'leaf' },
]
const edges: FlowEdge[] = [
  { from: 'root', to: 'mid', label: 'deeper' },
  { from: 'root', to: 'b', label: 'shortcut' },
  { from: 'mid', to: 'a', label: 'pick A' },
]

test('findRoot returns the single node with no incoming edges', () => {
  expect(findRoot(nodes, edges).id).toBe('root')
})

test('findRoot falls back to the first node when every node has an incoming edge', () => {
  const cyclic: FlowEdge[] = [
    { from: 'root', to: 'mid' },
    { from: 'mid', to: 'root' },
  ]
  expect(findRoot([nodes[0], nodes[1]], cyclic).id).toBe('root')
})

test('optionsAt returns outgoing edges in authored array order', () => {
  const opts = optionsAt('root', edges)
  expect(opts.map((e) => e.label)).toEqual(['deeper', 'shortcut'])
})

test('isLeaf is true for role leaf and for a node with no outgoing edges', () => {
  expect(isLeaf(nodes[2], edges)).toBe(true) // role leaf
  expect(isLeaf({ id: 'mid', title: 'Mid', role: 'question' }, [])).toBe(true) // no outgoing
})

test('isLeaf is false for a question with outgoing edges', () => {
  expect(isLeaf(nodes[0], edges)).toBe(false)
})

test('pathSummary maps chosen edge labels in order, with a fallback for missing labels', () => {
  expect(pathSummary([edges[0], edges[2]])).toEqual(['deeper', 'pick A'])
  expect(pathSummary([{ from: 'x', to: 'y' }])).toEqual(['…'])
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/components/charts/flowTraversal.test.ts`
Expected: FAIL — cannot resolve `./flowTraversal` (module not found).

- [ ] **Step 4: Implement the pure traversal engine**

Create `src/components/charts/flowTraversal.ts`:

```ts
import type { FlowNode, FlowEdge } from '../../content/charts/types'

/** The entry node: the one that never appears as an edge target. Expected role 'question'. */
export function findRoot(nodes: FlowNode[], edges: FlowEdge[]): FlowNode {
  const targets = new Set(edges.map((e) => e.to))
  return nodes.find((n) => !targets.has(n.id)) ?? nodes[0]
}

/** Outgoing edges of a node, in authored array order (= option order). */
export function optionsAt(nodeId: string, edges: FlowEdge[]): FlowEdge[] {
  return edges.filter((e) => e.from === nodeId)
}

/** A terminus: role 'leaf', or (defensively) a node with no outgoing edges. */
export function isLeaf(node: FlowNode, edges: FlowEdge[]): boolean {
  return node.role === 'leaf' || optionsAt(node.id, edges).length === 0
}

/** The chosen answer labels, in order, for the path-summary strip. */
export function pathSummary(steps: FlowEdge[]): string[] {
  return steps.map((e) => e.label ?? '…')
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/charts/flowTraversal.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Type-check**

Run: `npm run build`
Expected: build succeeds (types clean).

- [ ] **Step 7: Commit**

```bash
git add src/content/charts/types.ts src/components/charts/flowTraversal.ts src/components/charts/flowTraversal.test.ts
git commit -m "feat(charts): guided flow flag + pure decision-tree traversal engine

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `GuidedFlow` component

**Files:**
- Create: `src/components/charts/GuidedFlow.tsx`
- Test: `src/components/charts/GuidedFlow.test.tsx`

**Interfaces:**
- Consumes: `findRoot`, `optionsAt`, `isLeaf`, `pathSummary` (Task 1); `ChartCardView` (`./ChartCardView`), `FlowView` (`./FlowView`), `Button` (`../ui/Button`); types `ChartCard`, `ChartRow`, `FlowEdge`, `FlowNode`.
- Produces: `export function GuidedFlow({ row, onActivate }: { row: Extract<ChartRow, { kind: 'flow' }>; onActivate: (card: ChartCard) => void }): JSX.Element` — consumed by Task 3.

- [ ] **Step 1: Write the failing component tests**

Create `src/components/charts/GuidedFlow.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { GuidedFlow } from './GuidedFlow'
import type { ChartRow } from '../../content/charts/types'

const row: Extract<ChartRow, { kind: 'flow' }> = {
  kind: 'flow',
  guided: true,
  nodes: [
    { id: 'root', title: 'Root question?', role: 'question' },
    { id: 'mid', title: 'Second question?', role: 'question' },
    {
      id: 'a',
      title: 'Answer A',
      role: 'leaf',
      tone: 'teal',
      lines: ['because reasons'],
      target: { kind: 'popup', content: () => Promise.resolve({ default: () => null }) },
    },
    { id: 'b', title: 'Answer B', role: 'leaf' },
  ],
  edges: [
    { from: 'root', to: 'mid', label: 'go deeper' },
    { from: 'root', to: 'b', label: 'shortcut' },
    { from: 'mid', to: 'a', label: 'pick A' },
  ],
}

test('guided mode is the default and shows the root question with its options', () => {
  render(<GuidedFlow row={row} onActivate={() => {}} />)
  expect(screen.getByRole('heading', { name: 'Root question?' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'go deeper' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'shortcut' })).toBeInTheDocument()
})

test('picking an option advances to the next question', () => {
  render(<GuidedFlow row={row} onActivate={() => {}} />)
  screen.getByRole('button', { name: 'go deeper' }).click()
  expect(screen.getByRole('heading', { name: 'Second question?' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'pick A' })).toBeInTheDocument()
})

test('reaching a leaf shows the recommendation, a path summary, and fires activation', () => {
  const onActivate = vi.fn()
  render(<GuidedFlow row={row} onActivate={onActivate} />)
  screen.getByRole('button', { name: 'go deeper' }).click()
  screen.getByRole('button', { name: 'pick A' }).click()
  expect(screen.getByText('because reasons')).toBeInTheDocument()
  expect(screen.getByText(/go deeper → pick A/)).toBeInTheDocument()
  screen.getByRole('button', { name: 'Answer A' }).click()
  expect(onActivate).toHaveBeenCalledTimes(1)
  expect(onActivate.mock.calls[0][0]).toMatchObject({ id: 'a', title: 'Answer A' })
})

test('Start over returns to the root question', () => {
  render(<GuidedFlow row={row} onActivate={() => {}} />)
  screen.getByRole('button', { name: 'shortcut' }).click() // root -> leaf b
  expect(screen.getByRole('button', { name: 'Start over' })).toBeInTheDocument()
  screen.getByRole('button', { name: 'Start over' }).click()
  expect(screen.getByRole('heading', { name: 'Root question?' })).toBeInTheDocument()
})

test('toggling to Explore renders the FlowView graph (its edge summary)', async () => {
  render(<GuidedFlow row={row} onActivate={() => {}} />)
  screen.getByRole('button', { name: 'Explore' }).click()
  expect(await screen.findByText('Root question? → Second question? (go deeper)')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/charts/GuidedFlow.test.tsx`
Expected: FAIL — cannot resolve `./GuidedFlow`.

- [ ] **Step 3: Implement `GuidedFlow`**

Create `src/components/charts/GuidedFlow.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import type { ChartCard, ChartRow, FlowEdge, FlowNode } from '../../content/charts/types'
import { ChartCardView } from './ChartCardView'
import { FlowView } from './FlowView'
import { Button } from '../ui/Button'
import { findRoot, isLeaf, optionsAt, pathSummary } from './flowTraversal'

type FlowRow = Extract<ChartRow, { kind: 'flow' }>

interface GuidedFlowProps {
  row: FlowRow
  onActivate: (card: ChartCard) => void
}

function nodeToCard(node: FlowNode): ChartCard {
  return { id: node.id, title: node.title, lines: node.lines, tone: node.tone, target: node.target }
}

export function GuidedFlow({ row, onActivate }: GuidedFlowProps) {
  const root = findRoot(row.nodes, row.edges)
  const [mode, setMode] = useState<'guided' | 'explore'>('guided')
  const [currentId, setCurrentId] = useState(root.id)
  const [steps, setSteps] = useState<FlowEdge[]>([])

  // Restart traversal when the chart data changes (set-state-during-render, not a mount effect).
  const [prevRow, setPrevRow] = useState(row)
  if (row !== prevRow) {
    setPrevRow(row)
    setMode('guided')
    setCurrentId(root.id)
    setSteps([])
  }

  // Move focus to the question heading after the learner advances (never on initial mount,
  // so an embedded diagram doesn't steal focus while scrolling past it).
  const headingRef = useRef<HTMLHeadingElement>(null)
  const advancedRef = useRef(false)
  useEffect(() => {
    if (advancedRef.current) {
      headingRef.current?.focus()
      advancedRef.current = false
    }
  }, [currentId])

  const byId = new Map(row.nodes.map((n) => [n.id, n]))
  const current = byId.get(currentId) ?? root

  const pick = (edge: FlowEdge) => {
    advancedRef.current = true
    setSteps((s) => [...s, edge])
    setCurrentId(edge.to)
  }

  const restart = () => {
    advancedRef.current = true
    setCurrentId(root.id)
    setSteps([])
  }

  return (
    <div role="group" aria-label="Decision tree" className="w-full">
      <div className="mb-4 flex justify-center gap-2">
        <Button
          size="sm"
          variant={mode === 'guided' ? 'primary' : 'ghost'}
          aria-pressed={mode === 'guided'}
          onClick={() => setMode('guided')}
        >
          Guided
        </Button>
        <Button
          size="sm"
          variant={mode === 'explore' ? 'primary' : 'ghost'}
          aria-pressed={mode === 'explore'}
          onClick={() => setMode('explore')}
        >
          Explore
        </Button>
      </div>

      {mode === 'explore' ? (
        <FlowView row={row} onActivate={onActivate} />
      ) : isLeaf(current, row.edges) ? (
        <div className="mx-auto max-w-md space-y-4">
          <ChartCardView card={nodeToCard(current)} onActivate={onActivate} />
          {steps.length > 0 && (
            <p className="text-sm text-muted-foreground">
              You said: {pathSummary(steps).join(' → ')} →{' '}
              <span className="font-bold text-foreground">{current.title}</span>
            </p>
          )}
          <Button size="sm" variant="secondary" onClick={restart}>
            Start over
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-md space-y-4">
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="text-center font-mono text-lg font-bold text-foreground focus:outline-none"
          >
            {current.title}
          </h3>
          <div className="flex flex-col gap-3">
            {optionsAt(current.id, row.edges).map((edge, i) => (
              <Button key={i} variant="secondary" onClick={() => pick(edge)}>
                {edge.label ?? 'Continue'}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/charts/GuidedFlow.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Type-check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/charts/GuidedFlow.tsx src/components/charts/GuidedFlow.test.tsx
git commit -m "feat(charts): GuidedFlow — guided/explore decision-tree stepper

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Wire guided flow rows into `Chart`

**Files:**
- Modify: `src/components/charts/Chart.tsx`
- Test: `src/components/charts/Chart.test.tsx` (add one test)

**Interfaces:**
- Consumes: `GuidedFlow` (Task 2).
- Produces: `Chart` routes a `flow` row to `GuidedFlow` when `row.guided`, else `FlowView`.

- [ ] **Step 1: Add the failing wiring test**

Append to `src/components/charts/Chart.test.tsx` (the `render`, `screen`, `Chart`, and `ChartDef` imports already exist at the top of the file):

```tsx
test('renders a guided flow row as a GuidedFlow (mode toggle present)', () => {
  const guidedDef: ChartDef = {
    id: 'g',
    rows: [
      {
        kind: 'flow',
        guided: true,
        nodes: [
          { id: 'q', title: 'Pick one', role: 'question' },
          { id: 'l', title: 'A leaf', role: 'leaf' },
        ],
        edges: [{ from: 'q', to: 'l', label: 'only option' }],
      },
    ],
  }
  render(<Chart def={guidedDef} onActivate={() => {}} />)
  expect(screen.getByRole('button', { name: 'Guided' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Explore' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Pick one' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/charts/Chart.test.tsx`
Expected: FAIL — no "Guided" button (a plain `FlowView` renders, showing "Loading diagram…").

- [ ] **Step 3: Wire `GuidedFlow` into the flow branch**

In `src/components/charts/Chart.tsx`, add the import after the `FlowView` import (line 4):

```tsx
import { GuidedFlow } from './GuidedFlow'
```

Then replace the flow branch (currently `) : row.kind === 'flow' ? (` … `<FlowView row={row} onActivate={onActivate} />` … `) : (`) with:

```tsx
          ) : row.kind === 'flow' ? (
            row.guided ? (
              <GuidedFlow row={row} onActivate={onActivate} />
            ) : (
              <FlowView row={row} onActivate={onActivate} />
            )
          ) : (
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/charts/Chart.test.tsx`
Expected: PASS (all tests, including the existing non-guided flow test which still renders `FlowView`).

- [ ] **Step 5: Commit**

```bash
git add src/components/charts/Chart.tsx src/components/charts/Chart.test.tsx
git commit -m "feat(charts): route guided flow rows to GuidedFlow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Dogfood — turn the resolver tree guided and two levels deep

**Files:**
- Modify: `src/content/charts/clear-compact-new-tree.ts`
- Test: `src/content/charts/index.test.ts` (add one assertion)

**Interfaces:**
- Consumes: the `guided` flag (Task 1) and `GuidedFlow` wiring (Task 3).
- Produces: the `clear-compact-new-tree` chart now traverses guided, two levels deep. Already embedded inline in the *review-changes* beginner lesson — no lesson change needed.

- [ ] **Step 1: Rewrite the dogfood tree (guided + two levels)**

Replace the `rows` array in `src/content/charts/clear-compact-new-tree.ts` with a two-level, `guided` tree (keep the file's leading comment; update it to say "guided"):

```ts
  rows: [
    {
      kind: 'flow',
      direction: 'TB',
      guided: true,
      nodes: [
        { id: 'q1', title: 'Are you mid-task?', role: 'question' },
        { id: 'q2', title: 'How is the context holding up?', role: 'question' },
        {
          id: 'compact',
          title: '/compact',
          role: 'leaf',
          tone: 'violet',
          lines: ['Summarize, keep decisions'],
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'review-changes' } },
        },
        {
          id: 'clear',
          title: '/clear',
          role: 'leaf',
          tone: 'blue',
          lines: ['Wipe context, keep the session'],
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } },
        },
        {
          id: 'new',
          title: 'Start a new session',
          role: 'leaf',
          tone: 'amber',
          lines: ['Fresh context window'],
          target: { kind: 'popup', title: 'Start new', content: () => import('./popups/start-new.mdx') },
        },
      ],
      edges: [
        { from: 'q1', to: 'q2', label: 'yes, still going' },
        { from: 'q1', to: 'new', label: 'no, something broke' },
        { from: 'q2', to: 'compact', label: 'just getting long' },
        { from: 'q2', to: 'clear', label: 'no longer relevant' },
      ],
    },
  ],
```

- [ ] **Step 2: Add a `guided` assertion to the registry shape test**

Append to `src/content/charts/index.test.ts`:

```ts
test('the decision tree opts into guided traversal with a single root question', () => {
  const flow = getChart('clear-compact-new-tree')!.rows.find((r) => r.kind === 'flow')!
  if (flow.kind !== 'flow') throw new Error('expected flow row')
  expect(flow.guided).toBe(true)
  const targets = new Set(flow.edges.map((e) => e.to))
  const roots = flow.nodes.filter((n) => !targets.has(n.id))
  expect(roots).toHaveLength(1)
  expect(roots[0].role).toBe('question')
})
```

- [ ] **Step 3: Run the chart content tests**

Run: `npx vitest run src/content/charts/index.test.ts`
Expected: PASS — including the existing "labeled edges / lesson link / popup leaf" test (all four edges are labeled; `compact`/`clear` are lesson targets; `new` is a popup) and the new guided-root assertion.

- [ ] **Step 4: Verify curriculum + content check are untouched**

Run: `npm run gen:curriculum && git diff --exit-code src/content/curriculum.ts && npm run check-snippets`
Expected: no diff to `curriculum.ts`; check-snippets reports 0 errors (0/0).

- [ ] **Step 5: Commit**

```bash
git add src/content/charts/clear-compact-new-tree.ts src/content/charts/index.test.ts
git commit -m "feat(charts): make the clear/compact/new resolver a guided 2-level tree

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Docs + acceptance

**Files:**
- Modify: `src/content/charts/README.md`

**Interfaces:**
- Consumes: everything above. Produces: authoring docs for the `guided` flag + a green full suite.

- [ ] **Step 1: Document the guided flag in the charts README**

In `src/content/charts/README.md`, find the "Flowcharts (branching)" section (the part describing the `flow` row kind) and add this subsection immediately after the flow-row field description:

```markdown
#### Guided decision trees

A `flow` row that is a decision tree can opt into **guided traversal** by setting
`guided: true`. The learner then walks it one question at a time (guided mode, the
default) and can switch to **Explore** to see the whole static graph (the same
`FlowView` rendering).

Authoring rules (the data *is* the traversal contract):

- Give the entry node `role: 'question'`; it must be the only node with no incoming
  edge (a single root).
- Each question node's **outgoing edges are its answer options, in array order** — the
  edge `label` is the button text. Author them in the order you want them shown.
- Terminal nodes get `role: 'leaf'`: their `lines` carry the 1–3 sentence
  justification and their `target` links to the option's home lesson (or a popup).
- A leaf's path summary ("You said: … → …") is derived from the edge labels along the
  chosen path, so write labels that read as answers.

Without `guided`, a `flow` row renders as the plain static diagram (e.g. the
`agentic-loop-diagram` cycle), unchanged.
```

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: PASS — all tests green (previous suite + the new `flowTraversal`, `GuidedFlow`, `Chart` guided, and `index` guided-root tests).

- [ ] **Step 3: Build + lint + content check**

Run: `npm run build && npm run lint && npm run check-snippets`
Expected: build clean (dagre still lazily code-split into its own chunk — guided mode adds no top-level heavy import); lint shows only the pre-existing warnings; check-snippets 0/0.

- [ ] **Step 4: Confirm curriculum no-diff (final)**

Run: `npm run gen:curriculum && git diff --exit-code src/content/curriculum.ts`
Expected: no output (no diff).

- [ ] **Step 5: Commit**

```bash
git add src/content/charts/README.md
git commit -m "docs(charts): document the guided decision-tree flag

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Acceptance criteria

- `flow` rows opt into guided traversal via `guided: true`; without it they render the static `FlowView` unchanged (agentic-loop and existing flow tests still pass).
- Guided mode (default): root question → ordered option buttons → advances per pick → terminates at a recommendation leaf with a path summary + working home-lesson/popup activation; "Start over" resets; "Explore" toggles to the static graph.
- Traversal logic lives in a pure, node-testable module (`flowTraversal.ts`); option order = authored edge order.
- `clear-compact-new-tree` is guided and two levels deep, embedded (already) in the *review-changes* lesson; `curriculum.ts` is byte-identical.
- Full suite green; build clean (dagre still code-split); lint clean (pre-existing warnings only); `check-snippets` 0/0.
- Tokens-only, no green (teal for positive), no `any`; `prefers-reduced-motion` honored via reused primitives.

## Self-review notes

- **Spec coverage:** §4.1 flag → Task 1; §4.2 engine → Task 1; §4.3 GuidedFlow (guided stepper, leaf recommendation, path summary, Start over, mode toggle, focus-on-advance) → Task 2; §4.4 wiring → Task 3; §5 dogfood (guided + deepen) → Task 4; §6 a11y/tokens → Tasks 2 & 5; §7 testing → all tasks; §9 files → all; §2 non-goals → not built (no simulator/quiz/highlight/new charts).
- **Type consistency:** `findRoot`/`optionsAt`/`isLeaf`/`pathSummary` signatures identical across Tasks 1–2; `GuidedFlow` prop shape matches `FlowView`'s; `guided?: boolean` added once (Task 1) and consumed in Tasks 3–4.
- **No placeholders:** every code/test/command step carries complete content.

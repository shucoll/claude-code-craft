# Curriculum Phase 2a — Guided Decision-Tree Traversal

**Status:** Design approved, ready for plan.
**Date:** 2026-07-04
**Parent initiative:** Curriculum Authoring Platform (Curriculum §1.5 "Interactive
elements", Part 5 chart inventory). This is the first of the curriculum's **Phase 2**
interactive behaviors. Simulators and quizzes are separate, later specs.
**Builds on:** Phase 4 chart flowchart support
(`docs/superpowers/specs/2026-07-04-curriculum-charts-phase4-design.md`), whose §8
deliberately made the flow node/edge JSON the **complete data contract** for guided
traversal. This phase adds behavior, not data.

## 1. Goal & scope

Upgrade branching `flow` charts that are decision trees so a learner can walk them
**one question at a time** (curriculum §1.5 "Decision tree (Phase 2)"), while the existing
static graph remains available as the **explore** view. Two modes:

- **Guided (default):** start at the root question, pick one of 2–4 options per node, the
  view advances to the next question, and traversal always terminates at a **recommendation
  leaf** — the recommended option, a 1–3 sentence justification, a **path summary** of the
  answers given, and a link to the option's home lesson. A "start over" control resets it.
- **Explore:** the zoomed-out view of the whole tree — *exactly* the Phase 1 static rendering
  (`FlowView`), already shipped. Toggling to explore requires no new graph work.

**In scope:** guided decision-tree traversal for `flow` charts that opt in; upgrade the one
existing dogfood tree (`clear-compact-new-tree`).

**Out of scope (deferred, see §8):** simulators, quizzes, an in-graph active/dimmed highlight
state, and the not-yet-authored `mechanism-decision-tree` / `orchestration-decision-tree`
charts (built when their lessons land).

## 2. Non-goals / deferred

- **Simulators** (curriculum §1.5) — a *separate primitive with a different JSON shape*; none
  of this phase's traversal work applies. Its own spec later.
- **Quizzes** — deferred entirely per curriculum §1.5.
- **In-graph active/dimmed highlight** — the focused Q&A stepper is the guided surface, so
  highlighting nodes inside the graph is unnecessary. (Phase 4 §8 called this "cosmetic.")
- **No generator/validator/emitter change; no new route; no gating.** `curriculum.ts` stays
  byte-identical (no lesson frontmatter changes).

## 3. Architecture

Three cleanly separated units, mirroring the Phase 4 split (data / logic / render):

- **Data (opt-in flag):** one additive field on the `flow` row marks it as a guided tree.
- **Logic (pure, no React/DOM/dagre):** a traversal module derives the root, the ordered
  options at any node, leaf detection, and the path summary from the node/edge JSON.
- **Render (React):** a `GuidedFlow` component owns the guided/explore mode state; guided mode
  is a focused Q&A stepper, explore mode delegates to the existing `FlowView` unchanged.

The chart activation path (`ChartEmbed` → `onActivate` → navigate-to-lesson or popup) is
reused verbatim for leaf home-lesson links; nothing new is wired for navigation.

## 4. Components

### 4.1 Data model — additive to `src/content/charts/types.ts`

Add an opt-in flag to the existing `flow` member of the `ChartRow` union:

```ts
| { kind: 'flow'; nodes: FlowNode[]; edges: FlowEdge[]; direction?: FlowDirection; guided?: boolean }
```

- `guided` defaults to `undefined` (falsy) → the row renders as the plain static `FlowView`
  (the agentic-loop diagram and any non-tree flow are untouched).
- `guided: true` → the row renders through `GuidedFlow`.
- No other data changes. The Phase 4 §8 contract already supplies everything else:
  `role: 'question'` marks branch points, `role: 'leaf'` marks termini, and **edge array
  order = option order**.

### 4.2 Traversal engine — `src/components/charts/flowTraversal.ts` (pure)

No React, no DOM, no dagre — importable and unit-testable in the node test env.

```ts
import type { FlowNode, FlowEdge } from '../../content/charts/types'

/** The single entry node (no incoming edges). Expected role: 'question'. */
export function findRoot(nodes: FlowNode[], edges: FlowEdge[]): FlowNode

/** Outgoing edges of a node, in authored array order (= option order, §8). */
export function optionsAt(nodeId: string, edges: FlowEdge[]): FlowEdge[]

/** A terminus: role 'leaf', or (defensively) a node with no outgoing edges. */
export function isLeaf(node: FlowNode, edges: FlowEdge[]): boolean

/** The chosen answer labels, in order, for the path-summary strip. */
export function pathSummary(steps: FlowEdge[]): string[]
```

- `findRoot`: the node that appears in no edge's `to`. If exactly one exists, return it;
  otherwise (malformed authoring) the caller falls back to `nodes[0]`. A dev-time assertion /
  test guards the "exactly one root, role question" expectation for authored trees.
- `optionsAt`: `edges.filter((e) => e.from === nodeId)` — **must not reorder**; array order is
  the authored option order.
- `pathSummary(steps)`: `steps.map((e) => e.label ?? '…')`.

### 4.3 Guided component — `src/components/charts/GuidedFlow.tsx`

Props mirror `FlowView`: `{ row: FlowRow; onActivate: (card: ChartCard) => void }` (with
`row.guided === true`). Local state:

- `mode: 'guided' | 'explore'` — **defaults to `'guided'`**.
- `currentId: string` — starts at `findRoot(...)`.
- `steps: FlowEdge[]` — the chosen edges so far.

Reset-on-row-change uses the set-state-during-render pattern (same as `FlowView`), so a new
`row` prop restarts traversal without a mount-firing effect.

**Guided mode render:**

- The current node's `title` as a **question heading**; on advance, move focus to it so the
  new question is announced.
- **At a question node:** its `optionsAt(...)` edges rendered as chunky `Button`s, label =
  `edge.label`. Clicking pushes the edge to `steps` and sets `currentId = edge.to`.
- **At a leaf** (`isLeaf`): render the recommendation by reusing **`ChartCardView`** for the
  leaf card (so its `target` fires the existing `onActivate` → navigate-to-lesson or popup),
  plus a **path summary** strip ("You said: mid-task → went wrong → **/rewind**") built from
  `pathSummary(steps)` joined with the leaf title, plus a **Start over** button that resets
  `currentId`/`steps`.

**Explore mode render:** `<FlowView row={row} onActivate={onActivate} />` unchanged.

**Mode toggle:** two buttons ("Guided" / "Explore") with `aria-pressed`.

**Motion:** any advance/leaf transition honors `prefers-reduced-motion`, consistent with the
existing chart components (`ChartCardView` / animations already respect it).

### 4.4 Wiring — `src/components/charts/Chart.tsx`

The flow branch becomes:

```tsx
row.kind === 'flow'
  ? row.guided
    ? <GuidedFlow row={row} onActivate={onActivate} />
    : <FlowView row={row} onActivate={onActivate} />
  : /* cards … */
```

`GuidedFlow` renders `FlowView` itself for explore mode, so `Chart.tsx` only chooses the
top-level component. `ChartEmbed` and the activation/navigation/popup path are unchanged.

## 5. Dogfood

Flip the existing `clear-compact-new-tree` chart (already embedded inline in the
*review-changes* beginner lesson) to `guided: true`.

**Deepen it to two levels** so guided traversal exercises real multi-step depth and produces a
meaningful path summary, matching the B2.4 decision inputs in curriculum_v3 ("Is current
context still relevant? Are you mid-task? Did something go wrong vs just getting long?"). For
example: root question "Are you mid-task?" → a second question ("What's happening with the
context?") → the three existing leaves (`/clear`, `/compact`, start-new). This is a
hand-authored data edit only — **`curriculum.ts` stays no-diff** and `check-snippets` stays
0/0 (no lesson frontmatter change; the chart is already registered).

The explore-mode fallback (the full static graph) continues to render exactly as it does today
via `FlowView`.

## 6. Accessibility & tokens

- Question rendered as a heading; focus moves to the new question on each advance so screen
  readers announce it. Options, the Start-over control, and the mode toggle are all real
  `<button>`s; the toggle uses `aria-pressed`.
- The path summary is plain, readable text (not `sr-only`).
- **Semantic tokens only** — `bg-background`, `text-primary`, `border-ink`, etc. **Teal** for
  the recommendation / positive accent. **No green** (reserved for success/completed).
- No `any`; TypeScript strict.

## 7. Testing

- **Pure** `flowTraversal.test.ts` (node env): root detection (single-root and malformed
  fallback), `optionsAt` preserves authored edge order, `isLeaf` by role and by no-outgoing,
  `pathSummary` maps labels in order. Fast, no dagre, no DOM.
- **Component** `GuidedFlow.test.tsx` (jsdom): guided is the default mode; the root question
  and its options render; clicking an option advances to the next question; reaching a leaf
  shows the recommendation card, the path summary, and a working home-lesson activation
  (`onActivate` called / navigation); **Start over** resets to the root; the toggle switches
  to explore and `FlowView` renders (its loading/graph state). jsdom-friendly because guided
  mode uses **no dagre**.
- **Regression:** the agentic-loop and existing `FlowView` tests are unchanged (no `guided`
  flag → still static). `curriculum.ts` regeneration is a no-op (`git diff --exit-code`);
  `npm run check-snippets` reports 0/0.
- Full suite green; `npm run build` clean (dagre still lazily code-split — guided mode adds no
  new top-level heavy imports).

## 8. Phase readiness (what this unlocks / defers)

- **Other decision-tree charts** (`mechanism-decision-tree`, `orchestration-decision-tree`)
  become a *data-only* task: author the nodes/edges with `role`s + labels and set
  `guided: true` — no new code.
- **Simulators** remain a separate primitive (different JSON shape); this phase does not touch
  them. They get their own spec → plan → SDD cycle.
- **In-graph highlight** can still be added later to explore mode if desired, independently.

## 9. Files

New:
- `src/components/charts/flowTraversal.ts` (pure engine)
- `src/components/charts/flowTraversal.test.ts`
- `src/components/charts/GuidedFlow.tsx`
- `src/components/charts/GuidedFlow.test.tsx`

Changed:
- `src/content/charts/types.ts` — add `guided?: boolean` to the flow row.
- `src/components/charts/Chart.tsx` — route guided flow rows to `GuidedFlow`.
- `src/content/charts/clear-compact-new-tree.ts` — `guided: true` + deepen to two levels.
- `src/content/charts/README.md` — document the `guided` flag + guided/explore behavior.
- (No change to `chartIds.ts`, generator, validator, emitter, or `curriculum.ts`.)

## 10. Execution

Feature branch off `main`, executed via subagent-driven-development (fresh implementer per
task, sonnet task-reviewers, opus final whole-branch review), landed via a CI-gated PR.
Suggested task order: 1) data flag + pure `flowTraversal` (+ tests); 2) `GuidedFlow` component
(+ tests); 3) `Chart.tsx` wiring; 4) dogfood (`clear-compact-new-tree` guided + deepened);
5) docs (README) + acceptance.

Global invariants (carried from Phase 4): TS strict, no `any`; semantic tokens only, no green
(teal for positive); additive/no regressions to existing charts; `curriculum.ts` no-diff;
honor `prefers-reduced-motion`. Commit trailer:
`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

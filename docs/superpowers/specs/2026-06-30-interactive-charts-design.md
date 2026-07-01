# Interactive Charts — Design

**Status:** Approved (brainstorm) — **Revised**: renderer pivoted from an SVG node-graph
to a **card-flow stack** (Option A) after reviewing target designs.
**Date:** 2026-06-30
**Phase:** 5 (interactive charts — §8 of the master spec)
**Depends on:** Content engine (MDX + `Snippet`/`TryPrompt`/`WhenLang`, `MDXProvider`,
`mdxComponents`), app shell (`AppShell`, `RequireOnboarded`), routing, `curriculum.ts`,
`lessonPath`/`findLesson`, `resolveLandingPath`, design tokens in `src/styles/index.css`.

## Purpose

Teach with clickable diagrams. A chart is a **vertical stack of layers** embedded in a
lesson: each layer is one or more **content cards** (a heading + short description lines),
individually themed, connected top-to-bottom by arrows, with optional small "connector"
pills between layers. Clicking an interactive card either **navigates to an existing
lesson** or **opens an inline popup**. The chart owns **layout + interaction + animation**;
lesson/popup MDX owns **long-form content**; the router and a modal glue them.

This phase ships the **generic machinery + a single demo chart**. Real domain charts are
authored later against the same data model and click contract.

## Rendering decision

Custom **HTML + CSS (flex/grid) + Framer Motion**, not a charting or diagram library.

- The target diagrams are **document-flow card stacks**, not quantitative plots — so
  data-viz libraries (Recharts/Chart.js/Nivo/D3) are the wrong category.
- They are **not** free-form graphs (no cycles, multi-edges, or edge labels), so a
  diagram library (React Flow) is unnecessary here. Custom HTML keeps zero new
  dependencies, reflows responsively (2–3 columns → 1 on mobile) with a single CSS rule,
  stays on-brand with design tokens, and keeps every card a real DOM node that is
  trivially clickable/keyboard-operable and jsdom-testable.
- **Deferred (documented):** the day a chart is *genuinely graph-shaped* — loops,
  multiple edges to/from a node, non-linear edges, or edge labels — we adopt **React
  Flow** as a second renderer *behind the same data + click→lesson/popup contract*, rather
  than hand-rolling edge routing. Not added now (YAGNI).

## Scope

**In scope**

- A card-flow `ChartDef` data model (rows of cards + connector pills; per-card tone +
  optional target) and a chart registry.
- A curated, chart-scoped **tone palette** added to the design tokens.
- A presentational `<Chart>` HTML renderer + a `<ChartCardView>` card, with auto arrows
  between rows and responsive column stacking.
- A `ChartEmbed` MDX wrapper wiring card activation to routing/popup/no-op.
- Reuse (unchanged) of `Popup`, `ChartPopup`, and the lesson Back button
  (`useBackTarget` + scroll-to-anchor).
- One demo chart exercising all card kinds (lesson target, popup target, targetless),
  multiple tones, a split row, and a connector pill — embedded in an existing lesson.
- An authoring guide (`src/content/charts/README.md`) documenting how to add a chart,
  plus a short "Adding a chart" pointer in `CLAUDE.md` — written last, against the
  shipped API.

**Out of scope (deferred)**

- React Flow / graph-shaped charts (loops, multi-edges, edge labels) — reserved behind
  the same contract; not added now.
- Per-column fan-out/fan-in arrows (screenshot-1 style). MVP draws one centered arrow
  per row gap; column-aware arrows are a later enhancement.
- Freeform/MDX content *inside* a card. Cards are structured (title + lines); long-form
  detail lives in the lesson or popup a card links to.
- A separate chart-detail route (never added).

## Data model

```ts
// src/content/charts/types.ts
import type { ComponentType } from 'react'

export interface LessonRef { level: string; module: string; lesson: string }

export type ChartTarget =
  | { kind: 'lesson'; ref: LessonRef }
  | { kind: 'popup'; title?: string; content: () => Promise<{ default: ComponentType }> }
export type PopupTarget = Extract<ChartTarget, { kind: 'popup' }>

export type ChartTone = 'neutral' | 'blue' | 'violet' | 'amber' | 'rose' | 'teal'

export interface ChartCard {
  id: string
  title: string
  lines?: string[]        // muted description lines (e.g. "a · b · c")
  tone?: ChartTone        // default 'neutral'
  target?: ChartTarget    // omitted => inert (non-interactive) card
}

export type ChartRow =
  | { kind: 'cards'; cards: ChartCard[] }   // 1 = full-width, 2–3 = split evenly
  | { kind: 'connector'; label: string }    // small centered "unlock: …" pill

export interface ChartDef {
  id: string
  title?: string
  subtitle?: string       // e.g. "Click any layer to go deeper →"
  rows: ChartRow[]
}
```

- A **targetless card** renders inert: not a button, not focusable, `aria-hidden`.
- The **registry** (`src/content/charts/index.ts`) maps `chartId → ChartDef` and exposes
  `getChart(id): ChartDef | undefined`.
- Demo chart (`src/content/charts/demo.ts`, id `"demo"`): a small levels-style stack —
  a full-width intro card, a two-card split (one `lesson` target, one `popup` target), a
  `connector` pill, and a targetless card — across several tones. Popup MDX lives under
  `src/content/charts/popups/`.

## Theming — chart tone palette

Add a **chart-scoped tone palette** to `src/styles/index.css` (`@theme`, both light and
dark), documented as a sanctioned chart exception (mirrors the intro starfield's
named-color exception). Each tone defines a muted **background**, a **border**, and a
**heading text** color:

```
--chart-<tone>-bg, --chart-<tone>-border, --chart-<tone>-text   for each tone in
{ neutral, blue, violet, amber, rose, teal }
```

registered under `@theme inline` as `--color-chart-<tone>-{bg,border,text}` so Tailwind
generates `bg-chart-<tone>-bg` / `border-chart-<tone>-border` / `text-chart-<tone>-text`
utilities. `ChartCardView` maps `tone` → these classes via a `TONE_CLASSES` lookup
(default `neutral`).

- **Success-green is deliberately excluded** from the palette (charts use `teal`) so the
  existing "green = success/completed" signal stays unambiguous.
- Coral remains the brand accent; tones are for chart cards only, not general UI.

## Components (`src/components/charts/`)

### `<ChartCardView card onActivate>`
- Chunky card surface — `border-2 border-ink shadow-hard rounded-card` — with a
  tone-tinted background + tone heading color; renders `title` (bold) and muted `lines[]`.
- **Interactive** (`card.target` set): a `<button>` with `aria-label={title}`, hover-lift
  (chunky), keyboard-operable; click/Enter/Space → `onActivate(card)`.
- **Inert** (no target): a plain `<div aria-hidden>`, not focusable.

### `<Chart def onActivate>`
- HTML renderer. Optional header (`title` + `subtitle`).
- Each `cards` row → a flex container: 1 card full-width; 2–3 cards split into equal
  columns that **stack to one column below a small breakpoint**.
- Each `connector` row → a centered muted pill with its label.
- A centered downward **arrow** element is rendered between consecutive rows.
- Framer Motion entrance/hover gated by `useReducedMotion`.
- **Knows nothing about routing/modals** — only calls `onActivate(card)`.

### `ChartEmbed` — MDX-facing wrapper (unchanged behavior)
- Props `{ id }`. `getChart(id)`; renders nothing for an unknown id.
- Wraps `<Chart>` in `<div id={`chart-${id}`}>` (scroll anchor).
- `onActivate(card)` by `card.target?.kind`:
  - `'lesson'` → resolve via `findLesson(curriculum, ref.level, ref.module, ref.lesson)`,
    then `navigate(lessonPath(loc), { state: { from: `${pathname}#chart-${id}` } })`
    (unresolvable ref → no-op).
  - `'popup'` → open `<ChartPopup>` (local state; no navigation).
  - `undefined` → no-op.
- Registered in the shared `mdxComponents` map; lessons embed `<ChartEmbed id="demo" />`.

### `Popup` / `ChartPopup` (unchanged)
Generic focus-trapped scrollable modal primitive (`src/components/ui/Popup.tsx`) and its
chart wrapper that lazy-renders a popup card's MDX through `MDXProvider` + `mdxComponents`.

## Routing + back navigation (unchanged)

No new routes. `ChartEmbed` records origin in `state.from` (with a `#chart-<id>` hash) on
lesson navigation. Every lesson has a **Back** button (`useBackTarget`: `state.from` →
previous curriculum lesson → hidden). On return, the lesson scroll-restores to
`#chart-<id>` (polling via `requestAnimationFrame` until the lazy chart mounts, then
`scrollIntoView`). The lesson's advance control and Sidebar links also pass `state.from`.

## File plan

```
src/content/charts/
  types.ts                 # ChartTone / ChartCard / ChartRow / ChartDef (+ ChartTarget/PopupTarget/LessonRef)
  demo.ts                  # card-flow demo chart (replaces loop.ts)
  index.ts                 # registry + getChart()
  popups/*.mdx             # popup card MDX stubs
src/components/charts/
  ChartCardView.tsx        # one tone-tinted card (interactive/inert)
  Chart.tsx                # HTML row/card renderer + arrows/connectors
  ChartEmbed.tsx           # MDX wrapper (routing + popup + anchor) — onActivate(card)
  ChartPopup.tsx           # unchanged
src/components/ui/
  Popup.tsx                # unchanged
src/lib/
  useBackTarget.ts         # unchanged
# edits:
src/styles/index.css                          # + chart tone tokens (@theme, light + dark)
src/components/mdx/mdxComponents.tsx          # ChartEmbed already registered
src/content/lessons/advanced/subagents.mdx    # embeds <ChartEmbed id="demo" />
src/content/charts/README.md                  # authoring guide (how to add a chart)
CLAUDE.md                                     # + short "Adding a chart" pointer to the README
# removed: the SVG Chart node/edge model (loop.ts, old Chart.tsx internals)
```

## Testing

Vitest + React Testing Library (jsdom):

- **Registry:** `getChart` returns the demo def for a known id, `undefined` otherwise.
- **`ChartCardView`:** interactive card is a `button` firing `onActivate` on click and
  Enter/Space; targetless card is inert (no button role, not focusable); the resolved
  tone maps to the expected `bg-chart-<tone>-bg` class; reduced-motion path renders.
- **`<Chart>`:** correct row count; a 1-card row is full-width and a 2-card row splits
  (assert the split container/columns); a `connector` row renders its label; an arrow
  element renders between consecutive rows.
- **`ChartEmbed`:** unknown id renders nothing; anchor `id="chart-<id>"` present;
  activating a lesson card navigates to the resolved `lessonPath` with `state.from`;
  activating a popup card opens `ChartPopup` without navigating.
- **`ChartPopup` / `useBackTarget` / Back button:** unchanged from the current
  implementation (already covered).

Manual/visual (user, in browser): tone palette in light + dark, responsive column
stacking, arrow/connector spacing, entrance/hover feel, scroll-restore.

## Invariants honored

- Semantic tokens only; the chart tone palette is a documented, chart-scoped exception
  registered in `@theme`. Success-green stays reserved for completion; coral stays brand.
- Language-specific content stays in snippet packs; popup MDX is language-aware via the
  existing engine.
- `curriculum.ts` remains the single source of truth for the sidebar and for validating
  lesson targets; charts add no sidebar entries.
- TypeScript strict, no `any`.

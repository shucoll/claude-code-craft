# Chart Authoring Guide

## Overview

Charts are interactive stacks embedded in lessons. Each chart is a vertical stack of rows, where each row contains a set of cards, a connector pill with a label, or a branching **flow** (a flowchart of nodes and labeled edges — see "Flowcharts (branching)" below). Click an interactive card or node to navigate to a lesson in the curriculum or open a modal popup with additional content. Non-interactive (targetless) cards and nodes are inert.

## Data Model

All charts are defined as a `ChartDef`, which has:

```typescript
interface ChartDef {
  id: string              // unique identifier
  title?: string          // optional title displayed above the chart
  subtitle?: string       // optional subtitle displayed below the title
  rows: ChartRow[]        // vertical stack of rows
}
```

### Rows

Each row is one of three kinds:

**Cards row:**
```typescript
{ kind: 'cards', cards: ChartCard[] }
```
Displays one or more cards. A single card spans full width; two or three cards split horizontally and stack on mobile.

**Connector row:**
```typescript
{ kind: 'connector', label: string }
```
Displays a labeled pill (e.g., "unlock: unlock advanced features"). Arrows auto-connect above and below.

**Flow row:**
```typescript
{ kind: 'flow', nodes: FlowNode[]; edges: FlowEdge[]; direction?: 'TB' | 'LR' }
```
Renders a branching flowchart with nodes and labeled edges — see "Flowcharts (branching)" below.

### Cards

Each card in a cards row:

```typescript
interface ChartCard {
  id: string              // unique within the chart
  title: string           // card headline
  lines?: string[]        // optional muted description lines
  tone?: ChartTone        // color variant; defaults to 'neutral'
  target?: ChartTarget    // click behavior; omit for inert card
}
```

**Tones** control the card's color. Choose from:
- `'neutral'` — default, muted
- `'blue'` — primary accent
- `'violet'` — secondary accent
- `'amber'` — warning/caution
- `'rose'` — error/destructive
- `'teal'` — success/goal

Note: success-green is intentionally excluded; use `'teal'` for positive outcomes.

### Targets

A card's `target` controls what happens when clicked. If omitted, the card is non-interactive.

**Lesson target:**
```typescript
{ kind: 'lesson', ref: { level: string, module: string, lesson: string } }
```
Navigates to a lesson in the curriculum. The `ref` must match an existing lesson in `src/content/curriculum.ts`:
```typescript
// example
target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } }
```

**Popup target:**
```typescript
{ kind: 'popup', title?: string, content: () => Promise<{ default: ComponentType }> }
```
Opens a modal with custom content loaded from an MDX file:
```typescript
// example
target: {
  kind: 'popup',
  title: 'Bash',
  content: () => import('./popups/bash.mdx')
}
```
The MDX file is dynamically imported and rendered in a modal. The `title` is optional and displayed in the modal header.

## Adding a Chart

### 1. Create the chart definition

Create a new file `src/content/charts/<id>.ts` exporting a `ChartDef`:

```typescript
// src/content/charts/my-chart.ts
import type { ChartDef } from './types'

export const myChart: ChartDef = {
  id: 'my-chart',
  title: 'My Chart Title',
  subtitle: 'Optional subtitle',
  rows: [
    {
      kind: 'cards',
      cards: [
        { id: 'card-1', title: 'First Card' },
        { id: 'card-2', title: 'Second Card' }
      ]
    },
    { kind: 'connector', label: 'and then' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'card-3',
          title: 'Next Level',
          lines: ['learn · apply · master'],
          tone: 'blue',
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } }
        }
      ]
    }
  ]
}
```

### 2. Register the chart

Add your chart to the charts registry in `src/content/charts/index.ts`:

```typescript
import { demo } from './demo'
import { myChart } from './my-chart'
import type { ChartDef } from './types'

const charts: Record<string, ChartDef> = {
  [demo.id]: demo,
  [myChart.id]: myChart,
}

export function getChart(id: string): ChartDef | undefined {
  return charts[id]
}
```

### 3. Create popup content (if needed)

If your chart uses popup targets, create an MDX file under `src/content/charts/popups/<name>.mdx`:

```mdx
# Popup Title

Your content here. You can use any markdown, including:
- Lists
- Code blocks
- Embedded components like `<Snippet />`

The popup is rendered in a modal with auto-sizing.
```

Example: `src/content/charts/popups/bash.mdx`
```mdx
# Bash

Claude Code can run shell commands on your behalf. The example below is rendered
through the same language-aware engine the lessons use:

<Snippet id="edit-function" />
```

### 4. Embed in a lesson

In your lesson MDX, use the `<ChartEmbed />` component with the chart's `id`:

```mdx
# My Lesson

Some intro text.

<ChartEmbed id="my-chart" />

More content after the chart.
```

The chart will render inline with automatic spacing and card activation wired to lesson navigation and popup opens.

## Layout

- **Single card row:** spans full width
- **Two–three card row:** splits horizontally; stacks to full-width on mobile
- **Connector row:** labeled pill; a centered connector line is rendered between consecutive rows
- **Arrows:** simple centered connectors between consecutive rows (not SVG edge-routing)
- **Reduced motion:** respects prefers-reduced-motion; disables animations

## Example: Full Chart

Here's a complete, working example adapted from the demo:

```typescript
// src/content/charts/levels.ts
import type { ChartDef } from './types'

export const levelChart: ChartDef = {
  id: 'levels',
  title: 'Claude Code: levels',
  subtitle: 'Click a layer to go deeper →',
  rows: [
    {
      kind: 'cards',
      cards: [
        {
          id: 'start',
          title: 'Start here',
          lines: ['Pick a path and go deeper'],
          tone: 'neutral'
        }
      ]
    },
    {
      kind: 'cards',
      cards: [
        {
          id: 'beginner',
          title: 'Beginner',
          lines: ['operator · the turn', 'approve diffs · /init'],
          tone: 'blue',
          target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } }
        },
        {
          id: 'bash',
          title: 'Bash',
          lines: ['run shell commands'],
          tone: 'amber',
          target: { kind: 'popup', title: 'Bash', content: () => import('./popups/bash.mdx') }
        }
      ]
    },
    {
      kind: 'connector',
      label: 'unlock: configure the agent\'s environment'
    },
    {
      kind: 'cards',
      cards: [
        {
          id: 'advanced',
          title: 'Advanced',
          lines: ['orchestrator · the fleet', 'parallel agents · CI'],
          tone: 'violet'
        }
      ]
    }
  ]
}
```

Then register in `index.ts` and embed with `<ChartEmbed id="levels" />`.

## Flowcharts (branching)

The card-flow rows above are a linear vertical stack — great for a straight-line
narrative, but they can't express branches, loops, or labeled edges. For that,
use a `flow` row:

```typescript
{ kind: 'flow'; nodes: FlowNode[]; edges: FlowEdge[]; direction?: 'TB' | 'LR' }
```

`direction` defaults to `'TB'` (top-to-bottom); use `'LR'` for a left-to-right
layout.

### Flow nodes and edges

```typescript
interface FlowNode {
  id: string
  title: string
  lines?: string[]        // optional muted description lines
  tone?: ChartTone        // same tone palette as cards; defaults to 'neutral'
  target?: ChartTarget    // same lesson/popup targets as cards; omit for inert node
  role?: 'default' | 'question' | 'leaf'   // Phase-2 traversal hint; defaults to 'default'
}

interface FlowEdge {
  from: string   // source node id
  to: string     // target node id
  label?: string // e.g. "yes" / "no" / an option label, rendered on the edge
}
```

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

Layout is computed by [`@dagrejs/dagre`](https://github.com/dagrejs/dagre),
dynamically imported (code-split) in `src/content/charts/flowLayout.ts` so the
dependency isn't in the main bundle unless a lesson actually embeds a flow
chart. The positioned graph is rendered by `FlowView`
(`src/components/charts/FlowView.tsx`), which reuses `ChartCardView` for each
node and draws the edges as SVG polylines with label pills. Cycles/loops and
multiple labeled edges between nodes are fully supported — unlike the linear
stack above.

### When to use `flow` vs. card rows/connectors

- **Card rows + connectors** — a linear narrative: "first this, then that,"
  with at most one path through the chart.
- **`flow` row** — anything graph-shaped: branching decision trees (a question
  node with multiple labeled outgoing edges to different outcomes) or loops
  (an edge back to an earlier node), where a straight vertical stack can't
  represent the structure.

Example — a single-question decision node with one labeled option:

```typescript
{
  kind: 'flow',
  direction: 'TB',
  nodes: [
    { id: 'q', title: 'Which?', role: 'question' },
    { id: 'a', title: 'Option A', role: 'leaf', target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } } },
  ],
  edges: [{ from: 'q', to: 'a', label: 'if X' }],
}
```

Two working examples are registered in `src/content/charts/index.ts`:
`agentic-loop-diagram` (a loop) and `clear-compact-new-tree` (a decision tree).

**Phase-2 readiness:** `role` marks a node as a `question` (branch point) or a
`leaf` (recommendation terminus); the order of a node's outgoing edges in the
`edges` array is the answer-option order. This is the same data a future
guided, click-through traversal will consume — no separate authoring step is
needed now to support it later.

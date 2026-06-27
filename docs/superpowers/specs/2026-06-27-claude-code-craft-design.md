# Claude Code Craft — Design Spec

**Date:** 2026-06-27
**Status:** Approved (design); pending implementation plan

## 1. Purpose

An interactive, browser-based platform that teaches users how to use Claude Code
effectively — a guided tour structured as three learning **Pathways** (Beginner,
Intermediate, Advanced). A secondary goal of the project is for the author to
learn to be a Claude Code power user, so the repository itself models good Claude
Code practice (curated memory, tuned permissions, custom skills).

### Success criteria

- A user can pick a level + language, work through a hierarchy of lessons, and see
  their progress persist across sessions.
- Lessons are mostly shared across languages, with per-language code, prompts, and
  occasional conditional blocks resolved from a single data file per language.
- Adding a new programming language is "drop in one file" (with graceful fallback
  for missing keys).
- The repo ships with a real Claude Code setup the author can learn from.

## 2. Scope & non-goals

**In scope:** pure frontend SPA, static authored content, animations, light/dark
mode, hierarchical sidebar, progress tracking via localStorage, interactive
clickable charts with detail pages, language-aware content engine, Claude Code
project setup.

**Non-goals (YAGNI):**

- No backend, no auth, no database, no API keys, no sandboxing.
- No real or simulated execution of Claude Code commands. Content is authored
  (text, images, animations, embedded media); it does not run real Claude Code.
- No custom MCP server (see §9).
- No per-language *separate* curricula — content is shared, language only flavors it.

## 3. Stack

| Concern | Choice | Why |
|---|---|---|
| Build/framework | **Vite + React + TypeScript** | Client-side SPA, no SSR needed, small mental model |
| Routing | **React Router** | Maps to level → module → lesson hierarchy |
| Styling | **Tailwind CSS** (+ optional shadcn/ui primitives) | First-class dark mode via `class` strategy |
| Animations | **Framer Motion** (`motion`) | Page/route transitions, sidebar reveals, onboarding canvas |
| Content authoring | **MDX** | Markdown prose + embedded React components |
| State | **React Context + localStorage** | Theme, language, progress; Zustand is an easy later upgrade |
| Charts | **Custom SVG + Framer Motion** (default); React Flow only if a diagram is genuinely graph-shaped | Polished designed look; swappable behind a thin primitive |
| Hosting | Static (Vercel / Netlify / GitHub Pages) | Free; no backend |

Rejected alternatives: **Next.js** (framework overhead — RSC/App Router — for an
app with zero backend) and **Astro** (islands model fights pervasive global
interactivity: sidebar, theme, language, transitions).

## 4. Architecture

Single-page React app, entirely client-side. Three cross-cutting concerns live in
React Context and persist to localStorage:

- **ThemeContext** — light/dark, toggled anywhere, persisted.
- **LanguageContext** — selected language; drives snippet/content resolution.
- **ProgressContext** — per-lesson visited/completed; drives progress bars and
  sidebar glyphs.

Everything else is either a **route** (lesson or chart-detail page) or a
**reusable component** (sidebar, chart, animated terminal, snippet renderer).

```
User → React Router route
         ├─ Onboarding canvas (choose level + language)   [first visit]
         └─ AppShell (persistent sidebar + content area)
              └─ Lesson route → MDX content
                                 ├─ <Snippet id>   → reads LanguageContext
                                 ├─ <TryPrompt id>  → per-language prompt card
                                 ├─ <WhenLang is>   → conditional block
                                 ├─ <ToolsChart>    → onClick navigates to detail route
                                 └─ <Terminal>, <Quiz>, etc.
```

### Folder structure

```
claude-code-craft/
├─ CLAUDE.md                      # Claude Code project memory
├─ .claude/
│  ├─ settings.json               # permissions, hooks
│  └─ skills/                     # custom lesson-authoring skill(s)
├─ public/
├─ src/
│  ├─ main.tsx, App.tsx
│  ├─ router.tsx                  # route tree built from content registry
│  ├─ context/                    # Theme, Language, Progress providers
│  ├─ components/
│  │  ├─ shell/                   # AppShell, Sidebar, ProgressBar, ThemeToggle
│  │  ├─ onboarding/              # the canvas intro flow
│  │  ├─ mdx/                     # Snippet, TryPrompt, WhenLang, Terminal, Quiz, Callout…
│  │  └─ charts/                  # ToolsChart and other interactive diagrams + <Chart> primitive
│  ├─ content/
│  │  ├─ curriculum.ts            # the hierarchy: levels → modules → lessons (source of truth)
│  │  ├─ lessons/                 # MDX, organized by level
│  │  │  ├─ beginner/
│  │  │  ├─ intermediate/
│  │  │  ├─ advanced/
│  │  │  └─ charts/               # MDX detail pages for chart nodes
│  │  ├─ charts/                  # chart definitions (nodes → detail imports)
│  │  └─ snippets/                # one language pack file per language
│  │     ├─ javascript.ts         # default/fallback pack
│  │     ├─ python.ts
│  │     └─ go.ts
│  ├─ hooks/                      # useProgress, useLocalStorage…
│  ├─ lib/                        # mdx config, snippet resolver, storage utils
│  └─ styles/
├─ index.html
├─ tailwind.config.ts
├─ vite.config.ts
└─ package.json
```

**Two load-bearing invariants:**

1. **`curriculum.ts` is the single source of truth** for sidebar hierarchy,
   routing, and progress. Lessons are *defined* there; MDX files are just their
   content.
2. **All language-specific content lives in `content/snippets/*`** (and chart
   detail MDX uses the same components), so adding a language is one new file.

## 5. Content & language engine

Three tiers of language-awareness, most-shared to least:

1. **Shared prose (majority)** — authored once in MDX, no special handling.
2. **Inline language-specific values** — `<Snippet id="…" />` (code block) and
   `<TryPrompt id="…" />` (styled "try this" card) swap content per language while
   surrounding prose stays shared.
3. **Whole-block conditional content** — `<WhenLang is="python">…</WhenLang>` for
   sections that genuinely differ (setup steps, ecosystem-specific caveats).

All three resolve against **one data file per language**:

```ts
// src/content/snippets/python.ts
export default {
  meta:    { id: 'python', label: 'Python', icon: '🐍' },
  snippets: { 'refactor-example': { code: `def add(a, b): ...` } },
  prompts:  { 'first-refactor': 'Ask Claude to extract the validation logic into its own function' },
  blocks:   { /* optional longer per-key prose overrides */ },
} satisfies LanguagePack
```

**Resolution + graceful fallback (key to easy language addition):** the resolver
reads the active pack and looks up the key. If a key is missing, it falls back to
the **default pack (JavaScript)** and renders a subtle note (e.g. "example shown in
JavaScript"). A new language pack can therefore ship **partially complete** and
still work. A dev-only check lists missing keys per language.

**Curriculum as source of truth:**

```ts
export const curriculum: Level[] = [
  { id: 'beginner', title: 'Beginner', modules: [
    { id: 'basics', title: 'The Basics', lessons: [
      { id: 'what-is-cc', title: 'What is Claude Code?', content: () => import('./lessons/beginner/what-is-cc.mdx') },
      { id: 'first-edit',  title: 'Your First Edit',     content: () => import('./lessons/beginner/first-edit.mdx') },
    ]},
  ]},
  // intermediate, advanced…
]
```

Lessons lazy-load MDX via `import()` → automatic code-splitting, small initial bundle.

## 6. App shell: sidebar, progress & theme

**Shell** = persistent layout: collapsible left sidebar + content area. The
collapsed state is the "canvas" — sidebar reduced to a single top-left icon button;
clicking it slides the sidebar open (Framer Motion).

**Hierarchical sidebar**, derived from `curriculum.ts`:

- Three top-level **Levels** → expandable **Modules** → **Lessons**.
- Per-lesson state glyph: ✓ completed, ● current, ○ unvisited.
- Per-Level (and optional per-Module) mini progress bars; a global progress
  indicator at the top.

**Progress model (localStorage):** stores only raw per-lesson facts; derived
percentages are computed from `curriculum.ts` so they are never stale.

```ts
type ProgressState = Record<string /*lessonId*/, 'visited' | 'completed'>
// localStorage key: "ccc:progress", versioned for migration
```

- A lesson auto-marks **visited** on open.
- **Completed** triggers on an explicit "Mark complete / Next" action (more
  reliable than scroll detection; teaches deliberate progression).
- Levels unlock sequentially but are **not hard-locked** — a user who started at
  Intermediate can roll into Advanced on completion.

**Persistence keys** (namespaced `ccc:`, versioned):

- `ccc:theme` — `'light' | 'dark'`
- `ccc:lang` — selected language id
- `ccc:progress` — the map above
- `ccc:onboarded` — completed intro canvas
- `ccc:lastLesson` — resume pointer

**Theme:** Tailwind `class` dark mode; `ThemeToggle` flips `<html class="dark">`
and persists. First load respects `prefers-color-scheme` if nothing is stored.

## 7. Onboarding canvas & routing

**First visit** (`ccc:onboarded` unset) → full-screen animated multi-step canvas:

```
Step 1 — Welcome           → Begin
Step 2 — Choose your level  [ Beginner ] [ Intermediate ] [ Advanced ]
Step 3 — Choose a language  [ Python ] [ JavaScript ] [ Go ] …
Step 4 — Ready             → Start learning (first lesson of chosen level)
```

Choices write `ccc:lang`, set starting level, flip `ccc:onboarded`, then route into
the first lesson. **Level and language remain changeable later** from the
sidebar/header.

**Routing map:**

| Path | Renders |
|---|---|
| `/` | Redirect → onboarding (first visit) or resume last lesson (returning) |
| `/welcome` | Onboarding canvas flow |
| `/learn/:levelId/:moduleId/:lessonId` | AppShell + lesson MDX |
| `/chart/:chartId/:itemId` | AppShell + chart detail page |
| `*` | Friendly 404 inside the shell |

**Returning visit** → skip onboarding, resume `ccc:lastLesson`, falling back to the
start of the user's level. Routes are derived from `curriculum.ts`, so adding a
lesson auto-creates its route and sidebar entry.

## 8. Interactive charts

Each chart is defined by a data file (nodes + metadata); each node maps to a detail
page.

```ts
// src/content/charts/tools-chart.ts
export const toolsChart: ChartDef = {
  id: 'tools',
  nodes: [
    { id: 'edit',  label: 'Edit',  detail: () => import('../lessons/charts/edit.mdx') },
    { id: 'bash',  label: 'Bash',  detail: () => import('../lessons/charts/bash.mdx') },
    { id: 'agent', label: 'Agent', detail: () => import('../lessons/charts/agent.mdx') },
  ],
}
```

**Interaction flow:**

```
<ToolsChart />  (embedded in a lesson via MDX)
     │ hover → animated highlight (Framer Motion)
     │ click node "edit"
     ▼
React Router → /chart/tools/edit
     ▼
ChartDetailPage → renders node's MDX (prose + examples + <Snippet/> + <TryPrompt/> + <WhenLang/>)
     │ "← Back to diagram" → returns to lesson, scroll-restored
```

- Chart owns **interaction + animation**; node MDX owns **content** (fully
  language-aware via the same components); router glues them.
- Detail pages are lessons without a sidebar entry — they reuse the entire content
  engine.
- Rendering: default **custom SVG + Framer Motion** behind a thin `<Chart>`
  primitive (nodes, edges, hover/click). A genuinely graph-shaped diagram may use
  **React Flow** without changing the data model or the click→detail contract.
  React Flow is not added until a chart needs it.

## 9. Claude Code power-user setup

Treated as a real deliverable (the secondary project goal).

- **`CLAUDE.md`** — curated, concise project memory: stack + conventions
  (TS strict, Tailwind, MDX patterns, file-per-language rule), the two load-bearing
  invariants (§4), and short checklists for "add a lesson / language / chart", plus
  commands (`npm run dev/build/test/lint`).
- **`.claude/settings.json`** — permission allowlist for safe repeated commands
  (`npm run *`, `vite`, test/lint, `git status/diff`) while gating destructive
  operations. Optional format-on-save hook (Prettier/ESLint) for consistent
  generated code.
- **Custom skills** (`.claude/skills/`):
  - **`new-lesson`** — scaffolds an MDX file, registers it in `curriculum.ts`,
    stubs matching snippet keys across all language packs.
  - **`new-language`** — generates a complete language pack from the default, every
    key stubbed/marked, as a guided fill-in.
- **Slash commands (optional, lightweight):** `/check-snippets` lists missing
  language keys (surfaces fallback gaps from §5).

**Build order:** `CLAUDE.md` + `settings.json` early; skills once the
lesson/snippet engine exists for them to operate on.

### MCP

- **GitHub MCP** — repo operations (PRs, issues, reviews, releases). In use.
- **Context7 MCP** (available) — current docs for React/Vite/Tailwind/Framer
  Motion/MDX during development.
- **Chrome MCP** (available) — open the running app to visually verify onboarding,
  animations, dark mode.
- **No custom MCP.** Authoring workflows are codegen/file-edit recipes → skills,
  not MCP. Revisit only if a backend or external content source appears.

## 10. Testing & quality

Scaled to a content-driven frontend.

**Unit / logic (Vitest):**

- **Snippet resolver** — correct per-language value; falls back to default + flags
  on missing key (the §5 guarantee). Highest-value test in the codebase.
- **Progress logic** — visited/completed transitions; per-module/level/global %
  derived correctly; localStorage read/write + version migration.
- **Curriculum integrity** — walk `curriculum.ts`, assert every lesson's MDX import
  resolves and every referenced `Snippet`/`TryPrompt` key exists in the default
  language pack. Fails at CI, not in-browser.

**Component (React Testing Library):** sidebar hierarchy + glyphs; theme toggle
flip + persist; onboarding writes correct keys and routes onward; `<WhenLang>`
show/hide.

**Manual / visual (Chrome MCP):** animations, onboarding canvas feel, dark mode —
judgment calls, spot-checked in the running app.

**CI (GitHub Actions):** `lint → typecheck → test → build` on every PR. The build
is itself a real test (bad MDX / broken import fails it).

**Not testing:** exact animation timings, styling minutiae, MDX prose snapshots.

## 11. Open items for the implementation plan

- Initial language set to ship (e.g. JavaScript [default] + Python).
- Initial curriculum outline (module/lesson titles per level) — content authoring
  is a separate, ongoing track from engine implementation.
- Exact shadcn/ui adoption (which primitives, if any).

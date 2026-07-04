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

## Design system
- Tokens, type scale, and primitives: `design-system/MASTER.md`. Spec:
  `docs/superpowers/specs/2026-06-28-design-system-design.md`.
- Consume **semantic tokens only** (`bg-background`, `text-primary`, `border-ink`) —
  never raw hex or `--ccc-*` primitives.
- Brand = coral; green is reserved for success/completed. "Chunky" style (ink
  border + hard offset shadow) on `Button`/`Card`/`Badge` in `src/components/ui/`.

## Load-bearing invariants (later phases)
- `src/content/curriculum.ts` is the single source of truth for sidebar,
  routing, and progress.
- All language-specific content lives in `src/content/snippets/*` (one file per
  language) and resolves with fallback to the default pack (JavaScript).

## Adding a chart
Charts are card-flow stacks (`src/content/charts/`), embedded in lessons via
`<ChartEmbed id="…" />`. To add one: define a `ChartDef`, register it in
`index.ts`, and embed it. Full guide: `src/content/charts/README.md`.

## Adding lessons & languages
Authoring is **frontmatter-first** and script-backed (`scripts/authoring/`, run via `tsx`),
wrapped by skills:
- **Add a lesson / module / level:** use the `new-lesson` skill (`cli.ts lesson` or
  `cli.ts outline`). Lesson frontmatter (id, order, prerequisites, volatility, etc.) is the
  single source of truth; the dotted `id` is **auto-assigned** from the module's next free
  order — never pass or hand-edit it. `src/content/curriculum.ts` is **generated** from that
  frontmatter (`npm run gen:curriculum`, run automatically by the CLI) — never hand-edit it.
  New levels/modules are edited by hand in `src/content/structure.ts` (or introduced via
  `--level-title`/`--module-title`/`--module-slug` on first use). Inline fenced code is the
  default; `<Snippet>`/`<TryPrompt>` stubs in the default pack are **opt-in**
  (`--snippets`/`--prompts`) for genuinely language-specific spots — other packs fall back.
  Cross-link lessons inline with `<LessonLink id="B2.3" />`.
- **Add a language:** use the `new-language` skill (`cli.ts language`) — creates an empty
  pack; existing lessons fall back to the default until translated.
- **Check coverage:** `npm run check-snippets` — now the full **content check** (also a CI
  gate and the `/check-snippets` command): frontmatter validation (type/volatility,
  unresolved prerequisites/references, non-contiguous order, missing `docsSources` for
  non-stable lessons, slug/filename mismatch, etc.) plus snippet/prompt coverage. Tiered: any
  frontmatter or coverage error fails; non-default pack gaps and leftover `@@TODO@@` stubs warn.

## Commands
- `npm run dev` — dev server
- `npm run build` — type-check + bundle
- `npm test` — run Vitest once
- `npm run lint` — oxlint (ships with the current Vite template)
- `npm run check-snippets` — content check (frontmatter validation + snippet/prompt
  coverage); also runs in CI

## Spec & plans
- Design: `docs/superpowers/specs/2026-06-27-claude-code-craft-design.md`
- Plans: `docs/superpowers/plans/`

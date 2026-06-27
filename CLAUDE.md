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
- `npm run lint` — oxlint (ships with the current Vite template)

## Spec & plans
- Design: `docs/superpowers/specs/2026-06-27-claude-code-craft-design.md`
- Plans: `docs/superpowers/plans/`

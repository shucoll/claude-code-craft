# Claude Code Craft — Design System Spec

**Date:** 2026-06-28
**Status:** Approved (design); pending implementation plan
**Branch:** `feat/design-system`

## 1. Purpose

Establish the foundational design system for Claude Code Craft: a coherent set of
semantic design tokens (color, typography, spacing, radius, elevation, motion),
wired into Tailwind CSS v4, plus a small set of token-driven React primitives that
prove the system end-to-end. Everything supports light **and** dark mode, designed
in parallel with contrast verified independently per mode (per the product design
spec §6).

This is the visual foundation later phases build on (shell, sidebar, onboarding
canvas, charts). It is not a component library — it is tokens + a starter set of
primitives + documentation.

### Success criteria

- Components consume **semantic tokens only** (`bg-background`, `text-foreground`,
  `bg-primary`, `border-ink`) — never raw hex or primitive scale values.
- Light and dark both pass WCAG AA for text (4.5:1) and UI/large text (3:1).
- Adding/adjusting a color is a one-line change in `src/styles/index.css`.
- The signature button matches the approved "chunky" reference (neobrutalist hard
  offset shadow), rendered in the coral brand color.
- `prefers-reduced-motion` is fully honored; no emoji used as structural icons.

## 2. Scope & non-goals

**In scope:**

- Three-layer token architecture (primitive → semantic → Tailwind `@theme` mapping)
  in `src/styles/index.css`.
- Light + dark semantic token sets.
- Font loading (IBM Plex Sans + JetBrains Mono).
- Starter primitives: `Button`, `Card`, `Badge`, `ProgressGlyph`.
- Refactor of existing `App.tsx` shell and `ThemeToggle` to consume tokens and
  drop emoji icons.
- A persistent design-system reference doc (`design-system/MASTER.md`).
- Unit tests for the new primitives.

**Non-goals (YAGNI):**

- No full component library (inputs, modals, dropdowns, tables come later, as needed).
- No animation framework wiring beyond exposing motion tokens (Framer Motion
  integration happens when the shell/onboarding are built).
- No `tailwind.config.js` — Tailwind v4 CSS-first only (per CLAUDE.md).
- No new runtime dependencies (fonts via `<link>`, icons inline SVG, no `clsx`/
  `lucide-react`).
- No redesign of MDX content components (`Snippet`, `TryPrompt`, `WhenLang`) beyond
  what tokens passively provide; their restyle is a separate effort.

## 3. Design decisions (the source of truth)

### 3.1 Brand & color roles

- **Coral `#D97757`** (Claude's clay) = brand, primary actions, active/current
  state, focus ring, links.
- **Green `#22C55E`** = reserved **only** for success / "completed" (✓ glyphs,
  completion). Never a generic accent.
- Neutral ramp = slate.

### 3.2 Primitive palettes (raw — never consumed directly)

```
Coral:  50 #FCF3EF · 100 #F8E3D9 · 200 #F1C9B6 · 300 #E8AC92 · 400 #DF8E6E
        500 #D97757 (base) · 600 #C25E3D · 700 #A04A2E · 800 #7E3A24 · 900 #5C2A1A
Green:  400 #4ADE80 · 500 #22C55E · 600 #16A34A · 700 #15803D
Red:    500 #EF4444 · 600 #DC2626
Slate:  50 #F8FAFC · 100 #F1F5F9 · 200 #E2E8F0 · 300 #CBD5E1 · 400 #94A3B8
        500 #64748B · 600 #475569 · 700 #334155 · 800 #1E293B · 900 #0F172A · 950 #020617
```

### 3.3 Semantic tokens

| Token | Light | Dark | Notes |
|---|---|---|---|
| `background` | slate-50 | slate-900 | dark avoids pure black (OLED smear) |
| `foreground` | slate-900 | slate-50 | body text |
| `card` | `#FFFFFF` | `#1B2336` | raised surface |
| `card-foreground` | slate-900 | slate-50 | |
| `muted` | slate-100 | slate-800 | subtle fills |
| `muted-foreground` | slate-600 | slate-400 | secondary text |
| `border` | slate-200 | slate-700 | hairline dividers |
| `input` | slate-300 | slate-700 | form borders |
| `ring` | coral-500 | coral-500 | focus outline |
| `ink` | slate-900 | slate-950 | **neobrutalist border + hard shadow color** |
| `primary` | coral-600 `#C25E3D` | coral-500 `#D97757` | action fill |
| `primary-hover` | coral-700 | coral-400 | |
| `primary-foreground` | `#FFFFFF` | slate-900 | **per-mode — see 3.4** |
| `accent` | coral-500 | coral-500 | decorative / active glyph |
| `accent-soft` | coral-100 | coral-500 @18% | tinted backgrounds |
| `accent-foreground` | coral-700 | coral-300 | text on accent-soft |
| `link` | coral-700 | coral-300 | |
| `success` | green-600 | green-500 | "completed" |
| `success-soft` | `#DCFCE7` | green-500 @18% | |
| `success-on-soft` | green-700 | green-300 | text on success-soft |
| `success-foreground` | `#FFFFFF` | slate-900 | text on success fill |
| `destructive` | red-600 | red-500 | |
| `destructive-foreground` | `#FFFFFF` | slate-900 | |

### 3.4 The contrast decision (resolved)

Coral is mid-tone, so white text fails AA on brand coral in dark mode
(`#FFF` on `#D97757` ≈ 3.3:1). Resolution:

- **Light:** primary = coral-600 `#C25E3D` + **white** text → ~5:1 ✅
- **Dark:** primary = coral-500 `#D97757` + **dark** text (slate-900) → ~5.3:1 ✅

The CTA is therefore white-on-coral in light, dark-on-coral in dark. Both AA, both
unmistakably coral, both separate cleanly from their background.

### 3.5 Typography

- **Body / UI:** IBM Plex Sans (400/500/600/700).
- **Headings + code + labels:** JetBrains Mono (400/500/600/700) — the developer
  voice. Base layer applies mono to `h1–h6`, `code/pre/kbd`.
- Loaded via Google Fonts `<link>` with `preconnect` + `display=swap` (no npm dep).

Type scale (16px base):

| Role | Size | Line-height | Family / weight | Tracking |
|---|---|---|---|---|
| Display | 40px | 1.1 | Mono 600 | -0.02em |
| H1 | 32px | 1.2 | Mono 600 | -0.01em |
| H2 | 24px | 1.25 | Mono 600 | -0.01em |
| H3 | 20px | 1.3 | Mono 600 | normal |
| Body | 16px | 1.6 | Sans 400 | normal |
| Small | 14px | 1.5 | Sans 400 | normal |
| Label / eyebrow | 12px | 1.4 | Mono 500 UPPERCASE | +0.06em |
| Code | 14px | 1.5 | Mono 400 | normal |

### 3.6 Spacing, radius, elevation

- **Spacing:** Tailwind v4 default 4px scale (no override). Section rhythm tiers
  16 / 24 / 32 / 48.
- **Radius** → `rounded-control` 0.75rem · `rounded-card` 0.75rem · `rounded-pill`.
- **Soft elevation** → `shadow-card`, `shadow-elevated` (used for non-chunky
  surfaces like popovers/inputs later).
- **Hard elevation (neobrutalist)** → `shadow-hard` `5px 5px 0 0 ink`,
  `shadow-hard-lg` `7px 7px` (hover lift), `shadow-hard-sm` `2px 2px` (pressed /
  badges). `ink` resolves per mode.

### 3.7 Motion tokens (exposed, not yet wired)

- Durations: `--duration-fast 150ms` · `--duration-base 220ms` · `--duration-slow 320ms`.
- Easing: `--ease-out-soft cubic-bezier(.16,1,.3,1)` (enter) · `--ease-in-out-soft`.
- Rules: enter from below, exit ~30% faster, list stagger 30–50ms, full
  `prefers-reduced-motion` honoring (animations + theme transition collapse to ~0ms).
- **z-index scale:** base 0 · sticky 10 · sidebar 20 · overlay 40 · modal 100 · toast 1000.

## 4. Visual style — "chunky" / neobrutalist

The signature treatment, applied to **Buttons, Cards, and Badges** for one coherent
visual language:

- **Border:** 2px solid `ink`.
- **Hard offset shadow:** solid, no blur, color = `ink`.
- **Generous radius** (`rounded-control` / `rounded-card`).
- **Press behavior:** element translates down-right into its shadow via `transform`
  (no layout reflow); shadow shrinks. Hover lifts (shadow grows, slight up-left
  translate).

Dark-mode `ink` is slate-950 so the offset block still reads against the dark
background; final value verified visually in-browser and tuned if needed.

## 5. Token architecture (implementation shape)

`src/styles/index.css`, in order:

1. `@import "tailwindcss";` + `@custom-variant dark`.
2. **Primitives** in `:root` (`--ccc-coral-*`, `--ccc-green-*`, `--ccc-slate-*`, …).
3. **Semantic light** in `:root` (`--background`, `--primary`, `--ink`, …).
4. **Semantic dark** in `.dark` (overrides).
5. `@theme inline { … }` mapping semantics → Tailwind utilities (`--color-*`,
   `--font-*`, `--radius-*`, `--shadow-*`). `inline` keeps the live `var()` so
   utilities react to `.dark`.
6. Motion + z-index vars in `:root`.
7. `@layer base` — `*` border-color, body font/size/line-height, mono headings,
   global `:focus-visible` (2px coral), `::selection`, theme-transition (guarded by
   reduced-motion), and a reduced-motion kill-switch.

## 6. Components

Each is one focused file, token-driven, independently testable.

### 6.1 `Button` — `src/components/ui/Button.tsx`

- **Props:** `variant` (`primary` | `secondary` | `destructive` | `ghost`),
  `size` (`sm` | `md` | `icon`), `loading`, `leadingIcon`, `trailingIcon`,
  plus native button attributes; `forwardRef`.
- **Chunky variants** (`primary`/`secondary`/`destructive`): `border-2 border-ink`
  + `shadow-hard`, hover → `shadow-hard-lg` + 1px lift, active → `shadow-hard-sm` +
  4px sink. `ghost` is flat (no border/shadow, hover `bg-muted`) for header chrome.
- **Colors:** primary = coral fill; secondary = `bg-card`; destructive = red.
- **States:** `cursor-pointer`; `disabled` → opacity-50 + no pointer events + no
  shadow/translate; `loading` → inline spinner SVG + disabled.
- **Sizes:** `sm` h-9, `md` h-11 (44px touch target), `icon` 44×44.
- Exposes `data-variant` / `data-size` for testability.

### 6.2 `Card` — `src/components/ui/Card.tsx`

- `bg-card text-card-foreground border-2 border-ink rounded-card shadow-hard`,
  default padding, optional `interactive` (hover lift + cursor).

### 6.3 `Badge` — `src/components/ui/Badge.tsx`

- Tones: `neutral` (muted), `brand` (accent-soft / accent-foreground),
  `success` (success-soft / success-on-soft). Mono uppercase 12px,
  `border-2 border-ink rounded-pill shadow-hard-sm`. For level/status tags.

### 6.4 `ProgressGlyph` — `src/components/shell/ProgressGlyph.tsx`

- **Inline SVG, not emoji.** `completed` ✓ (green fill + check),
  `current` ● (coral dot + ring), `unvisited` ○ (muted outline). Distinct **shapes**
  (not color alone); `role="img"` + descriptive `aria-label` per status.

### 6.5 Shared helper — `src/lib/cn.ts`

- Minimal `cn(...parts)` class-name joiner (filters falsy, joins). No new dep.

## 7. Refactors to existing code

- **`App.tsx`** — shell swaps hard-coded `slate-*` for semantic utilities
  (`bg-background text-foreground`, `border-border`); brand title in mono.
- **`ThemeToggle`** — replaced emoji (☀️/🌙) with inline SVG sun/moon; rendered as
  a `ghost` `icon` Button; keeps `aria-label`.

## 8. Documentation

- **`design-system/MASTER.md`** — persistent source of truth: principles, token
  tables (this spec's §3), type scale, chunky-style rules, primitive usage, and a
  contributor checklist. `design-system/pages/` folder reserved for per-page
  overrides (hierarchical retrieval pattern).
- Short pointer added to `CLAUDE.md` under a "Design system" note.

## 9. Testing

Vitest + React Testing Library (existing convention; co-located `*.test.tsx`).

- **`Button.test.tsx`** — renders children; `data-variant`/`data-size` reflect
  props; `disabled` blocks `onClick`; `loading` shows spinner + disables; click
  fires handler.
- **`ProgressGlyph.test.tsx`** — correct `aria-label` per status; renders an
  `img`-role element.
- Existing suite (`App.test.tsx`, theme/context tests, resolver tests) must still
  pass; `npm run build` (type-check) must stay green.

**Not testing:** exact Tailwind class strings, shadow pixel values, animation
timings (judgment calls, spot-checked in-browser via Chrome MCP).

## 10. Verification

- `npm run lint` → `npm run build` → `npm test` all green.
- Visual spot-check in-browser (Chrome MCP) in **both** light and dark: button
  hover/press, card depth, badge tones, glyph states, focus ring, dark-mode `ink`
  offset legibility, theme-transition with reduced-motion on.

## 11. Open items (deferred, not blocking)

- Final dark-mode `ink` value (tune in-browser).
- Whether button labels use IBM Plex Sans 700 (default) or JetBrains Mono 600 —
  decided visually during verification.
- Restyling `Snippet` / `TryPrompt` / `WhenLang` to the chunky language (separate effort).

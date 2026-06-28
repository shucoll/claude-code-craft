# Claude Code Craft — Design System (MASTER)

Single source of truth for visual design. Spec:
`docs/superpowers/specs/2026-06-28-design-system-design.md`.
Page-specific overrides (if any) live in `design-system/pages/<page>.md` and take
precedence over this file for that page.

## Principles

- **Token-driven.** Consume semantic tokens only (`bg-background`, `text-primary`,
  `border-ink`). Never use raw hex or `--ccc-*` primitives in components.
- **Light + dark in parallel.** Each mode has its own values; contrast verified
  per mode (AA: 4.5:1 text, 3:1 UI/large).
- **Tailwind v4 CSS-first.** All tokens in `src/styles/index.css`. No config file.
- **Developer voice.** Mono headings, coral brand, restrained motion.

## Color roles

- **Coral `#D97757`** — brand, primary actions, active/current, focus, links.
- **Green `#22C55E`** — success / "completed" ONLY. Never a generic accent.
- **Slate** — neutral ramp.

## Semantic tokens

| Token | Light | Dark |
|---|---|---|
| `background` | slate-50 | slate-900 |
| `foreground` | slate-900 | slate-50 |
| `card` / `card-foreground` | #FFFFFF / slate-900 | #1B2336 / slate-50 |
| `muted` / `muted-foreground` | slate-100 / slate-600 | slate-800 / slate-400 |
| `border` / `input` | slate-200 / slate-300 | slate-700 / slate-700 |
| `ring` | coral-500 | coral-500 |
| `ink` (border + hard shadow) | slate-900 | slate-200 (light ink — reads on the near-black dark bg) |
| `primary` / `primary-foreground` | coral-600 / white | coral-500 / slate-900 |
| `primary-hover` | coral-700 | coral-400 |
| `accent` / `accent-soft` / `accent-foreground` | coral-500 / coral-100 / coral-700 | coral-500 / coral-500@18% / coral-300 |
| `link` | coral-700 | coral-300 |
| `success` / `success-soft` / `success-on-soft` / `success-foreground` | green-600 / #DCFCE7 / green-700 / white | green-500 / green-500@18% / green-300 / slate-900 |
| `destructive` / `destructive-foreground` | red-600 / white | red-500 / slate-900 |

**Contrast note:** coral is mid-tone — CTA text is white-on-coral in light,
dark-on-coral in dark. Both AA.

## Typography

- Body / UI: **IBM Plex Sans** (`font-sans`), 400/500/600/700.
- Headings, code, labels: **JetBrains Mono** (`font-mono`), 400/500/600/700.
- Scale (16px base): Display 40 · H1 32 · H2 24 · H3 20 · Body 16 · Small 14 ·
  Label 12 (mono uppercase +tracking) · Code 14.

## Radius, elevation, motion

- Radius: `rounded-control` / `rounded-card` (0.75rem) · `rounded-pill`.
- Soft: `shadow-card`, `shadow-elevated` (popovers/inputs).
- Hard (chunky): `shadow-hard` (5px), `shadow-hard-lg` (7px hover), `shadow-hard-sm`
  (2px badges/pressed). Color = `ink`.
- Motion: `--duration-fast/base/slow` (150/220/320ms); `--ease-out-soft`
  (enter), `--ease-in-out-soft`. `prefers-reduced-motion` fully honored.
- z-index: base 0 · sticky 10 · sidebar 20 · overlay 40 · modal 100 · toast 1000.

## "Chunky" style (Button / Card / Badge)

- `border-2 border-ink` + solid offset `shadow-hard`.
- Press: element translates into its shadow (`transform`, no reflow); shadow shrinks.
- Hover: lifts (shadow grows, slight up-left translate).

## Primitives (`src/components/ui/`, `src/components/shell/`)

- `Button` — variants `primary | secondary | destructive | ghost`; sizes
  `sm | md | icon`; `loading`, `leadingIcon`, `trailingIcon`.
- `Card` — chunky surface; `interactive` for hover lift.
- `Badge` — tones `neutral | brand | success`; mono uppercase pill.
- `ProgressGlyph` — SVG `completed | current | unvisited`; distinct shapes +
  `aria-label` (never color alone).

## Contributor checklist

- [ ] Semantic tokens only (no raw hex / `--ccc-*` in components).
- [ ] Green only for success; coral for brand/actions.
- [ ] No emoji icons — inline SVG.
- [ ] Both light and dark verified.
- [ ] `cursor-pointer` + visible focus on interactive elements.
- [ ] Touch targets ≥ 44px (`size="md"`/`icon`).
- [ ] `prefers-reduced-motion` respected.

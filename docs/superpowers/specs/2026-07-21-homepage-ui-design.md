# Homepage UI — design

Builds the visual homepage on top of the wiring from
`2026-07-21-homepage-wiring-design.md` (route `/homepage`, root redirect flip,
smart-resolve CTA target). This spec covers the UI only.

## Voice & system

Uses the **existing** design system unchanged (`design-system/MASTER.md`):

- Coral brand; green reserved for success. Semantic tokens only — no raw hex / `--ccc-*`.
- "Chunky" style: `border-2 border-ink` + hard offset shadow on `Button` / `Card` / `Badge`.
- JetBrains Mono headings/labels, IBM Plex Sans body.
- Light + dark in parallel; `prefers-reduced-motion` honored; touch targets ≥ 44px.
- Copy tone: **confident & practical** — developer-to-developer, benefit-led, no hype.

Reuses existing primitives: `Button`, `Card`, `Badge`, `ThemeToggle`, `useTheme`,
`resolveLandingPath`, `isOnboarded` / `getLastLesson`, `useLevel`.

## Structure (top → bottom)

### 1. Header — `HomeHeader`
Sticky, minimal top bar (not the full app shell). `Claude Code Craft` mono wordmark
on the left; `ThemeToggle` on the right. Transparent over the hero, gains a subtle
`bg-background`/border as the page scrolls. The compact `EnterButton` is **hidden until
the user scrolls past the hero** — it fades in with the solid header so the hero's own
CTA stays the single above-the-fold entry point.

### 2. Hero — `Hero`
Two-column on desktop (`lg`), stacked on mobile.
- **Left:** display headline ("Master Claude Code, lesson by lesson."), a one/two-line
  subhead, the primary `EnterButton`, and a small "no signup — runs in your browser" line.
- **Right:** `FauxTerminal` — a static, on-brand mock of a Claude Code exchange (chunky
  frame, mono type, coral prompt, `●` status bullets). Lines reveal with a subtle
  staggered fade on load; reduced-motion shows all lines immediately.

### 3. What you'll learn — `WhatYoullLearn`
Four chunky `Card` pillars (1-col mobile → 2-col `sm` → 4-col `lg`):
1. Hands-on, in-browser lessons — nothing to install to start.
2. Real workflows — skills · hooks · MCP, and when to use them.
3. **Interactive charts & diagrams** that make concepts click.
4. Project-based milestones; pick-your-language snippets noted here.

Each pillar: inline SVG icon (no emoji), mono label, short body.

### 4. The 3 pathways — `Pathways`
Beginner / Intermediate / Advanced as cards (1-col → 3-col `lg`), reusing extracted
level metadata. Advanced carries a `Coming Soon` `Badge` and reduced emphasis. Each card
is a soft entry point (routes into onboarding at that level; Advanced non-interactive).

### 5. How it works — `HowItWorks`
A 3-step strip (1-col → 3-col): **choose your level → pick your language → learn by doing.**
Numbered, mono, conveying the interactive / no-signup nature.

Followed by a **closing CTA band**: a short line ("Ready? Pick your level and start.")
plus the `EnterButton` — the second, bottom-of-page conversion point after the hero.

### 6. Footer — `HomeFooter`
Wordmark, one-line tagline, a "built with Claude Code" nod. Minimal.

## Shared CTA — `EnterButton`
A small wrapper over `Button` (rendered as a router `Link`) that:
- computes its destination via
  `resolveLandingPath(curriculum, { onboarded: isOnboarded(), level, lastLesson: getLastLesson() })`
  (falls back to `/onboarding`),
- adapts its label: **"Get started"** when not onboarded, **"Continue learning"** when onboarded.

Used in the header, hero, and closing CTA band so the entry logic lives in one place.

## Level metadata extraction
The level id/label/description/`comingSoon` data currently lives inline in
`LevelScreen.tsx`. Extract it to `src/content/levelsMeta.ts` and have **both** `LevelScreen`
and `Pathways` consume it — no behavior change to onboarding. (Pathway cards may show a
shorter framing; the canonical descriptions stay shared.)

## File layout (one responsibility per file)
```
src/pages/HomePage.tsx              // composes the sections
src/components/home/
  HomeHeader.tsx
  Hero.tsx
  FauxTerminal.tsx
  EnterButton.tsx
  WhatYoullLearn.tsx
  Pathways.tsx
  HowItWorks.tsx
  HomeFooter.tsx
  homeContent.ts                    // copy + pillar/step data
src/content/levelsMeta.ts           // extracted level metadata
```

## Responsive / a11y / motion
- Mobile-first; single column collapsing to multi-col grids at `sm`/`lg`. Sections centered
  at `max-w-6xl` with consistent gutters. No horizontal scroll at 375px.
- Semantic heading hierarchy (h1 hero → h2 per section). Landmarks: `header`, `main`, `footer`.
- One primary-emphasis CTA per viewport; secondary actions visually subordinate.
- Visible focus rings, `cursor-pointer`, icon buttons labelled. AA contrast in both themes.
- Framer-motion entrances match onboarding's easing/opacity; terminal + section reveals
  respect `prefers-reduced-motion` (no motion → final state shown).

## Testing
- `EnterButton`: correct `href` and label for onboarded vs not-onboarded state.
- `HomePage`: renders each section's heading/landmark; header + closing CTA present.
- `levelsMeta` extraction: existing `LevelScreen` tests stay green (no behavior change).

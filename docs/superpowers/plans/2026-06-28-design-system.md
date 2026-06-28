# Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish Claude Code Craft's design system — semantic tokens (light + dark) wired into Tailwind v4, fonts, and a set of token-driven "chunky" neobrutalist primitives (Button, Card, Badge, ProgressGlyph) — plus docs.

**Architecture:** Three-layer tokens in `src/styles/index.css` (primitives → semantic light/dark → `@theme inline` mapping to utilities). Primitives consume only semantic utilities (`bg-primary`, `border-ink`, `shadow-hard`). Brand = coral; green reserved for success. Signature style = ink border + solid offset shadow that the element presses into on click.

**Tech Stack:** Vite + React 19 + TypeScript (strict), Tailwind CSS v4 (CSS-first, no config file), Vitest + React Testing Library (jsdom). No new runtime dependencies.

## Global Constraints

- TypeScript strict; **no `any`** in committed code.
- Tailwind v4 CSS-first: `@import "tailwindcss"` + `@custom-variant`; **no `tailwind.config.js`**.
- Dark mode = `dark` class on `<html>`; never inline-toggle styles.
- Components consume **semantic tokens only** — never raw hex or `--ccc-*` primitives.
- **No emoji as structural icons** — inline SVG only.
- **No new npm dependencies** (fonts via `<link>`, icons inline SVG, no `clsx`/`lucide-react`).
- One responsibility per file; keep files small.
- Branch: `feat/design-system` (already created).
- Per-mode CTA contrast: light primary = coral-600 + white text; dark primary = coral-500 + dark text.

---

### Task 1: Design tokens + font loading (foundation)

**Files:**
- Modify: `src/styles/index.css` (replace entire file)
- Modify: `index.html` (add font links to `<head>`)

**Interfaces:**
- Consumes: nothing.
- Produces: Tailwind utilities `bg-background` `text-foreground` `bg-card` `text-card-foreground` `bg-muted` `text-muted-foreground` `border-border` `border-input` `border-ink` `ring-ring` `bg-primary` `text-primary-foreground` `bg-primary-hover` `bg-accent` `bg-accent-soft` `text-accent-foreground` `text-link` `bg-success` `bg-success-soft` `text-success-on-soft` `text-success-foreground` `fill-success` `fill-accent` `stroke-accent` `stroke-muted-foreground` `bg-destructive` `text-destructive-foreground`; radii `rounded-control` `rounded-card` `rounded-pill`; shadows `shadow-card` `shadow-elevated` `shadow-hard` `shadow-hard-sm` `shadow-hard-lg`; fonts `font-sans` `font-mono`; CSS vars `--ease-out-soft` `--success-foreground` etc.

- [ ] **Step 1: Replace `src/styles/index.css` with the full token system**

```css
@import "tailwindcss";

/* ─────────────────────────────────────────────────────────────────────────
   Claude Code Craft — Design System
   Tailwind v4, CSS-first. No tailwind.config.js.
   Layers: primitives → semantic tokens (light + .dark) → @theme mapping.
   See design-system/MASTER.md for rationale and usage rules.
   ───────────────────────────────────────────────────────────────────────── */

/* Class-based dark mode (Tailwind v4 CSS-first). */
@custom-variant dark (&:where(.dark, .dark *));

/* ── 1. Primitive palettes (mode-independent). Never used directly. ──────── */
:root {
  --ccc-coral-50: #fcf3ef;
  --ccc-coral-100: #f8e3d9;
  --ccc-coral-200: #f1c9b6;
  --ccc-coral-300: #e8ac92;
  --ccc-coral-400: #df8e6e;
  --ccc-coral-500: #d97757; /* brand base */
  --ccc-coral-600: #c25e3d; /* fill on light / hover */
  --ccc-coral-700: #a04a2e;
  --ccc-coral-800: #7e3a24;
  --ccc-coral-900: #5c2a1a;

  --ccc-green-300: #86efac;
  --ccc-green-400: #4ade80;
  --ccc-green-500: #22c55e;
  --ccc-green-600: #16a34a;
  --ccc-green-700: #15803d;

  --ccc-red-500: #ef4444;
  --ccc-red-600: #dc2626;

  --ccc-slate-50: #f8fafc;
  --ccc-slate-100: #f1f5f9;
  --ccc-slate-200: #e2e8f0;
  --ccc-slate-300: #cbd5e1;
  --ccc-slate-400: #94a3b8;
  --ccc-slate-500: #64748b;
  --ccc-slate-600: #475569;
  --ccc-slate-700: #334155;
  --ccc-slate-800: #1e293b;
  --ccc-slate-900: #0f172a;
  --ccc-slate-950: #020617;
}

/* ── 2. Semantic tokens — LIGHT (default) ─────────────────────────────────*/
:root {
  color-scheme: light;

  --background: var(--ccc-slate-50);
  --foreground: var(--ccc-slate-900);

  --card: #ffffff;
  --card-foreground: var(--ccc-slate-900);

  --muted: var(--ccc-slate-100);
  --muted-foreground: var(--ccc-slate-600);

  --border: var(--ccc-slate-200);
  --input: var(--ccc-slate-300);
  --ring: var(--ccc-coral-500);

  /* Neobrutalist border + hard offset shadow color. */
  --ink: var(--ccc-slate-900);

  --primary: var(--ccc-coral-600);
  --primary-hover: var(--ccc-coral-700);
  --primary-foreground: #ffffff;

  --accent: var(--ccc-coral-500);
  --accent-soft: var(--ccc-coral-100);
  --accent-foreground: var(--ccc-coral-700);

  --link: var(--ccc-coral-700);

  --success: var(--ccc-green-600);
  --success-soft: #dcfce7;
  --success-on-soft: var(--ccc-green-700);
  --success-foreground: #ffffff;

  --destructive: var(--ccc-red-600);
  --destructive-foreground: #ffffff;
}

/* ── 3. Semantic tokens — DARK (override) ─────────────────────────────────*/
.dark {
  color-scheme: dark;

  --background: var(--ccc-slate-900);
  --foreground: var(--ccc-slate-50);

  --card: #1b2336;
  --card-foreground: var(--ccc-slate-50);

  --muted: var(--ccc-slate-800);
  --muted-foreground: var(--ccc-slate-400);

  --border: var(--ccc-slate-700);
  --input: var(--ccc-slate-700);
  --ring: var(--ccc-coral-500);

  --ink: var(--ccc-slate-950);

  --primary: var(--ccc-coral-500);
  --primary-hover: var(--ccc-coral-400);
  --primary-foreground: var(--ccc-slate-900);

  --accent: var(--ccc-coral-500);
  --accent-soft: color-mix(in srgb, var(--ccc-coral-500) 18%, transparent);
  --accent-foreground: var(--ccc-coral-300);

  --link: var(--ccc-coral-300);

  --success: var(--ccc-green-500);
  --success-soft: color-mix(in srgb, var(--ccc-green-500) 18%, transparent);
  --success-on-soft: var(--ccc-green-300);
  --success-foreground: var(--ccc-slate-900);

  --destructive: var(--ccc-red-500);
  --destructive-foreground: var(--ccc-slate-900);
}

/* ── 4. Map semantic tokens → Tailwind utilities (react to .dark) ─────────*/
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-ink: var(--ink);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-accent-foreground: var(--accent-foreground);
  --color-link: var(--link);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-success-on-soft: var(--success-on-soft);
  --color-success-foreground: var(--success-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);

  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", "Menlo", monospace;

  --radius-control: 0.75rem;
  --radius-card: 0.75rem;
  --radius-pill: 9999px;

  --shadow-card: 0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.06);
  --shadow-elevated: 0 8px 24px rgb(15 23 42 / 0.12);
  --shadow-hard: 5px 5px 0 0 var(--ink);
  --shadow-hard-sm: 2px 2px 0 0 var(--ink);
  --shadow-hard-lg: 7px 7px 0 0 var(--ink);
}

/* ── 5. Motion + z-index tokens ───────────────────────────────────────────*/
:root {
  --duration-fast: 150ms;
  --duration-base: 220ms;
  --duration-slow: 320ms;
  --ease-out-soft: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-soft: cubic-bezier(0.65, 0, 0.35, 1);

  --z-base: 0;
  --z-sticky: 10;
  --z-sidebar: 20;
  --z-overlay: 40;
  --z-modal: 100;
  --z-toast: 1000;
}

/* ── 6. Base layer ────────────────────────────────────────────────────────*/
@layer base {
  * {
    border-color: var(--border);
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-mono);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.01em;
    text-wrap: balance;
  }

  code, kbd, pre, samp {
    font-family: var(--font-mono);
  }

  a {
    color: var(--link);
  }

  :focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
    border-radius: 2px;
  }

  ::selection {
    background-color: color-mix(in srgb, var(--accent) 30%, transparent);
  }

  @media (prefers-reduced-motion: no-preference) {
    body {
      transition:
        background-color var(--duration-base) var(--ease-out-soft),
        color var(--duration-base) var(--ease-out-soft);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

- [ ] **Step 2: Add font links to `index.html`**

Insert these three lines inside `<head>`, immediately after the `<meta name="viewport" ... />` line:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
    />
```

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`
Expected: PASS (no TypeScript or CSS errors).

- [ ] **Step 4: Verify the existing test suite still passes**

Run: `npm test`
Expected: PASS (token changes don't break logic/component tests).

- [ ] **Step 5: Commit**

```bash
git add src/styles/index.css index.html
git commit -m "feat(design-system): add semantic tokens (light+dark) and fonts"
```

---

### Task 2: `cn` class-name helper

**Files:**
- Create: `src/lib/cn.ts`
- Test: `src/lib/cn.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `cn(...parts: ClassValue[]): string` where `type ClassValue = string | number | null | undefined | false`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins truthy class names with single spaces', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- cn`
Expected: FAIL (`Cannot find module './cn'`).

- [ ] **Step 3: Write minimal implementation**

```ts
export type ClassValue = string | number | null | undefined | false

export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- cn`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cn.ts src/lib/cn.test.ts
git commit -m "feat(design-system): add cn class-name helper"
```

---

### Task 3: `Button` primitive

**Files:**
- Create: `src/components/ui/Button.tsx`
- Test: `src/components/ui/Button.test.tsx`

**Interfaces:**
- Consumes: `cn` from `src/lib/cn`.
- Produces: `Button` (forwardRef) + `ButtonProps`. Props: `variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'` (default `'primary'`), `size?: 'sm' | 'md' | 'icon'` (default `'md'`), `loading?: boolean`, `leadingIcon?: ReactNode`, `trailingIcon?: ReactNode`, plus all native button attrs. Renders `data-variant` and `data-size` attributes.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Start Learning</Button>)
    expect(screen.getByRole('button', { name: 'Start Learning' })).toBeInTheDocument()
  })

  it('reflects variant and size via data attributes', () => {
    render(
      <Button variant="secondary" size="sm">
        Browse
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Browse' })
    expect(btn).toHaveAttribute('data-variant', 'secondary')
    expect(btn).toHaveAttribute('data-size', 'sm')
  })

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('shows a spinner and disables while loading', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn.querySelector('svg')).toBeTruthy()
  })

  it('fires onClick when enabled', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Click' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Button`
Expected: FAIL (`Cannot find module './Button'`).

- [ ] **Step 3: Write the implementation**

```tsx
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost'
type Size = 'sm' | 'md' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const base = cn(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap',
  'font-sans font-bold select-none cursor-pointer rounded-control',
  'transition-[transform,box-shadow,background-color] duration-150 ease-[var(--ease-out-soft)]',
  'disabled:pointer-events-none disabled:opacity-50',
)

const chunky = cn(
  'border-2 border-ink shadow-hard',
  'hover:shadow-hard-lg hover:-translate-x-px hover:-translate-y-px',
  'active:shadow-hard-sm active:translate-x-1 active:translate-y-1',
  'disabled:shadow-hard disabled:translate-x-0 disabled:translate-y-0',
)

const variants: Record<Variant, string> = {
  primary: cn(chunky, 'bg-primary text-primary-foreground hover:bg-primary-hover'),
  secondary: cn(chunky, 'bg-card text-card-foreground hover:bg-muted'),
  destructive: cn(chunky, 'bg-destructive text-destructive-foreground'),
  ghost: 'border-2 border-transparent bg-transparent text-foreground hover:bg-muted',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base',
  icon: 'h-11 w-11 p-0',
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    disabled,
    children,
    className,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  )
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Button`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ui/Button.test.tsx
git commit -m "feat(design-system): add chunky Button primitive"
```

---

### Task 4: `Card` primitive

**Files:**
- Create: `src/components/ui/Card.tsx`
- Test: `src/components/ui/Card.test.tsx`

**Interfaces:**
- Consumes: `cn` from `src/lib/cn`.
- Produces: `Card` (forwardRef) + `CardProps`. Props: `interactive?: boolean` (default `false`) plus native div attrs.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>Body</Card>)
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('adds an interactive affordance only when interactive', () => {
    const { rerender } = render(<Card data-testid="c">x</Card>)
    expect(screen.getByTestId('c').className).not.toContain('cursor-pointer')
    rerender(
      <Card data-testid="c" interactive>
        x
      </Card>,
    )
    expect(screen.getByTestId('c').className).toContain('cursor-pointer')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Card`
Expected: FAIL (`Cannot find module './Card'`).

- [ ] **Step 3: Write the implementation**

```tsx
import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-card text-card-foreground border-2 border-ink rounded-card shadow-hard p-5',
        interactive &&
          cn(
            'cursor-pointer transition-[transform,box-shadow] duration-150 ease-[var(--ease-out-soft)]',
            'hover:shadow-hard-lg hover:-translate-x-px hover:-translate-y-px',
          ),
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Card`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Card.tsx src/components/ui/Card.test.tsx
git commit -m "feat(design-system): add chunky Card primitive"
```

---

### Task 5: `Badge` primitive

**Files:**
- Create: `src/components/ui/Badge.tsx`
- Test: `src/components/ui/Badge.test.tsx`

**Interfaces:**
- Consumes: `cn` from `src/lib/cn`.
- Produces: `Badge` + `BadgeProps`. Props: `tone?: 'neutral' | 'brand' | 'success'` (default `'neutral'`) plus native span attrs. Renders `data-tone`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge>Beginner</Badge>)
    expect(screen.getByText('Beginner')).toBeInTheDocument()
  })

  it('exposes the tone via a data attribute', () => {
    render(<Badge tone="success">Done</Badge>)
    expect(screen.getByText('Done')).toHaveAttribute('data-tone', 'success')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Badge`
Expected: FAIL (`Cannot find module './Badge'`).

- [ ] **Step 3: Write the implementation**

```tsx
import { type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'brand' | 'success'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground',
  brand: 'bg-accent-soft text-accent-foreground',
  success: 'bg-success-soft text-success-on-soft',
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1 border-2 border-ink rounded-pill shadow-hard-sm',
        'px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Badge`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Badge.tsx src/components/ui/Badge.test.tsx
git commit -m "feat(design-system): add chunky Badge primitive"
```

---

### Task 6: `ProgressGlyph` (SVG lesson-status indicator)

**Files:**
- Create: `src/components/shell/ProgressGlyph.tsx`
- Test: `src/components/shell/ProgressGlyph.test.tsx`

**Interfaces:**
- Consumes: `cn` from `src/lib/cn`.
- Produces: `ProgressGlyph` + `LessonStatus = 'completed' | 'current' | 'unvisited'`. Props: `status: LessonStatus`, `className?: string`. Renders `role="img"` with `aria-label` (`'Completed'` | `'Current lesson'` | `'Not started'`).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressGlyph } from './ProgressGlyph'

describe('ProgressGlyph', () => {
  it('labels the completed state', () => {
    render(<ProgressGlyph status="completed" />)
    expect(screen.getByRole('img', { name: 'Completed' })).toBeInTheDocument()
  })

  it('labels the current state', () => {
    render(<ProgressGlyph status="current" />)
    expect(screen.getByRole('img', { name: 'Current lesson' })).toBeInTheDocument()
  })

  it('labels the unvisited state', () => {
    render(<ProgressGlyph status="unvisited" />)
    expect(screen.getByRole('img', { name: 'Not started' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ProgressGlyph`
Expected: FAIL (`Cannot find module './ProgressGlyph'`).

- [ ] **Step 3: Write the implementation**

```tsx
import { cn } from '../../lib/cn'

export type LessonStatus = 'completed' | 'current' | 'unvisited'

const labels: Record<LessonStatus, string> = {
  completed: 'Completed',
  current: 'Current lesson',
  unvisited: 'Not started',
}

export function ProgressGlyph({
  status,
  className,
}: {
  status: LessonStatus
  className?: string
}) {
  return (
    <svg
      role="img"
      aria-label={labels[status]}
      viewBox="0 0 16 16"
      fill="none"
      className={cn('h-4 w-4 shrink-0', className)}
    >
      {status === 'completed' && (
        <>
          <circle cx="8" cy="8" r="7" className="fill-success" />
          <path
            d="M5 8.5l2 2 4-4.5"
            stroke="var(--success-foreground)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {status === 'current' && (
        <>
          <circle cx="8" cy="8" r="7" className="stroke-accent" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="3" className="fill-accent" />
        </>
      )}
      {status === 'unvisited' && (
        <circle cx="8" cy="8" r="6.5" className="stroke-muted-foreground" strokeWidth="1.5" />
      )}
    </svg>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ProgressGlyph`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/ProgressGlyph.tsx src/components/shell/ProgressGlyph.test.tsx
git commit -m "feat(design-system): add ProgressGlyph status indicator"
```

---

### Task 7: `ui` barrel + refactor shell to tokens + SVG ThemeToggle

**Files:**
- Create: `src/components/ui/index.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/shell/ThemeToggle.tsx`
- Modify: `src/components/shell/ThemeToggle.test.tsx`

**Interfaces:**
- Consumes: `Button` from `src/components/ui/Button`, `useTheme` from `src/context/ThemeContext`.
- Produces: barrel re-exports `Button`/`ButtonProps`, `Card`/`CardProps`, `Badge`/`BadgeProps`.

- [ ] **Step 1: Create the `ui` barrel**

```ts
export { Button } from './Button'
export type { ButtonProps } from './Button'
export { Card } from './Card'
export type { CardProps } from './Card'
export { Badge } from './Badge'
export type { BadgeProps } from './Badge'
```

- [ ] **Step 2: Read the current ThemeToggle test**

Run: `cat src/components/shell/ThemeToggle.test.tsx`
Note any assertions referencing emoji text (`☀️`, `🌙`, `'Light'`, `'Dark'`) — these will be replaced in Step 4.

- [ ] **Step 3: Replace `ThemeToggle.tsx` with SVG + Button**

```tsx
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../ui/Button'

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
```

- [ ] **Step 4: Replace `ThemeToggle.test.tsx` with a behavior test (no emoji assertions)**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../../context/ThemeContext'
import { ThemeToggle } from './ThemeToggle'

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle', () => {
  it('renders an accessible toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: /switch to (light|dark) theme/i })).toBeInTheDocument()
  })

  it('toggles the document theme class on click', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    const startedDark = document.documentElement.classList.contains('dark')
    await userEvent.click(screen.getByRole('button'))
    expect(document.documentElement.classList.contains('dark')).toBe(!startedDark)
  })
})
```

- [ ] **Step 5: Refactor the shell in `App.tsx`**

Replace the shell `<div>` and `<header>` (lines 22-26) so they use semantic tokens:

```tsx
            <div className="min-h-screen bg-background text-foreground">
              <header className="flex items-center justify-between border-b border-border p-4">
                <span className="font-mono font-bold">Claude Code Craft</span>
                <ThemeToggle />
              </header>
```

Leave the rest of `App.tsx` (providers, routes, `RootRedirect`) unchanged.

- [ ] **Step 6: Run the full test suite and build**

Run: `npm test`
Expected: PASS (all suites, including updated ThemeToggle).

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/index.ts src/App.tsx src/components/shell/ThemeToggle.tsx src/components/shell/ThemeToggle.test.tsx
git commit -m "feat(design-system): tokenize shell and replace emoji ThemeToggle with SVG"
```

---

### Task 8: Documentation — MASTER.md + CLAUDE.md pointer

**Files:**
- Create: `design-system/MASTER.md`
- Create: `design-system/pages/.gitkeep`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: nothing.
- Produces: persistent design-system reference.

- [ ] **Step 1: Create `design-system/MASTER.md`**

```markdown
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
| `ink` (border + hard shadow) | slate-900 | slate-950 |
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
```

- [ ] **Step 2: Create the pages override folder placeholder**

Run: `mkdir -p design-system/pages && printf '' > design-system/pages/.gitkeep`

- [ ] **Step 3: Add a Design system pointer to `CLAUDE.md`**

Insert this section immediately after the `## Conventions` block (before `## Load-bearing invariants (later phases)`):

```markdown
## Design system
- Tokens, type scale, and primitives: `design-system/MASTER.md`. Spec:
  `docs/superpowers/specs/2026-06-28-design-system-design.md`.
- Consume **semantic tokens only** (`bg-background`, `text-primary`, `border-ink`) —
  never raw hex or `--ccc-*` primitives.
- Brand = coral; green is reserved for success/completed. "Chunky" style (ink
  border + hard offset shadow) on `Button`/`Card`/`Badge` in `src/components/ui/`.
```

- [ ] **Step 4: Commit**

```bash
git add design-system/MASTER.md design-system/pages/.gitkeep CLAUDE.md
git commit -m "docs(design-system): add MASTER reference and CLAUDE.md pointer"
```

---

### Task 9: Final verification (lint, build, test, visual)

**Files:** none (verification only).

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: PASS (no errors).

- [ ] **Step 2: Type-check + build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Full test run**

Run: `npm test`
Expected: PASS (all suites).

- [ ] **Step 4: Visual spot-check (Chrome MCP)**

Run: `npm run dev`, open the app, and verify in **both** light and dark:
- Primary Button is coral; hover lifts; click presses into the shadow.
- Secondary/destructive/ghost variants render correctly.
- Card depth and Badge tones read well.
- `ProgressGlyph` shows distinct ✓ / ● / ○ shapes.
- Focus ring is the coral outline; dark-mode `ink` offset block is legible.
- Theme transition is smooth; with OS reduced-motion on, transitions are off.

If the dark-mode `ink` offset looks too subtle, tune `--ink` in `.dark`
(`src/styles/index.css`) and re-check. Commit any tweak:

```bash
git add src/styles/index.css
git commit -m "fix(design-system): tune dark-mode ink offset legibility"
```

---

## Self-Review

**Spec coverage:** §3 tokens → Task 1; §3.5 typography/fonts → Task 1; §4 chunky
style → Tasks 3–5; §5 token architecture → Task 1; §6.1 Button → Task 3; §6.2 Card →
Task 4; §6.3 Badge → Task 5; §6.4 ProgressGlyph → Task 6; §6.5 cn → Task 2; §7
refactors → Task 7; §8 docs → Task 8; §9 testing → Tasks 2–7; §10 verification →
Task 9. No gaps.

**Placeholder scan:** none — every code/step contains complete content.

**Type consistency:** `cn`/`ClassValue` (Task 2) used unchanged in Tasks 3–6;
`Button` props/`data-*` (Task 3) consumed by ThemeToggle (Task 7) and tests;
`LessonStatus` labels (Task 6) match the test assertions; token utility names in
Task 1 match every consumer.

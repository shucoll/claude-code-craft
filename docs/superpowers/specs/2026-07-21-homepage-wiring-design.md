# Homepage wiring — design

## Goal

Introduce a public homepage at `/homepage` and change the *root* entry behavior so
first-time (un-onboarded) visitors land on the homepage instead of jumping straight
into onboarding. The homepage is not hidden: onboarded users can revisit it any time.

This spec covers wiring and routing only. The homepage UI is a placeholder (heading +
one CTA link) to be designed in a later pass.

## Current behavior (before)

- `/` → `RootRedirect` → `resolveLandingPath(curriculum, …)`:
  - not onboarded → `/onboarding`
  - onboarded → last lesson (if it still exists) → level's first lesson → global first lesson
- `RequireOnboarded` guards lesson pages, bouncing un-onboarded users to `/onboarding`.
- "Onboarded" = `ccc:onboarded === true` in localStorage (`isOnboarded()` in `src/lib/onboarding.ts`).

## Desired behavior (after)

| Visitor    | `/`                     | `/homepage`                       |
|------------|-------------------------|-----------------------------------|
| New        | → `/homepage`           | stays; CTA → `/onboarding`        |
| Onboarded  | → their last/first lesson | stays; CTA → their last/first lesson |

- `/homepage` is always accessible and never auto-redirected away (onboarded users can revisit).

## Changes

### 1. New page: `src/pages/HomePage.tsx`

Placeholder component. Renders a heading and a single CTA link (e.g. "Get started").

The CTA destination is computed by reusing the existing
`resolveLandingPath(curriculum, { onboarded: isOnboarded(), level, lastLesson: getLastLesson() })`.
That helper already returns exactly the "enter the platform" target:
`/onboarding` for new users, last/first lesson for onboarded users. No new resolver logic.

Rendered as a `react-router-dom` `<Link>` so navigation stays client-side.

### 2. New route in `src/App.tsx`

Add `<Route path="/homepage" element={<HomePage />} />`. Unguarded. Existing catch-all
`<Route path="*" element={<Navigate to="/" replace />} />` stays.

### 3. Root redirect flip: `src/components/onboarding/RootRedirect.tsx`

Short-circuit at the top: if `!isOnboarded()`, `<Navigate to="/homepage" replace />`.
Otherwise fall through to today's `resolveLandingPath` logic (onboarded path is unchanged).

`resolveLandingPath` is left untouched so it remains the pure "enter the platform" resolver
shared by both the homepage CTA and the onboarded root path.

## Non-changes

- `RequireOnboarded` unchanged — lesson pages still bounce un-onboarded users to `/onboarding`
  (not `/homepage`), since that guard fires on a deliberate deep link, not the front door.
- No new storage keys, contexts, or onboarding-screen changes.
- `resolveLandingPath` and `landing.ts` untouched.

## Testing

- Unit: `RootRedirect` renders `<Navigate to="/homepage">` when not onboarded; renders the
  lesson path when onboarded (guard the existing behavior didn't regress).
- Unit/smoke: `HomePage` renders a link whose `href` is `/onboarding` when not onboarded and
  a `/learn/...` path when onboarded.

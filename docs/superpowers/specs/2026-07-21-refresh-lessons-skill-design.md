# refresh-lessons skill — design

**Date:** 2026-07-21
**Status:** approved

## Problem

The `lesson-freshness` subagent verifies and repairs **one** lesson against live
docs. Checking a whole category by hand — dispatching, collecting reports,
regenerating, reviewing — is tedious and easy to get wrong (ordering, races,
lost reports). We want a skill that orchestrates the agent across an entire
volatility category in reviewable batches.

## Invocation

`/refresh-lessons [stable|evolving|volatile]` — category defaults to `volatile`.
An unrecognized argument stops with the three valid values.

## Decisions

| Decision | Choice |
|---|---|
| Batch size | 10 lessons per window, in true curriculum order. |
| Between batches | Pause and ask the user before the next batch. |
| Report | Markdown table in the repo's gitignored **`refresh-log/`** folder, not committed. |
| Skip policy | Skip lessons whose `verifiedAgainstDocsAt` is today (`SKIPPED (fresh)` row). |
| Regeneration | **Orchestrator** runs `gen:curriculum` + `check-snippets` once per batch; agents do not, to avoid racing on the shared `curriculum.ts`. |
| Changes column | Literal `"old" → "new"` quotes per prose/code edit, readable from the table alone. |
| Commit | Never. The user reviews `git diff` and decides. |

## Architecture

Three pieces:

1. **`scripts/authoring/listLessons.ts`** (new, + test). A deterministic helper
   that prints lessons filtered by `--volatility` in curriculum order (level
   order → module order → lesson `order`; a plain id sort misplaces `B3.10`),
   as JSON: `{ id, slug, title, file, volatility, verifiedAgainstDocsAt }`. Pure
   `selectLessons(structure, metas, opts)` core, CLI wrapper around it.

2. **`.claude/agents/lesson-freshness.md`** (amended). Its report `Changes:`
   entries now carry actual `"old" → "new"` text so the orchestrator's table
   cells are self-contained. No behavioral change to verification.

3. **`.claude/skills/refresh-lessons/SKILL.md`** (new). The orchestrator.

## Orchestration flow

1. Parse category (default `volatile`; validate).
2. `listLessons.ts --volatility <cat>` → ordered list. Empty → report and stop.
   Announce total + batch count.
3. Create `refresh-log/refresh-lessons-<cat>-<date>.md` (gitignored) with the table header.
4. For each window of 10 lessons:
   - **Skip-fresh**: `verifiedAgainstDocsAt == today` → record `SKIPPED (fresh)`
     row, no dispatch.
   - **Dispatch** the rest in one message (parallel background `lesson-freshness`
     agents) with an override: do **not** run git / gen:curriculum /
     check-snippets; edit the lesson + snippet packs directly; set
     `verifiedAgainstDocsAt` to today; return the structured report with
     before→after quotes.
   - Wait for all to finish, then run `npm run gen:curriculum && npm run
     check-snippets` **once**.
   - Append one row per lesson (before→after changes, needs-human, docs verified,
     verified date, batch check result).
   - If the check **fails**: stop, name the likely lesson(s), ask how to proceed.
   - Else report the tally and **ask before the next batch**.
5. When done: totals, point to the report file + `git diff`, tell the user to
   verify and suggest further edits. No commit.

## Why the orchestrator regenerates

`lesson-freshness` normally runs `gen:curriculum` + `check-snippets` itself. Ten
of those in parallel would race on writing `src/content/curriculum.ts`. Editing
ten distinct `.mdx` files concurrently is safe, so the skill lets agents edit and
performs a single regeneration + validation per batch.

## Report table columns

`Lesson | Status | Changes made | Needs human | Docs verified | Verified | Check`

Status ∈ `STALE` / `CURRENT` / `SKIPPED (fresh)` / `ERROR`. Multi-item cells use
`<br>`.

## Invariants respected

- Never hand-edit `curriculum.ts`; always regenerate.
- `check-snippets` must pass before advancing batches.
- No commits, no `git init` from the skill or its agents.
- Report lives in gitignored `refresh-log/`, never added to the repo.

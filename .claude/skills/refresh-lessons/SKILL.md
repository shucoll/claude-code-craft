---
name: refresh-lessons
description: Use to check a whole volatility category of Claude Code Dojo lessons for staleness in batches. Invoked as `/refresh-lessons <category>` where category is stable | evolving | volatile (default volatile). Dispatches the lesson-freshness subagent at the first 10 lessons in that category, collects each report into a gitignored refresh-log/ markdown table as agents finish, regenerates + validates once per batch, then asks before running the next batch until the category is done.
---

# Refresh a category of lessons

You are the **orchestrator**. You dispatch the `lesson-freshness` subagent (one
per lesson), collect its structured report, and drive batches of 10 across an
entire volatility category. The subagent does the docs verification and editing;
you do the enumeration, batching, regeneration, validation, and reporting.

## Prerequisite

This skill dispatches `subagent_type: lesson-freshness`. If that agent is not in
the available-agents list, it was added after this session started — tell the
user to restart Claude Code so `.claude/agents/lesson-freshness.md` registers,
then stop. Do not substitute a general-purpose agent silently.

## Step 1 — parse the category

The argument is the volatility category: `stable`, `evolving`, or `volatile`.
**Default to `volatile`** when none is given. If the argument is anything else,
stop and show the three valid values — do not guess.

## Step 2 — enumerate the lessons

Run the enumeration helper (curriculum order, filtered to the category):

```bash
npx tsx scripts/authoring/listLessons.ts --volatility <category>
```

It prints a JSON array of `{ id, slug, title, file, volatility,
verifiedAgainstDocsAt }`. If the array is empty, report that no lessons carry
that volatility and stop. Otherwise announce the total and the batch count
(`ceil(total / 10)`), e.g. "32 evolving lessons — 4 batches of 10."

## Step 3 — create the report file

Create the report in the repo's **`refresh-log/`** directory, named
`refresh-lessons-<category>-<YYYY-MM-DD>.md`. Get today's date with `date +%F`.
That folder is gitignored (`refresh-log/.gitignore` is `*`), so the report is a
local working artifact that never gets committed. If `refresh-log/` does not
exist, create it with a `.gitignore` containing a single `*` first.

Write a title and the table header:

```markdown
# Refresh sweep — <category> — <date>

<total> lessons, <batch count> batches.

| Lesson | Status | Changes made | Needs human | Docs verified | Verified | Check |
|---|---|---|---|---|---|---|
```

## Step 4 — batch loop (windows of 10 lessons)

Walk the ordered list in windows of 10. For **each window**:

### 4a. Dispatch

For each lesson in the window:

- **If its `verifiedAgainstDocsAt` equals today's date**, it was already checked
  today. Do not dispatch. Record its row now with Status `SKIPPED (fresh)` and
  `Changes made` = `—`.
- **Otherwise dispatch the `lesson-freshness` agent** for it. Issue all
  non-skipped dispatches in the window **in a single message** (multiple Agent
  calls) so they run concurrently in the background. Use this prompt, filling in
  the id:

  > Verify lesson `<id>` against current official Claude Code docs and repair it
  > if stale, following your normal workflow. **Override:** do NOT run `git`,
  > `npm run gen:curriculum`, or `npm run check-snippets` — the orchestrator runs
  > gen:curriculum and check-snippets once after the whole batch. Still edit the
  > lesson (and its snippet packs) directly, and still set `verifiedAgainstDocsAt`
  > to today. Return only your structured report, with actual `"old" → "new"`
  > quotes in every prose/code change entry.

The override matters: agents edit 10 **different** `.mdx` files concurrently
(safe), but 10 concurrent `gen:curriculum` runs would race on the shared
`src/content/curriculum.ts`. Only you regenerate, once per batch.

### 4b. Wait, then regenerate + validate once

Wait for **every** dispatched agent in the window to finish. Then run:

```bash
npm run gen:curriculum && npm run check-snippets
```

Capture the check result (PASS, or FAIL with the errors).

### 4c. Append rows

Append one table row per lesson in the window (skipped ones already recorded in
4a). Populate each column from that lesson's agent report — see **Row format**
below. Put the batch's `check-snippets` result in the `Check` column of every
non-skipped row.

### 4d. Handle a failed check

If `check-snippets` **FAILED**, do not continue to the next batch. Report the
errors, name the batch lesson(s) most likely responsible, and ask the user how to
proceed (fix by hand, dispatch a corrective `lesson-freshness` run at the named
lesson, or revert that lesson). Only continue once the check passes.

### 4e. Pause between batches

After a clean batch, report a one-line tally
("Batch k/N: X stale, Y current, Z skipped — check PASS") and **ask the user
whether to run the next batch.** Wait for their answer. Stop if they decline.

## Step 5 — finish

When every batch in the category is done:

- Print totals (stale / current / skipped, and any needs-human items).
- Point the user to the report file path and to `git status` / `git diff` for the
  exact patch across all edited lessons.
- Tell them to review the changes and suggest any further edits.
- **Do not commit.** Committing is the user's call.

## Row format

Each cell is Markdown; use `<br>` to separate multiple items within a cell so the
table stays intact.

- **Lesson** — `<id> — <title>`.
- **Status** — `STALE` \| `CURRENT` \| `SKIPPED (fresh)` \| `ERROR` (agent failed
  or the lesson did not resolve).
- **Changes made** — the agent's `Changes:` entries verbatim, one per line via
  `<br>`, each keeping its `"<old>" → "<new>"` quotes so the edit is readable
  from the table alone. `—` when nothing changed beyond the date.
- **Needs human** — the agent's "Docs drift found but NOT auto-fixed" items, or
  `none`.
- **Docs verified** — the `Verified against` URLs, condensed (e.g.
  `memory ✓, best-practices ✓`, or `foo ✗ → bar` for a moved page).
- **Verified** — the lesson's `verifiedAgainstDocsAt` after the run.
- **Check** — the batch `check-snippets` result (`PASS` / `FAIL`).

Example row:

```
| B3.1 — CLAUDE.md fundamentals | STALE | §Try It: `Run /memory and confirm your file is listed as loaded.` → `Run /context and confirm your file appears under Memory files.` (loading is verified by /context — memory docs)<br>frontmatter: verifiedAgainstDocsAt 2026-07-09 → 2026-07-21 | none | memory ✓, best-practices ✓ | 2026-07-21 | PASS |
```

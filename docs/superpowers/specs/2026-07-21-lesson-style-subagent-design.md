# lesson-style subagent — design

**Date:** 2026-07-21
**Status:** approved

## Problem

Lessons must follow a set of writing and content-style guidelines (em-dashes,
self-referential emphasis, flourish clauses, fence discipline, LessonLink usage,
etc.). Those rules were spelled out inside the `new-lesson` skill and partly in
auto-memory, and they were only ever enforced by hand during review. We want a
subagent that checks one lesson against the guidelines and reports what it flags,
plus a single canonical home for the rules so the skill and the agent can't drift.

## Non-goals

- Not an editor. It flags; it never changes files (read-only).
- Not a rewriter. It reports violations without proposing replacement wording.
- Not a structure checker. Section/Structure-line conformance needs the
  curriculum spec and is out of scope.
- Not a batch runner. One lesson per invocation; dispatch several in parallel to
  check a set.

## Decisions

| Decision | Choice |
|---|---|
| Scope | Prose-judgment rules **and** content mechanics (fences, bare ids, inline URLs vs docsSources). |
| Rule source | Extract to a shared **`docs/lesson-style-guide.md`**; both `new-lesson` and this agent reference it. |
| Report detail | Flag-only: rule + location + exact quote + one-line why. No rewrites. |
| Model | Sonnet (read-only tools). |

## Architecture

Three pieces:

1. **`docs/lesson-style-guide.md`** (new, canonical). Holds the prose rules (with
   their banned-shape lists, moved verbatim from `new-lesson`), the content
   mechanics, and the grep verification commands. Single source of truth.

2. **`.claude/skills/new-lesson/SKILL.md`** (trimmed). The detailed prose-rule
   block is replaced by a pointer to the guide; the fence / LessonLink / external
   link bullets keep their authoring how-to but defer the rule + grep to the
   guide. No rule text is lost — it moves.

3. **`.claude/agents/lesson-style.md`** (new). The checker.
   - **Model:** Sonnet. **Tools:** `Read, Grep, Glob, Bash` — no `Edit`, no
     `WebFetch`.
   - **Input:** dotted id / slug / path → one `.mdx`.
   - **Workflow:** read the guide → resolve + read the lesson → run the guide's
     greps for mechanical rules and common prose offenders (grep locates, agent
     judges in context) → read prose for the judgment rules → report.

## Report

Flag-only, each flag tagged **CLEAR** (mechanical or unambiguous) or **REVIEW**
(judgment call), most-confident first. Because the model is Sonnet and there are
no rewrites, the confidence tag lets the human triage fast and the exact quote
lets them judge without opening the file.

```
Lesson: <id> — <title>
Style: CLEAN | <N> flags (<c> CLEAR, <r> REVIEW)

Flags:
1. [<rule-slug>] CLEAR · §<section> L<line>
   "<exact quote>"
   why: <one line>
```

Rule slugs: `em-dash`, `self-referential-emphasis`, `say-once`, `honestly`,
`flourish-clause`, `meta-narration`, `fence-discipline`, `bare-id`,
`external-url-not-in-docsSources`. A clean lesson reports just `Style: CLEAN`.

## Integration with new-lesson

The `new-lesson` skill dispatches `lesson-style` automatically as the final step
of authoring each lesson (single and batch flows). The main session analyzes the
returned flags, discards false positives, and **verifies the proposed fixes with
the user before applying any edit** — the agent stays read-only; the human
approves the changes.

## Invariants respected

- The guide is the only place the rules are defined; consumers point at it.
- Read-only: no edits, no git.
- Every flag quotes real text and cites a real guide rule (no invented flags).

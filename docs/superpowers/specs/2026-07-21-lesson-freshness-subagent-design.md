# Lesson-freshness subagent — design

**Date:** 2026-07-21
**Status:** approved

## Problem

Lessons in Claude Code Dojo teach a fast-moving product. A lesson written and
verified months ago can drift: a flag gets renamed, a default changes, an
official docs page moves or 404s, a code example stops matching real CLI output.
Frontmatter already records the signals we need to reason about this
(`docsSources`, `volatility`, `verifiedAgainstDocsAt`), but nothing verifies a
lesson against live docs and repairs it.

We want a subagent the main session can dispatch at a single lesson. It verifies
the lesson against current official docs, makes only the changes reality
demands, and reports back in a structured format. If nothing is stale, it says
so.

## Non-goals

- Not a batch runner. One lesson per invocation; the main session dispatches
  many in parallel when checking a set.
- Not a prose stylist. It does not rewrite correct-but-imperfect wording.
- Not a committer. It edits files and reports; commits are the main session's
  (and the human's) call.
- Not a new-lesson author. It repairs existing lessons; it does not create or
  restructure them.

## Design decisions

| Decision | Choice |
|---|---|
| Edit scope | Fix only what current docs contradict (prose + code), repair/add `docsSources` URLs, re-judge `volatility`, bump `verifiedAgainstDocsAt`. Preserve structure, wording, and voice. |
| Lesson found current | Not a literal no-op: bump `verifiedAgainstDocsAt` to today (records that a real check happened), regenerate curriculum, report as **current**. |
| Coverage | Prose claims, `docsSources` URLs, **and** code — inline fences plus the lesson's snippet/prompt keys in `src/content/snippets/*`. |
| Model | Opus (subtle "is this actually stale?" judgment and surgical edits). |

## Architecture

A single self-contained Claude Code agent definition:
`.claude/agents/lesson-freshness.md` (YAML frontmatter + system-prompt body).
No new scripts — the deterministic pieces already exist:

- resolve identifier → file: `grep` over `src/content/lessons/**` frontmatter
- regenerate generated curriculum: `npm run gen:curriculum`
- validate: `npm run check-snippets`

The verification itself (fetch docs, compare, judge drift) is inherently
web + judgment work, so it lives as instructions in the agent body, not a script.

### Frontmatter

```yaml
name: lesson-freshness
description: <when to dispatch it>
tools: Read, Edit, Grep, Glob, Bash, WebFetch, WebSearch
model: opus
```

### Input

A lesson identifier: dotted id (`B3.1`), slug, or `.mdx` path. The agent resolves
it to a single file; ambiguity or no match is reported, not guessed.

### Workflow

1. **Resolve & parse.** Find the file; read frontmatter (`docsSources`,
   `volatility`, `verifiedAgainstDocsAt`, `teaches`) and note embedded
   `<Snippet>` / `<TryPrompt>` ids and inline code fences.
2. **Verify sources.** Fetch every `docsSources` URL. For any that 404 or
   redirect, find the real page from the docs map
   (`https://code.claude.com/docs/en/claude_code_docs_map`). Scan the map and
   WebSearch for newly-relevant pages for the lesson's topic.
3. **Compare prose** against current docs: renamed flags/commands, changed
   defaults, removed or added behavior.
4. **Check code.** Inline ` ```bash ` / ` ```js ` fences and the lesson's snippet
   keys in `src/content/snippets/*` against current CLI/API behavior.
5. **Judge conservatively.** Only genuine drift counts; reworded-but-correct is
   not stale.
6. **Apply changes** (only when stale): fix contradicted sentences/code, keep
   voice; repair/add `docsSources` (keep inline links + footer in sync);
   re-judge `volatility`; set `verifiedAgainstDocsAt` to today.
7. **Regenerate & validate.** `npm run gen:curriculum`, then
   `npm run check-snippets`; resolve every ERROR before reporting.
8. **If current:** bump `verifiedAgainstDocsAt`, regenerate, report as current.

### Report format

```
Lesson: B3.1 — CLAUDE.md fundamentals
Status: STALE | CURRENT
Verified against:
  - <url> (ok | moved → <new url> | 404)
Changes:
  - [frontmatter] docsSources: <what>
  - [prose §<section>] <what and why, citing the doc>
  - [code <pack>:<key>] <what>
  - [frontmatter] verifiedAgainstDocsAt → 2026-07-21
Docs drift found but NOT auto-fixed (needs human):
  - <description, or "none">
check-snippets: PASS
```

When nothing was stale: `Status: CURRENT`,
`Changes: verifiedAgainstDocsAt refreshed to <date>`.

## Invariants respected

- Never hand-edit `curriculum.ts`; always regenerate via `npm run gen:curriculum`.
- Every inline external URL also appears in `docsSources`.
- The content check (`npm run check-snippets`) must pass before the agent
  reports done.
- No commits, no `git init` from the agent.

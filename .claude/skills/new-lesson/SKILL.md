---
name: new-lesson
description: Use when adding one or more lessons (or a whole module/level) to Claude Code Craft. Scaffolds the MDX with frontmatter-first metadata, auto-assigns the dotted id, registers the module/level in structure.ts, regenerates curriculum.ts, and stubs snippet/prompt keys only where you opt in — then guides filling in content.
---

# Add a lesson (or module/level)

The deterministic scaffolding lives in `scripts/authoring/` and is run via the CLI.
You supply the judgment (ids are auto-assigned, but titles, prose, frontmatter
metadata, and snippet code are yours); the CLI does the wiring.

**Frontmatter is the source of truth.** Every lesson's metadata (id, order,
prerequisites, teaches, volatility, etc.) lives in the MDX frontmatter.
`src/content/curriculum.ts` is **generated from it** — never hand-edit
`curriculum.ts`. The CLI runs `npm run gen:curriculum` for you automatically
after scaffolding; if you ever change frontmatter by hand afterwards, rerun
`npm run gen:curriculum` yourself.

## Part 0 — before writing anything

For each lesson, decide:
- **`volatility`**: `stable` (fundamentals unlikely to change), `evolving`
  (config/flags that shift across releases), or `volatile` (fast-moving
  surface, e.g. a specific model or preview feature).
- **`docsSources`**: the official docs URL(s) you verified the content against.
  `stable` lessons don't need any. `evolving` and `volatile` lessons **require**
  at least one — the content check (`npm run check-snippets`) fails otherwise.
- **`verifiedAgainstDocsAt`**: the ISO date (`YYYY-MM-DD`) you checked those docs.
  Defaults to today if you omit `--verified-at`.

If the lesson teaches anything about current Claude Code behavior, fetch the
relevant official docs first so the content you write is accurate as of today,
not as of training data.

## Single lesson

1. Decide `level` id, `module` code, lesson `slug` (kebab-case) and `title`.
   Propose them if the user hasn't; confirm before writing. The dotted `id`
   (e.g. `B2.3`) is **auto-assigned** from the module's next free `order` — you
   never pass it.
2. Scaffold:
   ```bash
   npx tsx scripts/authoring/cli.ts lesson \
     --level beginner --module B2 --slug review-changes \
     --title "Reviewing Changes" --type core
   ```
   `--type` is one of `core | resolver | workflow | checkpoint | milestone` —
   it picks which section skeleton gets written (see below).

   Optional flags (exactly as the CLI parses them):
   - `--level-title`, `--module-title`, `--module-slug` — only needed the
     first time you introduce a new level or module (see "New levels/modules"
     below).
   - `--estimated-minutes <n>`
   - `--volatility stable|evolving|volatile`
   - `--verified-at YYYY-MM-DD` (defaults to today)
   - `--prerequisites B2.2` — comma-separated dotted ids that must resolve;
     rendered as a "Prerequisites" strip at the top of the lesson, so set them
     intentionally (user-facing navigation, not just validator metadata)
   - `--teaches diff-review` — comma-separated concept tags
   - `--references B2.1` — comma-separated dotted ids that must resolve;
     rendered as the "Where next" footer at the bottom of the lesson
   - `--docs-sources <url>` — comma-separated; required when volatility isn't
     `stable`
   - `--interactive diagram:spec-id` — comma-separated `kind:spec` pairs; each
     `spec` must exist in the chart registry (`src/content/charts/index.ts`)
   - `--snippets a,b` / `--prompts c` — **opt-in only** (see below); omit them
     entirely if the lesson doesn't need language-specific examples

3. Fill content:
   - The scaffolder writes the anatomy for the chosen `--type` as headings with
     `@@TODO@@` guidance comments describing what belongs in each section
     (e.g. `core` gets "The problem" → "The concept" → "How it works" →
     "Walkthrough" → "Use-case scenarios" → "When to use / when not to use" →
     "Pitfalls" → "Try It" → "FAQ" → "Where next"; `resolver` gets "The
     confusion" → "Side-by-side" → "Decision tree" → "Scenario walkthroughs" →
     "Edge cases"; `workflow`, `checkpoint`, and `milestone` have their own
     shapes). Replace every `@@TODO@@` comment with real prose, following its
     guidance.
   - **Inline fenced code (` ```bash `, ` ```javascript `, …) is the default**
     for examples — write it directly in the MDX body. Only reach for
     `<Snippet id="…" />` / `<TryPrompt id="…" />` at a spot that is genuinely
     language-specific (the same walkthrough needs different code per
     language pack). Pass `--snippets`/`--prompts` at scaffold time to stub
     those ids in the default pack, then write the real code there and add
     idiomatic versions to the other packs (e.g. `python.ts`).
   - **Cross-reference other lessons inline** with
     `<LessonLink id="B2.3" />` (renders the target lesson's title as a link;
     wrap custom text as `<LessonLink id="B2.3">as we saw earlier</LessonLink>`).
     The id must resolve — `check-snippets` fails on unknown ids.
4. Verify: `npm run check-snippets` — this is now the full content check
   (frontmatter validation + snippet/prompt coverage). Resolve every `ERROR`
   before finishing; warnings (fallback gaps, leftover `@@TODO@@` stubs) are
   fine to leave for a later pass.

## New levels/modules

Levels and modules are hand-authored containers, not generated. Either:
- edit `src/content/structure.ts` directly (add a `LevelDef`/`ModuleDef`
  entry), or
- pass `--level-title` / `--module-title` / `--module-slug` on the first
  `cli.ts lesson` call that references a new level id or module code — the
  scaffolder creates the container for you.

## Whole module or level (batch)

1. Draft the full outline and **get the user's approval before writing anything.**
2. Write it to a temp JSON file in the `Outline` shape (see
   `scripts/authoring/scaffold.ts`):
   ```json
   {
     "levels": [
       {
         "id": "advanced",
         "title": "Advanced",
         "modules": [
           {
             "code": "A7",
             "slug": "worktrees",
             "title": "Worktrees",
             "lessons": [
               {
                 "slug": "why-worktrees",
                 "title": "Why Worktrees",
                 "type": "core",
                 "volatility": "stable",
                 "verifiedAgainstDocsAt": "2026-07-03"
               }
             ]
           }
         ]
       }
     ]
   }
   ```
   Each lesson entry takes the same fields as the CLI flags above
   (`slug`, `title`, `type`, `estimatedMinutes`, `volatility`,
   `verifiedAgainstDocsAt`, `prerequisites`, `teaches`, `references`,
   `docsSources`, `interactive`, `snippets`, `prompts`) — dotted `id`s are
   auto-assigned in file order as each lesson is scaffolded.
3. Scaffold the skeleton: `npx tsx scripts/authoring/cli.ts outline --file <path>`
   — this also runs `gen:curriculum` at the end.
4. Fill lessons incrementally (as above). `npm run check-snippets` reports what
   remains; leftover `@@TODO@@` stubs are warnings, not errors, so a skeleton
   can be committed and finished over several passes.

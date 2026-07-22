---
name: new-lesson
description: Use when adding one or more lessons (or a whole module/level) to Claude Code Dojo. Scaffolds the MDX with frontmatter-first metadata, auto-assigns the dotted id, registers the module/level in structure.ts, regenerates curriculum.ts, and stubs snippet/prompt keys only where you opt in — then guides filling in content.
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

The curriculum spec (`curriculum-design/claude-code-craft-curriculum_v9.md`) is
the source of truth for each lesson's metadata: its per-lesson table already
lists the `volatility`, `docsSources`, and the lesson's `Structure` line. Start
from those — don't invent them from scratch.

For each lesson:
- **`docsSources`**: the official docs URL(s) the content is verified against.
  **Every lesson needs sources — there is no exception for `stable` lessons.**
  The curriculum already lists sources for each lesson; use those as the
  starting set, fetch them, and add more as you find them necessary while
  writing. (The content check enforces `docsSources` on every lesson except
  `checkpoint`/`milestone` recap lessons, which teach no feature surface.)
- **`volatility`**: the curriculum already specifies this per lesson; use it as
  the default. But after fetching the docs, if the real surface is more or less
  volatile than the curriculum tagged it, override it with the volatility the
  docs warrant (pass a new `--volatility`).
- **`verifiedAgainstDocsAt`**: the ISO date (`YYYY-MM-DD`) you checked those docs.
  Defaults to today if you omit `--verified-at`.

Always fetch the relevant official docs first (start from the docs map at
`https://code.claude.com/docs/en/claude_code_docs_map`) so the content you write
is accurate as of today, not as of training data. If a lesson's content
conflicts with current docs, the docs win.

### Authoring a pre-scaffolded stub

A lesson may already exist as a frontmatter-only `@@TODO@@` skeleton, scaffolded
in a batch ahead of time (the whole Intermediate level was). **Its frontmatter is
provisional — do not trust it as verified.** Before writing the body:

- **`docsSources` URLs were inferred** from the curriculum's `.md` filenames
  (`claude-directory.md` → `/en/claude-directory`) and **have never been
  fetched**. Fetch each one. A URL that 404s or redirects is wrong: find the real
  page and fix the frontmatter, since these render as the lesson's "Official
  docs" footer.
- **`interactive` was deliberately omitted** when the lesson's chart didn't exist
  yet (the validator only accepts a registered chart id). Check the curriculum's
  Interactive row: if it names a chart, author and register it now, then add the
  `interactive` block and the `<ChartEmbed>`.
- **`verifiedAgainstDocsAt` is the scaffold date, not a verification.** Set it to
  the day you actually check the docs.
- **`volatility`** came from the curriculum; re-judge it against the real docs
  surface, per the rule above.

Rerun `npm run gen:curriculum` after any frontmatter change.

## Follow the lesson's Structure line

Every core and resolver lesson in the curriculum carries a **Structure** line
(right after its "Covers" paragraph) stating exactly how the section menu
applies to *that* lesson. Follow it — it overrides the generic full-menu
skeleton the scaffolder writes.

Core lessons name one of four profiles plus lesson-specific deltas:
- **Full** — the default menu, complete or near-complete (heavyweight feature
  lessons). *Full — compact* keeps every section but brief; *Full — extended*
  goes beyond the menu where the topic demands it.
- **Concept** — mental-model lessons: problem, concept, how-it-works,
  interactive, FAQ, where-next. Do **not** invent use-case scenarios,
  when-not-to-use, or pitfalls where they don't naturally arise.
- **Brief** — deliberately short: problem and concept merged, one compact pass
  of mechanics, a comparison table or single example, where-next. No walkthrough
  required.
- **Custom** — the body follows its own shape (reference catalog, cookbook,
  pattern blocks, guided tour, symptom→response playbook), as the line describes.

Resolver lessons carry Structure lines too: most use all five resolver sections,
but Edge cases may be dropped or folded for two-option comparisons, and resolvers
without a dedicated chart replace the decision tree with an inline if/then
decision ladder.

**`overview` lessons** (the single-lesson orientation module that opens
Intermediate and Advanced, e.g. `I0.1`, `A0.1`) do **not** carry Structure lines.
Their shape is fixed by curriculum §1.8, and the scaffolder writes it: *You are
here* → *The gap* → *The map* (the level's interactive stack chart, the
centerpiece) → *How it fits together* → *Suggested route* → *What you'll build*.
They teach no mechanics and contain **no Try It and no pitfalls**; every feature
claim stays at one-line-identity depth (the modules own the mechanics). They
still take `docsSources` (typically `features-overview.md`) and `references`.

The scaffolder writes the default skeleton regardless of profile — **reshape it
to match the Structure line**: delete sections the profile drops rather than
padding them, and reorder or merge as the line directs. The always-required
elements still hold under every profile: answer every "Must answer" question,
include when-not-to-use + a cost note for feature lessons, a Try It whenever
there is anything hands-on, and "Where next" cross-links plus the "Official docs"
footer.

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
   `--type` is one of `overview | core | resolver | workflow | checkpoint | milestone`
   — it picks which section skeleton gets written (see below).

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
   - `--docs-sources <url>` — comma-separated; **set on every lesson** (see
     Part 0). The content check hard-fails when it's missing on any lesson except
     `checkpoint`/`milestone` recap lessons.
   - `--interactive diagram:spec-id` — comma-separated `kind:spec` pairs; each
     `spec` must exist in the chart registry (`src/content/charts/index.ts`).
     Charts can be linear card-flows **or** branching flowcharts (`flow` rows
     for decision trees/loops) — see `src/content/charts/README.md`; both are
     authored the same way: define a `ChartDef`, register it in `index.ts` +
     `chartIds.ts`, and embed with `<ChartEmbed id="…" />`.
   - `--snippets a,b` / `--prompts c` — **opt-in only** (see below); omit them
     entirely if the lesson doesn't need language-specific examples

3. Fill content:
   - **Follow the lesson style guide: `docs/lesson-style-guide.md`.** It is the
     canonical, up-to-date home for the prose rules (em-dashes minimal/none, no
     self-referential emphasis, say each point once, no "honestly", no flourish
     clauses, no section meta-narration) and the content-mechanics rules (fence
     discipline, no bare dotted ids outside `<LessonLink>`, every inline external
     URL in `docsSources`). These are standing user preferences, flagged
     repeatedly across reviews. Run the grep commands in the guide before calling
     a lesson done, and read the prose for the judgment rules; the `lesson-style`
     subagent checks a lesson against this guide and reports what it flags.
   - The scaffolder writes the anatomy for the chosen `--type` as headings with
     `@@TODO@@` guidance comments describing what belongs in each section
     (e.g. `core` gets "The problem" → "The concept" → "How it works" →
     "Walkthrough" → "Use-case scenarios" → "When to use / when not to use" →
     "Pitfalls" → "Try It" → "FAQ" → "Where next"; `resolver` gets "The
     confusion" → "Side-by-side" → "Decision tree" → "Scenario walkthroughs" →
     "Edge cases"; `workflow`, `checkpoint`, and `milestone` have their own
     shapes). Replace every `@@TODO@@` comment with real prose, following its
     guidance.
   - **Use a ` ```prompt ` fence for anything the learner types into Claude**
     (natural-language prompts, `@`-mentions, `!` shell passthrough). It renders
     as a prominent "Prompt:" card, visually distinct from a ` ```bash ` fence
     (a command run in their own shell) and a ` ```text ` fence (terminal or UI
     output they only read, such as a permission dialog). Getting this right is
     what tells the learner *where* to put the thing they are looking at. Every
     fence gets a copy button automatically.
   - **Inline fenced code (` ```bash `, ` ```javascript `, …) is the default**
     for examples — write it directly in the MDX body. Only reach for
     `<Snippet id="…" />` / `<TryPrompt id="…" />` at a spot that is genuinely
     language-specific (the same walkthrough needs different code per
     language pack). Pass `--snippets`/`--prompts` at scaffold time to stub
     those ids in the default pack, then write the real code there and add
     idiomatic versions to the other packs (e.g. `python.ts`).
   - **Cross-reference other lessons inline with `<LessonLink>`** —
     `<LessonLink id="B2.3" />` renders the target lesson's title, or wrap custom
     text: `<LessonLink id="B2.3">as we saw earlier</LessonLink>`. The id must
     resolve (`check-snippets` fails on unknown ids). Never leave a bare dotted id
     as plain text in prose; the style guide covers that rule, the id-as-label
     forms, and the grep to catch stragglers.
   - **Inline links that leave the platform** (official docs, pricing,
     anthropic.com, any `http(s)://` URL) are just normal markdown links
     `[text](url)`; the MDX `a` renderer opens them in a new tab and appends the
     `↗` marker, so don't hand-roll `target`/`rel`. Every such URL must also be
     in the lesson's `docsSources` (see the style guide); add it to frontmatter
     and rerun `npm run gen:curriculum` if you linked it inline first. Internal
     navigation uses `<LessonLink>`, not a raw link.
4. Verify: `npm run check-snippets` — this is now the full content check
   (frontmatter validation + snippet/prompt coverage). Resolve every `ERROR`
   before finishing; warnings (fallback gaps, leftover `@@TODO@@` stubs) are
   fine to leave for a later pass.
5. **Style-check the finished lesson.** Once the content is written and
   `check-snippets` is green, **automatically dispatch the `lesson-style`
   subagent** at the lesson (by dotted id or slug). It is read-only and returns a
   flag-only report against `docs/lesson-style-guide.md`. A lesson is not done
   until it has been through this check.

   When the report comes back, **do not apply anything blindly.** Analyze each
   flag and decide whether it is a real violation or a false positive:
   - `CLEAR` flags are usually genuine; `REVIEW` flags are judgment calls — weigh
     each in context. Prose rules do not apply to simulated file/terminal content
     inside fences, so discard flags that misfire there.
   - Keep only the flags that genuinely need a fix; drop the rest, and be ready to
     say why you dropped them.

   **Then verify with the user before editing.** Show the flags you judged valid
   and the specific change you propose for each, and get their go-ahead. Only
   after they approve do you make the edits, then re-run `npm run check-snippets`
   (and `npm run gen:curriculum` if you touched frontmatter). Never apply
   style edits without user confirmation.

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
   can be committed and finished over several passes. Run the **step-5
   style-check** on each lesson as you finish it (dispatch `lesson-style`,
   analyze, verify with the user, then apply) — a lesson counts as done only
   after it passes that check.

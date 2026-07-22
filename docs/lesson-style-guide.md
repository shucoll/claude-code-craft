# Lesson style guide

Canonical writing and content-style rules for Claude Code Dojo lessons. This file
is the single source of truth: the **`new-lesson`** skill points authors here, and
the **`lesson-style`** subagent checks a lesson against it. Edit the rules here,
not in either consumer.

Two groups: **prose rules** (judgment calls about voice) and **content mechanics**
(near-deterministic conventions about fences, links, and ids).

The prose rules apply to **lesson prose**, not to simulated file or terminal
content inside code fences. Em-dashes, phrasing, and the like inside a ` ```text `,
` ```bash `, or sample-config block are showing the reader realistic content, so
they are exempt — judge them for accuracy and fence type, not voice.

## Prose rules

- **Use em-dashes (—) minimally, ideally none.** Reach for periods, commas,
  colons, or parentheses instead. Overusing em-dashes makes lessons read as
  machine-authored; keep them rare across all lesson prose.
- **No self-referential emphasis.** Never announce that something is important;
  state it plainly and let it carry itself. Banned shapes: "that is exactly what
  X resolves", "this is the whole point / the whole answer / the entire point",
  "is exactly why/what", "and it matters", "worth slowing down for", "hold onto
  it", "that is the whole game". Also drop filler `exactly`/`precisely` before a
  comparison ("exactly the shape from B4.1" → "the shape from B4.1");
  precise-equality uses are fine ("back exactly where it started").
- **Say each point once.** Don't repeat an insight or a cross-link in two
  sections (e.g. a body step and the recap). Put it where it lands best.
- **Avoid "honestly"** as a filler adverb.
- **No unnecessary flourish clauses.** Cut the extra clever clause that adds no
  information and often reads as aggressive or arch. It is usually a trailing
  "not X" antithesis or a cute metaphor payoff tacked onto a sentence that was
  already complete. Banned shapes: "so the room is on your map, not so you
  furnish it yet", "and nothing more, which for most people is the correct
  amount", "not one clever session". A frequent offender is the "X is not
  [dismissive little picture]; it is Y" shape, e.g. "The connection is not a
  thing you set up on your laptop and describe to teammates in a wiki. It is
  configuration in the repository". Drop the dismissive-picture sentence and
  state Y plainly ("The connection is configuration in the repository: teammates
  get it by cloning"). Also watch defensive / presuming-the-reader asides that
  add no content: "not busywork", "not a straw man", "not hiding it", "and they
  are easy to conflate", "that is not a nicety", "a consequence worth naming".
  And cut self-referential importance tags: "its design is the lesson", "that
  absence is the feature", "the point of X is". If a clause only re-states the
  sentence with attitude or announces that something matters, delete it; keep the
  plain version.
- **No meta-narration of a section's own format.** Cut sentences that describe
  the shape of what follows rather than teaching it. Banned shapes: "No chart
  here, just an if/then walk", "here's a table", "what follows is", "in this
  section we". Present the ladder/table/example directly.

These are standing user preferences, flagged repeatedly across reviews.

## Content mechanics

- **Fence discipline.** Use a ` ```prompt ` fence for anything the learner types
  into Claude (natural-language prompts, `@`-mentions, `!` shell passthrough); it
  renders as a "Prompt:" card. Use ` ```bash ` for a command the learner runs in
  their own shell, and ` ```text ` for terminal or UI output they only read (a
  permission dialog, sample output). The fence type tells the learner *where* the
  thing goes, so a typed prompt in a ` ```bash ` fence, or a runnable command in
  a ` ```text ` fence, is a bug.
- **Never leave a bare dotted id as plain text.** A lesson reference written
  literally in prose ("from I8.1", "the rule I4.2 built", "you learned in I1.3")
  must be a `<LessonLink>`, not inert text. When the sentence reads better with
  the id showing than the title, keep the id as the visible label
  (`<LessonLink id="I8.1">I8.1</LessonLink>`, possessives too:
  `<LessonLink id="I8.1">I8.1</LessonLink>'s deny rule`). Otherwise use the
  default title form (`<LessonLink id="I8.1" />`).
- **Every inline external URL must be in `docsSources`.** Inline links that leave
  the platform (official docs, pricing, anthropic.com, any `http(s)://` URL) are
  normal markdown links `[text](url)`; the renderer opens them in a new tab and
  appends `↗`. Each such URL must also appear in the lesson's `docsSources`
  frontmatter (the auto "Official docs" footer is the canonical outbound list;
  inline links are a subset). Internal navigation uses `<LessonLink>`, never a
  raw link.

## Grep verification commands

Run these against a finished lesson before calling it done. They catch the
mechanical rules and the most common prose offenders; the judgment rules still
need a read.

```bash
# Prose offenders: self-referential emphasis, "honestly", em-dashes
grep -niE "exactly (what|why|the)|the whole (point|answer|game)|and it matters|honestly|—" <file>

# Bare dotted ids in prose — every hit outside frontmatter and code fences
# must sit inside a <LessonLink>
grep -nE "[^\"/=]\b[IBA][0-9]+\.[0-9]+" <file>
```

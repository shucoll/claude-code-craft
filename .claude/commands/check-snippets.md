---
description: Run the content check — frontmatter validation plus snippet/prompt coverage
---

Run `npm run check-snippets` and summarize the result. This is the full content
check (`scripts/authoring/check.ts`); it validates two things:

1. **Frontmatter validation** — invalid `type` or `volatility`, missing
   required fields (`id`, `slug`, `title`, `order`), duplicate dotted ids or
   slugs, a slug that doesn't match its file name, unresolved
   `prerequisites`/`references` (dotted ids that don't exist), an `interactive`
   spec not in the chart registry, non-contiguous `order` values within a
   module, and a non-`stable` `volatility` missing `docsSources`.
2. **Snippet/prompt coverage** — `<Snippet>`/`<TryPrompt>` ids referenced in
   lessons but missing from the default pack, and (as warnings) gaps in
   non-default packs that fall back to the default, plus any leftover
   `@@TODO@@` stubs.

List any ERRORs first (these fail CI) — group them under "frontmatter" vs
"snippets/prompts" if both kinds appear — then group the warnings (fallback
gaps and leftover TODO stubs). If there are zero errors and zero warnings, say
so plainly.

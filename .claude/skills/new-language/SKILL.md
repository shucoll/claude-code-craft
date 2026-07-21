---
name: new-language
description: Use when adding a new language pack to Claude Code Dojo. Creates an empty pack (so all existing lessons fall back to the default) and registers it, then guides idiomatic translation of every key.
---

# Add a language pack

1. Confirm the language `id` (a valid JS identifier, e.g. `rust`), `label` (e.g. `Rust`)
   and optional `icon` emoji.
2. Scaffold:
   ```bash
   npx tsx scripts/authoring/cli.ts language --id rust --label Rust --icon 🦀
   ```
   This creates `src/content/snippets/rust.ts` with empty `snippets`/`prompts` and
   registers it in `snippets/index.ts`. Every existing lesson immediately works in the
   new language by falling back to the default pack (`javascript`).
3. Get the translation worklist: `npm run check-snippets` lists every key the new pack is
   missing (as fallback warnings).
4. Fill keys idiomatically, one at a time, in `rust.ts`. Each key you add overrides the
   fallback for that key. Warnings shrink as you go; there is no hard error because
   fallback keeps the app correct throughout.

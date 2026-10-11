---
# cssints-yrxy
title: 'Dev server: a token file renamed (or deleted) keeps its @property, so a new declaration fails ''already declared'''
status: completed
type: bug
created_at: 2026-10-11T19:00:04Z
updated_at: 2026-10-11T19:00:04Z
---

Reproduced 2026-10-11 on the dev server: a.ts declares css.token.color("#ff0000", "brand"); rename a.ts to b.ts and change the value to #0000ff; transformRequest('/b.ts') fails: '--brand is already declared with another @property, in a.ts'. The registry's `properties` keep entries of a file that is gone: `forget(file)` (registry.ts) drops kernels, themes, checks but not properties/defs of that file, and hotUpdate on a delete only invalidates the dependents (forget is not called for the deleted file). Same stale state the playground worked around (cssints-1fq0 clears tokens per compile).

- [x] failing test (dev server: rename with a new value, and delete then re-declare elsewhere)
- [x] forget drops the file's @property/defs (and anything else keyed by file that survives: themed? globals?), hotUpdate forgets a deleted file
- [x] the playground's per-compile clear can go if the engine handles it (check)
- [x] Quint model / race test still green

## Summary of Changes

Root cause: `forget(file)` dropped a file's kernels, themes and checks but not its `properties` and `defs`, and `hotUpdate` did nothing for the file itself when it was deleted (it only invalidated the dependents). A renamed or deleted token file kept its `@property` (and its rule in the sheet through `usedBy`), so the same name in another file was "already declared".

Fix: `forget` (registry.ts) also drops the `properties` of the file and their `defs`, in the web tables and the terminal ones; `hotUpdate` (plugin.ts) takes the event type and, on `delete`, forgets the file and `drop`s it (its rules leave the sheet). `evaluate`, `drop` and the no-site path already call `forget`, so every path routes through one place. A build's `--watch` shares the same `forget` on the next evaluation of a module; a deleted file has no event there and is not part of the next build.

Test: `test/dev-token-rename.mjs` (in `bun run test`): unchanged edit and a new value in the same file, rename with a new value, delete then declare the name in another file, and two live files with one name are still an error. It fails without either half of the fix. `test/themes.mjs` cleared a stale check by hand: a second build in the same process (a new plugin instance, so a new `usedBy`) left the check of a file that no longer declares its tokens, which the old stale `defs` hid.

The playground's per-compile `properties.clear()` and `defs.clear()` are gone: it already forgets every file of the last and the next compile. Quint model: unchanged (no delete event in it, no new await point; race.mjs green). perf.mjs not run: `forget` is per module, not per site, and scans one more map like the ones it scans now.

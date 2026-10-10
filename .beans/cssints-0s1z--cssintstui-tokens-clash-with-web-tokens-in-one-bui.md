---
# cssints-0s1z
title: cssints/tui tokens clash with web tokens in one build (@property registry)
status: completed
type: bug
priority: normal
created_at: 2026-10-10T22:13:33Z
updated_at: 2026-10-10T23:37:12Z
---

cssints/tui's createTokens and createGlobalTheme are the web ones: they declare @property rules in the process-global registry. In a build that also has web styles (apps/docs importing apps/sky-tui's styles.ts) the names clash: `MacroError: cssints: --color-bg is already declared with another @property, in src/theme.ts`. Repro: import apps/sky-tui/src/styles.ts from any module of apps/docs and bun run build. Workaround: apps/docs/plugin/tui-styles.ts builds styles.ts in a child process into plain prop objects.

## Todo
- [ ] Failing test: a web module and a cssints/tui module with the same token names in one build
- [x] Terminal tokens stay out of the sheet's @property table
- [x] Drop apps/docs/plugin/tui-styles.ts, import sky-tui's styles.ts directly

## Summary of Changes

- Root cause: cssints/tui re-exported the web createTokens/createGlobalTheme, which write the process-global `properties` (@property), `defs` and `themed` tables. A web token of the same name clashed, web themes could reach terminal sites, and a shipped terminal token set (`var(--x)` text) pulled web @property rules and themes into its module's sheet.
- Fix (packages/cssints/src/tui.ts): the two functions run with those three tables swapped for `registry.terminal`; terminal colours and themes resolve from it; `forget` clears its themes on an edit; `tokensOf` writes a terminal set's `--` as `-\u002d` (same run-time string) so entries.ts sees no token.
- tui-vs-tui: unchanged, one name with two values in two terminal modules is an error.
- Test: packages/tui test/tui.mjs (web.ts with the same names first, no CSS from terminal modules, web @property and `.dark` intact, bad-clash.ts).
- apps/docs: sky-tui's styles.ts imported directly; plugin/tui-styles.ts and its wiring removed. Docs: API.md TUI, research/tui.md, AGENTS.md, wayfinder.
- Left: a terminal derived token still registers the browser derived runtime for its module (empty unless targets need it).

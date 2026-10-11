---
# cssints-v872
title: Mixed web/terminal token sets in createGlobalTheme crash without a clear message
status: completed
type: bug
priority: normal
created_at: 2026-10-11T08:21:52Z
updated_at: 2026-10-11T08:27:20Z
---

Passing a web token set to cssints/tui's createGlobalTheme (or a terminal set to the web one) crashes instead of a clear error naming the call site and what to import.

## Todo
- [x] Failing test: both directions, the message names the call and the right import
- [x] A clear error in tui.ts / the web createGlobalTheme

## Summary of Changes

Root cause: `cssints/tui` runs the web `createGlobalTheme` on its own tables (`registry.terminal`), and `theme()` looked up the set's tokens in whichever `defs` was active, so a set of the other `createTokens` crashed (`reading 'kind'`) or silently matched a token of the same name. Fix: `theme()` compares `set.terminal` with the active tables and fails with a `MacroError` at the call, naming the `createGlobalTheme` (and import) to use. Test: packages/tui test/tui.mjs, fixtures bad-web-set.ts and bad-tui-set.ts (message, file, line). docs/API.md "TUI" says so.

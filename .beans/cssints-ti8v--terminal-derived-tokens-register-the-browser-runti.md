---
# cssints-ti8v
title: Terminal derived tokens register the browser runtime of derived tokens
status: completed
type: bug
priority: normal
created_at: 2026-10-11T08:21:52Z
updated_at: 2026-10-11T08:28:25Z
---

A terminal token derived from another (color-mix() over a token) still registers the browser runtime of derived tokens for its module; the module is empty unless the targets need it, but terminal modules should register nothing.

## Todo
- [x] Failing test: a terminal module with a derived token imports no derived-token runtime
- [x] Skip the registration for terminal token sets

## Summary of Changes

Root cause: `cssints/tui`'s createTokens runs the web code, whose `standIn` registered the derived-token runtime (`addDerived`) for any derived token a target cannot parse, terminal ones included. Fix: `standIn` (derived-data.ts) returns false when the active tables are the terminal ones (`registry.defs === registry.terminal?.defs`): no runtime, no warning. Test: packages/tui test/tui.mjs asserts theme.ts and card.ts import no `runtime/derived`; the derived hover still resolves to `#303140`. One wayfinder entry with cssints-v872.

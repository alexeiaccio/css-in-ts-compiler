---
# cssints-twtp
title: createGlobalTheme types do not map digit keys of a DTCG override
status: completed
type: bug
priority: normal
created_at: 2026-10-19T10:04:31Z
updated_at: 2026-10-19T10:08:57Z
---

docs/API.md says a DTCG file used as a theme maps a digit key such as `500` to `_500`, but the types of createGlobalTheme do not: a DTCG override with digit keys (`"0"`..`"15"`) fails with TS2345. Found with @cssints/tokens/madoromi (cssints-bm7a), whose ANSI colours are named instead.

## Todo
- [x] Failing type test: a DTCG group with digit keys as the override of createGlobalTheme
- [x] Map digit keys in the theme types as the run time does

## Summary of Changes

- `Overrides<X>` (packages/cssints/src/theme-types.ts) takes `500` beside `_500`, the `Digit` mapping of `Tokens`; a DTCG group of digit keys only no longer fails the weak-type check (TS2345), an inline one no longer fails TS2353.
- `CheckOverrides` checks a digit key's value as a named one's (shared `CheckOverride`): `{ "1": "12px" }` on a colour is an error.
- Type tests in packages/cssints/test/types/themes.ts; bench +25 instantiations per file, in budget. docs/API.md was right; wayfinder entry, changeset.

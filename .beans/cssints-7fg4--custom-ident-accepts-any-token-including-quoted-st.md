---
# cssints-7fg4
title: <custom-ident> accepts any token, including quoted strings
status: completed
type: bug
priority: normal
created_at: 2026-09-26T08:26:25Z
updated_at: 2026-09-26T10:26:37Z
parent: cssints-tmv8
---

The twin uses `/^.+$/` and the types use `string`. So `font-family: "a" "b"` passes as `<custom-ident>+` (Chrome rejects it), and so would `1px` wherever a `<custom-ident>` is allowed. Found by `diff.ts` (mutants: twin accepts, Chrome rejects).

- [x] twin.ts: an ident pattern (`-?[A-Za-z_\u0080-\uffff][\w\u0080-\uffff-]*`, ignoring escapes), excluding CSS-wide keywords (`initial`, `inherit`, `unset`, `revert`, `revert-layer`) and `default`
- [x] css.ts: reject tokens that start with a quote, a digit, `#`, `.`, `+`, or `(`, and the same keywords; the budget must hold
- [x] Rows in cases.ts

## Summary of Changes

- twin.ts: `<custom-ident>` is `(?:--|-?[A-Za-z_\u0080-\uffff])[\w\u0080-\uffff-]*` (escapes ignored; `--x` is an ident too), minus `initial | inherit | unset | revert | revert-layer | default` in any case.
- css.ts: `NotIdent` rejects tokens that start with a quote, `#`, `.`, `+`, `(`, a digit or `-digit`, and the same keywords (compared through `Lowercase`). Other bad characters inside a token are caught only by the twin.
- cases.ts: valid `"Gill", Futura, sans-serif`, `Open Sans`, `_a, -b, --c`; invalid `"a" "b"`, `1px`, `Foo, initial`, `a -1b`, `#x`, `Foo Default`.
- diff.ts: Chrome agreement 1866/1950 -> 1867/1950 (the `"x-a-" "x-a214z--"` font-family mutant is gone); types vs twin 456/456.
- Budget holds without an update: b200 tsc 195863 -> 195949, tsgo 197995 -> 198081.

Left open: per-property keyword exclusion (font-family `system-ui x-a-1` is still accepted: the generic family keywords may not start a `<custom-ident>+` family name); quoted strings with spaces (`"Gill Sans"`) do not survive the space-splitting `Tok1`/`tok1`.

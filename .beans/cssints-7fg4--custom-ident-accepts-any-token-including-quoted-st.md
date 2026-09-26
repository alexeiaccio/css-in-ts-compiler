---
# cssints-7fg4
title: <custom-ident> accepts any token, including quoted strings
status: todo
type: bug
created_at: 2026-09-26T08:26:25Z
updated_at: 2026-09-26T08:26:25Z
parent: cssints-tmv8
---

The twin uses `/^.+$/` and the types use `string`. So `font-family: "a" "b"` passes as `<custom-ident>+` (Chrome rejects it), and so would `1px` wherever a `<custom-ident>` is allowed. Found by `diff.ts` (mutants: twin accepts, Chrome rejects).

- [ ] twin.ts: an ident pattern (`-?[A-Za-z_\u0080-\uffff][\w\u0080-\uffff-]*`, ignoring escapes), excluding CSS-wide keywords (`initial`, `inherit`, `unset`, `revert`, `revert-layer`) and `default`
- [ ] css.ts: reject tokens that start with a quote, a digit, `#`, `.`, `+`, or `(`, and the same keywords; the budget must hold
- [ ] Rows in cases.ts

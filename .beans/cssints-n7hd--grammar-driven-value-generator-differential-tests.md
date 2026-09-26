---
# cssints-n7hd
title: Grammar-driven value generator + differential tests (twin, types, Chrome)
status: completed
type: task
priority: normal
created_at: 2026-09-26T08:20:01Z
updated_at: 2026-09-26T08:28:42Z
parent: cssints-tmv8
---

The twins agree on the 34 rows in `cases.ts`. That says little about the other grammars. Add a third interpretation of the same mdn node tree: generate values instead of recognizing them. Then use it as a test oracle.

- [x] `gen(node)` over the twin parse tree (`twin.ts` `parse`) producing valid values; bound repetition and recursion; skip opaque types
- [x] Mutations that make a value invalid (drop a required part, duplicate a `||` part, swap an `&&` order, out-of-range number, wrong unit)
- [x] Property test with fast-check: the twin accepts every generated value and rejects the mutants
- [x] Chrome oracle: run the same strings through `CSS.supports(prop, value)` and `CSSStyleValue.parse` with Playwright; list disagreements (mdn-data vs engine vs twin)
- [x] Types on a sample: emit generated literals into a bench file, check with tsc and tsgo, and compare with the twin verdicts (types may accept more: ranges, `${number}`)
- [x] Record results in docs/wayfinder.md

## Summary of Changes
- `gen.ts`: fast-check Arbitraries built from the twin parse tree. `diff.ts`: the twin self-check, Chrome 154 via `CSS.supports` (playwright-core with the installed Chrome), and types on a sample via tsgo. It fails only on the twin self-check or on a types/twin disagreement.
- Mutations are drop, duplicate and rotate a token. Their truth comes from Chrome, not from an assumption that they are invalid.
- Fixed at type level: `<custom-ident>` matched an empty token, so a trailing comma passed. The budgets did not change.
- Findings filed: cssints-j24s (comma omission, `background: red` rejected), cssints-7fg4 (`<custom-ident>`), cssints-vgff (missing ranges), a draft for browser support and prose rules, and a note on cssints-aj2u.

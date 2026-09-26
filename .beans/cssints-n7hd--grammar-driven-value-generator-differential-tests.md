---
# cssints-n7hd
title: Grammar-driven value generator + differential tests (twin, types, Chrome)
status: todo
type: task
created_at: 2026-09-26T08:20:01Z
updated_at: 2026-09-26T08:20:01Z
parent: cssints-tmv8
---

The twins agree on the 34 rows in `cases.ts`. That says little about the other grammars. Add a third interpretation of the same mdn node tree: generate values instead of recognizing them. Then use it as a test oracle.

- [ ] `gen(node)` over the twin parse tree (`twin.ts` `parse`) producing valid values; bound repetition and recursion; skip opaque types
- [ ] Mutations that make a value invalid (drop a required part, duplicate a `||` part, swap an `&&` order, out-of-range number, wrong unit)
- [ ] Property test with fast-check: the twin accepts every generated value and rejects the mutants
- [ ] Chrome oracle: run the same strings through `CSS.supports(prop, value)` and `CSSStyleValue.parse` with Playwright; list disagreements (mdn-data vs engine vs twin)
- [ ] Types on a sample: emit generated literals into a bench file, check with tsc and tsgo, and compare with the twin verdicts (types may accept more: ranges, `${number}`)
- [ ] Record results in docs/wayfinder.md

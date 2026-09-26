---
# cssints-cfqn
title: Type-level recognizer over verbatim mdn-data grammar
status: completed
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

## Summary of Changes
- `spikes/typelevel/css.ts`: a type-level lexer, parser and recognizer (`Parse`, `Consume`, `Matches`, `Valid`, `PropertyFn`) over `mdn.ts`, which `extract.mjs` generates verbatim.
- Performance work: tuple-pattern depth guards, no mapped types over `Node[]`, the indexed-object trick, and cons lists with no token arrays. `color()` went from 1.19 M to 98 k instantiations.
- Benches are in `bench/`. The error message names the property and its grammar.

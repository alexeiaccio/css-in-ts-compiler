---
"@cssints/apg-specs": minor
"@cssints/reactive": patch
---

A Quint model of `@cssints/reactive`'s owners, programs and flush (`specs/patterns/reactive.qnt`, `src/patterns/reactive.bridge.ts` and two scenario sets in `scenarios/patterns/`), replayed on a page in `packages/reactive/test/scenarios.mjs` with the scenario engine and two seeded differential walks. The model states that `inside()` is a CSS ancestor match, not nearest-scoped, for a nested owner that declares the same state as an outer one.

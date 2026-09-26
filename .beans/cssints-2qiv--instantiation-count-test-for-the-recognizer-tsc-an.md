---
# cssints-2qiv
title: Instantiation-count test for the recognizer (tsc and tsgo)
status: completed
type: task
priority: normal
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:18:37Z
parent: cssints-tmv8
---

Make the bench numbers a test, in the style of attest: assert instantiation counts per expression with a baseline subtracted, run with both `tsc` and `tsgo --ignoreConfig`, so a grammar edit that regresses `color()` fails CI.

- [x] Script that runs `--extendedDiagnostics` over `spikes/typelevel/bench/*` and compares against recorded budgets
- [x] Budgets for one `padding`, one `color`, 200 calls
- [x] Runs on tsc 5.9 and tsgo

## Summary of Changes

- `spikes/typelevel/budget.mjs`: runs tsc 5.9 and tsgo in parallel with `--extendedDiagnostics` over every `bench/*.ts`, subtracts the `bench/empty.ts` baseline (import of api, no calls), compares with `budget.json`. Fails (exit 1) when net instantiations > budget * 1.1, or when the type-error count differs from the expected count (3 for err.ts, 0 for others). Says "tighten" when a result is < 80% of budget. `--update` rewrites budgets.
- `spikes/typelevel/budget.json`: budgets per file and compiler (counts are deterministic run to run).
- `spikes/typelevel/bench/empty.ts`: baseline.
- Verified: dropping `S extends string ?` in `Valid` makes 5 of 6 benches OVER on both compilers (exit 1); adding a bad call to a bench gives "1 errors!" (exit 1). css.ts restored.

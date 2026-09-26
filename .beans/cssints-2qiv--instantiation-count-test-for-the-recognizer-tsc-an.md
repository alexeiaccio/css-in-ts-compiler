---
# cssints-2qiv
title: Instantiation-count test for the recognizer (tsc and tsgo)
status: todo
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

Make the bench numbers a test, in the style of attest: assert instantiation counts per expression with a baseline subtracted, run with both `tsc` and `tsgo --ignoreConfig`, so a grammar edit that regresses `color()` fails CI.

- [ ] Script that runs `--extendedDiagnostics` over `spikes/typelevel/bench/*` and compares against recorded budgets
- [ ] Budgets for one `padding`, one `color`, 200 calls
- [ ] Runs on tsc 5.9 and tsgo

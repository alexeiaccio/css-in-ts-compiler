---
# cssints-l8fr
title: Spike wyw-in-js 2.5.1 as the evaluation engine (risks 1-5)
status: completed
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

## Summary of Changes
- `spikes/wyw`: cssints as a wyw processor (`processor.cjs`, `lib.mjs`, `preeval.mjs`), a Vite app, and an HMR harness.
- Risks 2 (imported tokens) and 5 (`cn`/`cx`) work. Risk 1 (composition) works only through variables.
- Three wyw bugs found, each with a repro: a shared argument queue for nested usages (`fixtures/risk1.ts`, `risk1-chain.ts`), the `hybrid` strategy passing class names, and HMR invalidation consumed once per dependency (`app/hmr.mjs`, `ORDER=button-first`).
- Verdict: keep the repros as an upstream contribution, not a dependency.

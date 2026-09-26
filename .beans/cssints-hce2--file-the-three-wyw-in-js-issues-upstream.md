---
# cssints-hce2
title: File the three wyw-in-js issues upstream
status: todo
type: task
priority: low
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

Repros are in `spikes/wyw`, details are in `docs/wayfinder.md` under "Problems found in wyw-in-js 2.5.1".

- [ ] Nested usages share one argument queue (`expressionValues.ts` `shift()`); `fixtures/risk1.ts`, `risk1-chain.ts`
- [ ] `hybrid` strategy passes class names instead of values
- [ ] HMR invalidation consumed once per dependency file (`consumeInvalidation`); `app/hmr.mjs` with `ORDER=button-first`

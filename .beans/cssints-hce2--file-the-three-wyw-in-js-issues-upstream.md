---
# cssints-hce2
title: File the three wyw-in-js issues upstream
status: in-progress
type: task
priority: low
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:32:16Z
parent: cssints-tmv8
---

Repros are in `spikes/wyw`, details are in `docs/wayfinder.md` under "Problems found in wyw-in-js 2.5.1".

- [ ] Nested usages share one argument queue (`expressionValues.ts` `shift()`); `fixtures/risk1.ts`, `risk1-chain.ts`
- [ ] `hybrid` strategy passes class names instead of values
- [ ] HMR invalidation consumed once per dependency file (`consumeInvalidation`); `app/hmr.mjs` with `ORDER=button-first`

## Findings (2026-09-26). Drafts ready, posting pending approval

- [x] 2.5.1 is still the latest (npm `latest`). Upstream `main` HEAD is the 2.5.1 release commit `2ee2b73`, so all code paths are unchanged.
- [x] Minimal repros without cssints (inline processor via `tagResolver`) in `spikes/wyw/issues/repro/`. All three still reproduce (spike fixtures and minimal repros).
- [x] Bug 1 (nested arg queue): no duplicate found (searched nested/arguments/chain/buildParams/expressionValues, open and closed). Queue order confirmed: `["css.items(\"center\")","\"center\"","css.justify(\"end\")","\"end\""]`. Draft: `spikes/wyw/issues/1-nested-arg-queue.md`. **Recommend filing.**
- [x] Bug 2 (hybrid): no duplicate. Related: #362 (preeval-call manifest, gets args only and no member name, not in website docs) and #367/#373 (execute-mode static override, a different path). Verdict: bug. hybrid feeds `processor.value` (the runtime value) into outer calls instead of the eval-time replacement, and ignores `getStaticValue` → `unresolved` (sameFileStaticValues.ts L236-247). Draft: `spikes/wyw/issues/2-hybrid-strategy.md`. **Recommend filing (low severity).**
- [x] Bug 3 (HMR): already fixed by commit `180bccb7` "retain shared dependency changes for every consumer" in open PR #427 (targets the #424 branch, not main, and is unreleased). The real cause is in cache.ts: the first consumer's `didDependencyChange` refreshes the shared dependency hash, so later consumers see "unchanged". It is NOT `consumeInvalidation`, so the wayfinder note is inaccurate. A 1-line Vite plugin workaround (also invalidate `target.id` in handleHotUpdate) was verified locally. Draft is a comment for #427: `spikes/wyw/issues/3-hmr-invalidation.md`. **Recommend no new issue.**
- [ ] Post issue 1 and issue 2, and the comment on #427 (awaiting user approval)

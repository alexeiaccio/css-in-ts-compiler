---
# cssints-68te
title: Prototype own engine on Vite Module Runner
status: completed
type: task
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T08:10:17Z
parent: cssints-tmv8
---

## Summary of Changes
- `spikes/runner/plugin.mjs` (~180 lines): oxc finds maximal `css.*` calls, the ssr runner evaluates them, magic-string replaces them, and `hotUpdate` walks the module graph. Effect is used only in the evaluate step (`Effect.fn`, 30 s timeout, tagged error).
- `cssints/` is split into `macro.mjs` (eval time), `runtime.mjs` (ships, `cx`/`_cv` only) and `lib.mjs`.
- All 7 fixtures pass (`node run.mjs fixtures/*.ts`). HMR is fresh in both request orders, unlike wyw.
- Known gap: no shaker, so `fixtures/risk6.ts` fails (tracked separately).

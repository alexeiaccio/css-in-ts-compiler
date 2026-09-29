---
# cssints-grrd
title: 'Engine build cost at scale: serialized evaluation and library re-evaluation'
status: completed
type: task
priority: normal
tags:
    - wayfinder:research
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:51:01Z
parent: cssints-vy0o
---

## Question

Since `cssints-hdui` the plugin evaluates one module at a time from a cleared runner, and re-evaluates the cssints library (twin, BCD, browserslist) on every transform. What does this cost on a real-sized app?

- Generate an app with 50, 200 and 500 modules that use `css.*` and shared token modules. Measure `vite build` time and dev cold-start, and the time spent per transform in evaluate versus instrument.
- Profile what re-evaluation costs: the library import, `mdn.ts` parsing, and BCD loading.
- Can library modules be kept across evaluations (externalized, or never cleared) without breaking the Quint invariants? Check against `test/spec/runner.qnt` and `race.mjs`.

Answer with numbers and the cheapest change that keeps `servedFresh` true.

## Resolution

Findings: [docs/research/engine-cost.md](../docs/research/engine-cost.md). Harness: `packages/cssints/test/perf.mjs` (generate an app of N modules; measure dev, seq, build; `PLUGIN=` for A/B).

**Numbers (before → after keeping the library in the runner, median of 3, M2 under load):**

| modules | `vite build` CLI | dev cold start (all modules) |
| --: | --: | --: |
| 50 | 1814 → 982 ms | 1159 → 728 ms |
| 200 | 4384 → 1979 ms | 3053 → ~1400–2600 ms (noisy) |
| 500 | 9728 → 4691 ms | 9101 → 5211 ms |

- Evaluation is ~90% of plugin time and linear in N (serialized): ~18 ms/module before, ~9 ms after.
- Per warm transform (500 modules): instrument 0.15 ms ×2, evaluate 12.6 → 4.7 ms, replace ~0.4 ms.
- Per evaluation: library module bodies 3.9 → 0.3 ms. App bodies 8.0 → 4.1 ms: they call twin, which lost its `parsed` memo and JIT feedback on every clear. cpu-prof: twin `next`/`consume` 935 → 92 ms over 200 transforms.
- BCD and browserslist load through Node `require`, once per process (the first evaluation, 250–500 ms); they were never re-loaded. mdn.ts module body: 0.35 ms per evaluation.

**Recommendation (prototyped on research/perf; plugin.mjs changed):** clear only app modules. `clearApp()` keeps the import closure of `src/index.mjs` in the runner and drops every other node. runner.qnt is unchanged: its `FILES` and `clear` cover app modules only, and the library imports no app module. `bun run test` (race.mjs, hmr) is green, mbt passes 40×12, and the build output is byte-identical. Negative control: with no clearing at all, race.mjs still passes but the fixtures fail, so clearing app modules is required and clearing the library is not. Next step only if ~9 ms/module is too slow: stop re-evaluating unchanged app ancestors (needs invalidation tracking, the race surface of cssints-hdui).

---
# cssints-lfoi
title: Engine performance on sky as a real component tree
status: completed
type: task
priority: normal
created_at: 2026-10-03T12:48:57Z
updated_at: 2026-10-03T13:59:01Z
---

Asked by the user (2026-10-03). The last measurement was in 0.1 (packages/cssints/test/perf.mjs, demo-sized). Measure on apps/sky: cold build, dev cold start and first page, HMR latency on a style edit and a component edit, per-module transform cost (top modules), share of time in the Module Runner eval vs oxc walk vs twin checks vs LightningCSS vs sheet render, type-check cost (tsgo/tsc instantiations of sky's src) and editor latency (bench/lsp.mjs on a sky file). Profile, name the hot spots, fix clear wins outside files another session is editing, report the rest as follow-ups.

## Summary of Changes

Measured with `apps/sky/scripts/perf.mjs` (build, dev, profile, types; not in `bun run test`; median of 5 fresh processes). M2, 8 cores, 16 GB, Node 24.21. Before → after on a quiet machine:

| | before | after |
|---|---:|---:|
| `vp build` (CLI, cold process) | 1589 ms | 1373 ms |
| `build()` in process | 944 ms | 696 ms |
| same build with the plugin replaying recorded output (no engine work) | 122 ms | 121 ms |
| engine's share of the build | 87% | 83% |
| 17 modules with sites in sequence on a dev server | 1111 ms | 700 ms |
| first module (cold library) / median of the rest | 400 / 39 ms | 346 / 21 ms |
| dev: first page (server up, `/`, nav up, network idle) | 2.3–2.4 s | 1.9 s |
| HMR, style edit, write to DOM | 319 ms | 119 ms |
| HMR, component edit, write to DOM | 331 ms | 118 ms |
| tsgo, sky's tsconfig: total / instantiations | 2.6 s / 10.1 M | 0.85 s / 2.4 M |
| tsc 5.9: total / instantiations | 10.2 s / 7.3 M | 4.5 s / 1.2 M |
| editor (tsgo LSP, Shell.tsx) diagnostics after an edit | 1.7–1.9 s | 0.28 s |

Where the engine's time goes (profile of the 17 modules): the first module pays about 350 ms to load the engine (Vite's ssr transform of the engine's own TypeScript sources, 170 ms, and compiling and loading its modules; a published dist avoids part of it). Each later module costs 21 ms (3 ms per site). Buckets after the fixes: Module Runner loading and running bodies 41%, Vite fetch and ssr transform 25%, engine library 10%, idle/GC 9%, twin checks 7%, oxc walk 5%, support warnings 2%, LightningCSS lowering, sheet render and the sheet's LightningCSS pass under 1%. Before: support warnings 10%, icons() 5%, twin 6%.

Fixes, each its own commit: support warnings and the twin/prose checks once per declaration (they were repeated at every evaluation of a module that imports the theme); `icons()` parses an iconify collection once per file version; the evaluation runner maps stacks on demand (Vite's default turned on Node's source map cache); a token of unknown type (any token from a JSON import) is one sentinel `⟨*⟩` for the type recognizer instead of a union of 12 (a call's parts are joined per combination: 12^n strings, three in `grid-template-columns` took 3.9 s, four hit TS2589); `test/perf.mjs` works again (the plugin's transform is `{ order, handler }`).

Not done: the app closure is still evaluated again for every module (the cssints-hdui race surface); the sheet reloads once per module in a cold dev page load (2.5 ms each, 17 times: not worth a debounce).

- [x] build, dev, HMR, per-module, type and editor numbers
- [x] profile and hot functions named
- [x] clear wins fixed, rerun perf.mjs (200 modules: median evaluation 5.8 → 4.1 ms)
- [x] repeatable script

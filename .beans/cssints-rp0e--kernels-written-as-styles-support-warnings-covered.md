---
# cssints-rp0e
title: 'Kernels written as styles: support warnings covered by runtime polyfills; var(--_x) in messages'
status: completed
type: bug
priority: normal
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T15:16:49Z
---

Found by squircle, reveal, balance and stuck (cssints-pvfo, cssints-qhug, cssints-q6il, cssints-z1hd under "## Engine gaps"). cssints-mz30 made a kernel's `requires` covered by a runtime's `polyfills`, but a kernel written as styles warns per declaration (`corner-shape`, `text-wrap`, `container-type: scroll-state`, `animation-timeline`) and those warnings ignore the runtime. All four plugins fell back to raw-CSS kernels with explicit `conflicts`, losing derived conflicts. The warning text also prints `var(--_g)` unexpanded.

## Todo
- [x] a declaration's support warning in a styles kernel is covered by the polyfills of a runtime the member uses (same rule as requires)
- [x] expand `--_x` in warning messages
- [x] move squircle, reveal, balance and stuck back to styles kernels with derived conflicts

## Summary of Changes

- One rule, `uncovered(feature, off, runtimes)` in packages/cssints/src/delivery.ts: a runtime of the style that polyfills the BCD key covers the targets it reaches (`unreached`: CSS and `script` every target, `parentVars` those with @property). `addKernel` (kernel.ts) applies it to `requires` and to the support warnings of a styles kernel's declarations. Matching is by exact key.
- `kernelOf` (macro.ts) collects those warnings through a sink in `checkNow` instead of recording them; scope-engine.ts expands `--_x` in their values and keeps them with the kernel (`kernelWarnings`, a WeakMap); `addKernel` weighs them once per registration. User styles' per-declaration path is unchanged (perf.mjs A/B within noise).
- Errors of a styles kernel's declaration print `--<scope>-x` too.
- Packages: squircle (core as styles; runtime polyfills corner-shape and corner-shape.squircle; derived conflicts replace the explicit entry), reveal (the raw `&&` view kernel folded into core: a shorthand prints before its longhands; derived conflicts now list animation-timeline and animation-range), balance (`balance()` as styles with derived conflicts, runtime polyfills text-wrap and text-wrap.balance), stuck (core as styles, derived conflicts, requires kept for the queries).
- Kept raw: balance's `pretty()` kernel. Written as styles it warns for text-wrap, and no runtime should cover it (pretty degrades on purpose), so it keeps its explicit conflicts entry.
- Tests: plugins.mjs (covered warning, expanded var in warning and error), package conflict tests with the new derived messages; test:browsers green in squircle, reveal, balance, stuck and cssints.
- Docs: API.md Plugins (requires paragraph), the four READMEs, wayfinder entry.

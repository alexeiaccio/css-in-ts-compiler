---
# cssints-grrd
title: 'Engine build cost at scale: serialized evaluation and library re-evaluation'
status: todo
type: task
tags:
    - wayfinder:research
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T13:28:04Z
parent: cssints-vy0o
---

## Question

Since `cssints-hdui` the plugin evaluates one module at a time from a cleared runner, and re-evaluates the cssints library (twin, BCD, browserslist) on every transform. What does this cost on a real-sized app?

- Generate an app with 50, 200 and 500 modules that use `css.*` and shared token modules. Measure `vite build` time and dev cold-start, and the time spent per transform in evaluate versus instrument.
- Profile what re-evaluation costs: the library import, `mdn.ts` parsing, and BCD loading.
- Can library modules be kept across evaluations (externalized, or never cleared) without breaking the Quint invariants? Check against `test/spec/runner.qnt` and `race.mjs`.

Answer with numbers and the cheapest change that keeps `servedFresh` true.

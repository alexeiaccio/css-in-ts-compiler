---
# cssints-rp0e
title: 'Kernels written as styles: support warnings covered by runtime polyfills; var(--_x) in messages'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T14:53:19Z
---

Found by squircle, reveal, balance and stuck (cssints-pvfo, cssints-qhug, cssints-q6il, cssints-z1hd under "## Engine gaps"). cssints-mz30 made a kernel's `requires` covered by a runtime's `polyfills`, but a kernel written as styles warns per declaration (`corner-shape`, `text-wrap`, `container-type: scroll-state`, `animation-timeline`) and those warnings ignore the runtime. All four plugins fell back to raw-CSS kernels with explicit `conflicts`, losing derived conflicts. The warning text also prints `var(--_g)` unexpanded.

## Todo
- [ ] a declaration's support warning in a styles kernel is covered by the polyfills of a runtime the member uses (same rule as requires)
- [ ] expand `--_x` in warning messages
- [ ] move squircle, reveal, balance and stuck back to styles kernels with derived conflicts

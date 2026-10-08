---
# cssints-z1hd
title: 'stuck(): sticky state via @container scroll-state() with an observer fallback'
status: todo
type: feature
priority: normal
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T08:55:57Z
parent: cssints-dk1q
---

## What
A condition-like member `stuck(styles)` that applies styles when a sticky element is stuck: `@container scroll-state(stuck: top)` natively (Chrome 133), else an IntersectionObserver on the shared parent-vars runtime that sets a data attribute.

## Sources
- https://github.com/bramus/sticky-observer

## Shape
- kernel: `container-type: scroll-state` + rule; runtime: `polyfills: ["css.at-rules.container.scroll-state"]`, parentVars-style watch.

## Todo
- [ ] native rule
- [ ] observer runtime
- [ ] fixture

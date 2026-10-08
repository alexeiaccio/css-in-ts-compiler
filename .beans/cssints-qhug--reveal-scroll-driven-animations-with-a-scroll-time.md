---
# cssints-qhug
title: 'reveal(): scroll-driven animations with a scroll-timeline polyfill'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T13:45:03Z
parent: cssints-dk1q
blocked_by:
    - cssints-11pj
---

## What
`reveal().preset("fade-up").range("entry 0% entry 100%")`: `animation-timeline: view()` natively, flackr's scroll-timeline polyfill as the runtime for targets that lack it.

## Sources
- https://github.com/the-illarionov/the-supersonic-plugin-for-scroll-based-animation
- https://github.com/alexfoxy/lax.js
- https://github.com/bramus/ie-page-transitions (view transitions, a later member)

## Shape
- builds on motion()'s presets; `polyfills: ["css.properties.animation-timeline"]`.

## Todo
- [x] kernel + chain
- [ ] runtime entry with the polyfill
- [x] fixture

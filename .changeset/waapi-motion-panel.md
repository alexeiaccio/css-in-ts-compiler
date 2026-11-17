---
"@cssints/devtools": minor
---

The panel has a Motion section: what the page is running, read from `document.getAnimations()` (CSS transitions included) —
the properties each keyframe sets, the duration and easing, the `animation-name` or transitioned property, the
pseudo-element and the play state. Two controls beside it: **slow motion ×0.25**, which puts every running animation at a
quarter speed and back, and **reduced motion preview**, which finishes them all — what a reader with
`prefers-reduced-motion: reduce` sees. The list is read on the panel's 600 ms timer, so it costs no frame loop and is not a
live region.

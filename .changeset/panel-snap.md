---
"@cssints/headless": minor
---

`createResizablePanels` takes `snap`: a divider learns the width it is dropped at — a mark per
release, weighted by recency on a half-percent grid — and sticks to it once about three drags agree,
inside a 10 px zone. The point is sticky, Alt asks for the exact width, the keys never snap, and
`snapPoint(index)` is the learned width for a skin that marks it.

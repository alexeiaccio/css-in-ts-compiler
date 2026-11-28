---
# cssints-boq9
title: 'graph-layout: the skin draws a self loop'
status: todo
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T10:28:10Z
parent: cssints-a65d
---

The engine returns a self loop as a bracket on the node's right border; the skin draws every edge between two boxes and has no
loop case, so a loop in a diagram is invisible today.

- [ ] `shapeBetween` (and the four shapes) accept `from === to`: a loop out of the right border and back, in the same style as
  the other edges, with its label placed outside the loop
- [ ] the diagram starter's flow gets a `retry` loop on `paid`, and the Chrome test counts its line and its label
- [ ] the crossing break (`crossingsOf`) treats a loop like any other segment

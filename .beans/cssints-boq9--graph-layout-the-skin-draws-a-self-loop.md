---
# cssints-boq9
title: 'graph-layout: the skin draws a self loop'
status: completed
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T11:19:47Z
parent: cssints-a65d
---

The engine returns a self loop as a bracket on the node's right border; the skin draws every edge between two boxes and has no
loop case, so a loop in a diagram is invisible today.

- [x] `shapeBetween` (and the four shapes) accept `from === to`: a loop out of the right border and back, in the same style as
  the other edges, with its label placed outside the loop
- [x] the diagram starter's flow gets a `retry` loop on `paid`, and the Chrome test counts its line and its label
- [x] the crossing break (`crossingsOf`) treats a loop like any other segment

## Summary of Changes

- `apps/ui/src/registry/route.ts`: `shapeBetween` asks `sameBox(from, to)` first and returns `loopBetween(shape, box)` — a 20 px bracket off the right border between `centre - 8` and `centre + 8`, the arrow head on the end that returns, and `points` the same polyline the `d` is drawn from, so `crossingsOf` reads it like any line. `straight` and `step` keep sharp corners, `smoothstep` uses the 12 px corner rule, `bezier` is one cubic whose controls sit 24 px out (bulge 20). The label sits beside the mouth at `right + 28`, baseline `centre + 28`: outside the box, off the loop's line, and below the label of an edge leaving the same border.
- `apps/ui/src/registry/diagram/diagram.tsx`: the visible line path carries `fill: none` (an open path is filled as if closed, so a loop's bracket was a solid rectangle) and `data-part="diagram-line"`; the pending link draws no line when its target is the node it leaves.
- `apps/ui/src/registry/diagram/layout.ts`: the starter lays the graph out with 64 px layers (`place`'s `{ layers }`), because the engine's 30 leaves no room for a label — a word at `sizeSm` is 27 px.
- `apps/ui/src/registry/diagram/diagram.fixture.tsx`, `diagram.stories.tsx`: `STARTER_EDGES` gains `{ id: "retry", from: "paid", to: "paid", label: "retry" }`, so the starter and its story show the loop.
- `diagram.browser.test.tsx`: four tests — the loop in all four shapes (start point, `C`/`Q`, arrow tip, label `x`/`y` and `text-anchor`), a loop fired from its own label, `crossingsOf` with a loop crossed in both draw orders, and the starter's loop (its `d`, its 20 x 16 bbox, `aria-label` "retry: Paid → Paid", `tabindex="-1"`, its cutout, and its label clear of every node box before and after `Lay out`). The starter's `from.x < to.x` walk skips the loop.
- Left out: two loops on one node (the router keeps one loop per node), and a loop's own port — every edge still leaves one border midpoint, so a loop's ear crosses the stem of each edge that leaves it and shares the gap with their labels.
- Gates: apps/ui 73 files / 1 045 tests, `test:site` ok at 121 untracked reads (budget unchanged), typecheck + skin + theme, `catalog` byte-identical, lint, `diff:check` clean.

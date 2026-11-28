---
# cssints-mamm
title: 'graph-layout: ports on the border, beyond the midpoint'
status: completed
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T10:40:40Z
parent: cssints-a65d
---

A node's edge leaves at the border's midpoint, so two edges from one node share their first stem — one of the two places the router
allows a shared line (the other is a channel corridor). Ports spread the anchors along the border, ordered by where each route
goes, so siblings leave at different heights.

- [x] `Placement`/`route`: one anchor per edge on the border, ordered by the edge's y at the next layer (deterministic, no
  collection in the spec), a side chosen by the route's direction
- [x] the first/last stem then never overlaps another route's stem: the routing test's "shared segment outside a port" check
  becomes "shared segment only inside a channel"
- [x] the skin's `shapeBetween` takes the anchor instead of the midpoint
- [x] an oracle: elk-rs with `elk.portConstraints: FIXED_SIDE` on the six graphs — the ports' order, not their pixels


## Summary of Changes

`route` gives every edge its own port. A node's outgoing edges get evenly spaced anchors along its right border, ordered by the
height each leaves with; its incoming edges the same along the left, ordered by the height each arrives with. A node with one edge
keeps the midpoint. The diamond: `a>b` at 26.67, `a>c` at 33.33 of a 20 px border.

Measured over the 120-graph corpus: shared corridors **262 → 5** bundled segment pairs (only the channel's remain, which is the
corridor a subway map draws once), drawn crossings 168 against 539 at the model order (69% fewer), and the routing test's
"shared segment outside a port" exception is gone — the assertion is now "only inside a channel".

Oracle: `test/elk-placement.mjs` gained a ports section with `elk.portConstraints: FIXED_SIDE`. Every route leaves the east border
and arrives at the west, as ELK models it. The order agrees for 13 of 24 outgoing lists and 10 of 24 incoming; the deviation is
stated in the code and the wayfinder — ELK orders a target's ports by the edge declaration, the engine by the arriving height.

The Chrome test that measures a route as an SVG path needed the DOM's float32 precision: the length is compared at three decimals
and the start point with `toBeCloseTo`.

Gates: package 8 scenarios + the ELK boxes and ports + 400 + 120 + 120 seeded graphs + 9 browser tests, lint 0/0, typecheck 15
files, lint:comments clean. Next child: `cssints-boq9` (the skin draws a self loop) or `cssints-m0f0` (octilinear).

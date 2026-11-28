---
# cssints-xfma
title: 'graph-layout: placement — a box per node, spacing, linear segments'
status: completed
type: feature
priority: normal
tags:
    - layout
created_at: 2026-11-27T20:27:36Z
updated_at: 2026-11-28T09:23:31Z
parent: cssints-sw9a
blocked_by:
    - cssints-cj4i
---

Ordering gives slots; this gives boxes.

- [x] `x` from the layer and the layer spacings, `y` from the slot; `spacing` (node-node, layer-layer) as a config with
  sane defaults, `node` sizes from the graph
- [x] linear segments: two sweeps moving a node's `y` to the median of its neighbours' borders, then centring per layer;
  ranks are the fallback when a node has no neighbours
- [x] invariants as property tests: no two boxes overlap, the gaps are at least the spacing, every edge's source is left of
  its target, a translated or rotated layout is the same layout (symmetry checks: a mirrored graph mirrors)
- [x] the spec's six graphs: the boxes compared to elk-rs under `nodePlacement.strategy: SIMPLE` (or the closest strategy
  whose result is a function of the input — probe first, record the choice)

Done when: no overlaps on the corpus, the six graphs match elk's boxes (or the deviation is documented), and the numbers are
recorded.


## Summary of Changes

`place(graph, layout, spacing?)` gives every slot a box. A layer is a column at its own x, its slots stack with
`spacing.nodes`, the columns are `spacing.layers` apart, and sizes come from `graph.sizes` — a node without one is a point, and
so is every dummy. Then the boxes move toward the median of their neighbours' centres (forward, backward, twice), each layer
settles onto its neighbours as one piece, and a dummy is put on the straight line between the two nodes its edge joins, clamped
into the gap of the layer it crosses — where the router will pass through it.

Two findings that the numbers forced:

- centring each layer against the tallest one broke the alignment the passes had just made (spec graph 1 stayed 20 px off);
  settling a layer by the median of its *offsets* to its neighbours fixed three of the six graphs at once;
- a dummy is not a box to align: leaving dummies out of the alignment and interpolating them between their edge's ends made the
  long edge (pick 4) and the three-cycle (pick 6) perfectly straight.

Compared with elk-rs under `nodePlacement.strategy: SIMPLE` (the only placement that is a function of the input): columns agree
on all six graphs, no overlaps on either side, and the total edge deviation is 80 px for the engine against 102 for ELK — five
of six graphs perfectly straight. `test/elk-placement.mjs` is that comparison and fails on a column mismatch, an overlap, or a
less straight placement. `test/placement.mjs` holds the invariants over 7 shapes and 120 seeded graphs. `place` costs 31 µs a
graph over the 1000-graph corpus.

Gates: package 8 scenarios + the ELK boxes + 400 + 120 seeded graphs + 8 browser tests, lint 0/0, typecheck 13 files,
lint:flakes and lint:comments clean, diff:check only the bun.lock key-file warning (`@openedges/elk-layout` is a dev dependency
of the engine now, for the comparison). Next: `cssints-i6pb` (routing).

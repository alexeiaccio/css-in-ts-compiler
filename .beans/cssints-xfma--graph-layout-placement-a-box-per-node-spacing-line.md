---
# cssints-xfma
title: 'graph-layout: placement — a box per node, spacing, linear segments'
status: todo
type: feature
priority: normal
tags:
    - layout
created_at: 2026-11-27T20:27:36Z
updated_at: 2026-11-27T20:27:36Z
parent: cssints-sw9a
blocked_by:
    - cssints-cj4i
---

Ordering gives slots; this gives boxes.

- [ ] `x` from the layer and the layer spacings, `y` from the slot; `spacing` (node-node, layer-layer) as a config with
  sane defaults, `node` sizes from the graph
- [ ] linear segments: two sweeps moving a node's `y` to the median of its neighbours' borders, then centring per layer;
  ranks are the fallback when a node has no neighbours
- [ ] invariants as property tests: no two boxes overlap, the gaps are at least the spacing, every edge's source is left of
  its target, a translated or rotated layout is the same layout (symmetry checks: a mirrored graph mirrors)
- [ ] the spec's six graphs: the boxes compared to elk-rs under `nodePlacement.strategy: SIMPLE` (or the closest strategy
  whose result is a function of the input — probe first, record the choice)

Done when: no overlaps on the corpus, the six graphs match elk's boxes (or the deviation is documented), and the numbers are
recorded.

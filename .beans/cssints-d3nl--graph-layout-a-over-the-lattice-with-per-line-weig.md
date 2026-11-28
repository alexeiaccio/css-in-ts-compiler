---
# cssints-d3nl
title: 'graph-layout: A* over the lattice with per-line weights'
status: completed
type: task
priority: deferred
tags:
    - layout
created_at: 2026-11-28T15:16:38Z
updated_at: 2026-11-28T15:33:30Z
parent: cssints-a65d
---

The metro-map router the octilinear slice left behind: route the shortest paths first, then inflate the weight of the lattice edges the earlier lines used, so a corridor bundles instead of opening a new track, and crossings become a cost rather than an accident.

- [x] `route(..., { router: "lattice" })`: A* per layer boundary over a lattice of the channel, the existing channel router the default and the reference
- [x] the cost: length, bends, reused lattice edges (the per-line weight inflation) and crossings against the routes already drawn
- [x] the invariants hold per boundary: monotone x, entry and exit exactly on the ports, one crossing per boundary, no segment through a box, determinism
- [x] measured against the channel router and the octilinear one: drawn crossings, bundled corridor pairs, bends, length, µs
- [x] the negative finding recorded if bundling costs crossings, or the option dropped if it buys nothing


## Summary of Changes

`route(graph, layout, boxes, { router: "lattice" })` is the A\* router the octilinear slice left behind, with `"channels"` the default and byte-identical (the routing, octilinear, label and cluster suites print their old numbers). A channel's lattice is its columns at a 6 px pitch with both edges kept and its rows the height of every slot on both sides plus a uniform 6 px grid the drawing shares; a move is right, up, down or, with `directions: 8`, either 45° diagonal, never left, so a path is monotone in x and crosses each boundary once. The cost is `length + bends·20 + reused·wReuse + crossings·wCross`, the edges routed shortest port-to-port first, the weights exposed as `RouteOptions.lattice`; ports, band heights, `borders` and loops are the channel router's, and an edge that touches a cluster keeps the channel path.

Over the 120-graph corpus: **2 drawn crossings, 170 bundled corridor pairs and 624 bends** against the channel router's 168, 5 and 730, the same 37 682 px, 506 µs a graph against 9.2 and the pipeline 546 against 58 µs. Eight directions draw 16 crossings, 77 bundles and 654 bends in 35 599 px (−5.5%), and the six spec graphs go from 8 bends to 4, 5 and 5 on picks 2, 4 and 6. The sweep (`wReuse` 0, 2, 5, 10 × `wCross` 0, 5, 20 at `wBend` 20) gives 2/170 crossings/bundles at 0, 97/15 at 2, 112/4 at 5, 114/2 at 10, so the per-line inflation separates lines rather than bundling them and the default is (0, 20); `wBend` 20 halves the eight-direction bends (762 → 654) and leaves four directions unchanged. The win is the shortest-first order and the shared rows, not the weight table; at nine times the pipeline the lattice is an option, not the default.

New: `src/lattice.ts`, `test/lattice.mjs` (8 shapes, 120 seeded and 120 two-level graphs, the label case, the sweep and the comparison), `test/geometry.mjs` (the shared geometry the octilinear, cluster and lattice suites read), the README section and this bean. Not done: the MIP oracle (a solver dependency), a lattice over the whole drawing, crossing costs against other channels, and re-solving the ports or the band heights.

---
# cssints-m0f0
title: 'graph-layout: octilinear routing, the metro map'
status: completed
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T10:58:37Z
parent: cssints-a65d
---

The metro-map drawing: eight directions instead of four, with the bundling the corridors already suggest. The research is in
`docs/research/edge-routing.md` (Kindermann's lecture, the mixed-integer program as the quality oracle, A* with per-line weights
as the cheap implementation).

- [x] the route type already holds any polyline; the invariants become per direction set: 4 for orthogonal, 8 for octilinear
- [ ] A* over the lattice with per-line weight inflation, shortest routes first, reported by the same measure anvaka's harness
  uses: the largest graph still answered inside a frame
- [x] the octilinear step as a strategy behind the same `route`
- [x] numbers: bends per route, angular resolution at a node, edge lengths — the metro map's quality measures — and the bundle
  count (262 today) against the swept corpus (bends, lengths, bundle count and crossings; angular resolution is deferred with
  the A\* because the port model makes every same-side stem horizontal and parallel)
- [ ] the mixed-integer program is the quality oracle for the six spec graphs, not a dependency

## Summary of Changes

`route(graph, layout, boxes, { directions: 8 })` is the octilinear option; `directions: 4` is the default and byte-identical to
the previous drawing. Channels, per-edge tracks, ports and the horizontal bands at the slot heights are unchanged; a jog becomes
one 45° segment from the edge's own track to the right when the height it changes fits before the next layer's boxes, and
stays vertical otherwise. The diagonal ends strictly inside the channel, which keeps both stems horizontal and every dummy
crossed horizontally.

`test/octilinear.mjs` runs the eight shapes and the 120 seeded graphs through the option and asserts the direction set
(horizontal, vertical or `|dx| = |dy|` within 1e-9), monotone x, one contiguous pass per boundary, no segment through a box,
one anchor per edge, both stems horizontal, each diagonal replacing a vertical, and the bend count equal to the orthogonal
route's. The orthogonal suite is untouched.

Measured over the 120-graph corpus (swept layouts; four directions against eight): 1 203 segments either way, 96 of 365 jogs
diagonalised (8% of segments), **730 bends either way**, route length 37 682 → 37 200 px, drawn crossings 168 → 174 (right-angle
pairs 156, 18 involving a diagonal), bundled pairs 5 → 4. Model order: 790 bends either way, 539 → 545 crossings, 18 → 16
bundles. Six spec graphs: 6 of 12 jogs diagonal, length 907 → 879 px, bends and crossings unchanged. `bench` on this machine:
`route` 26.1 µs a graph (14.8 edges, ~1.8 µs a route), the eight-direction run 25.3, medians of five rounds.

The finding: the diagonal moves a bend, it does not remove one (horizontal → diagonal → horizontal is the same two turns), it
cuts the corner for 1.3% shorter routes, and it costs six drawn crossings while giving up one bundled corridor. Angular
resolution is not measured here because the port model makes every same-side stem horizontal and parallel; it belongs with the
A\* slice, which is the step that can remove bends and bundle corridors, with the Nöllenburg–Wolff mixed-integer program as the
oracle for the six spec graphs and never as a dependency.

---
# cssints-m0f0
title: 'graph-layout: octilinear routing, the metro map'
status: todo
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T10:28:10Z
parent: cssints-a65d
---

The metro-map drawing: eight directions instead of four, with the bundling the corridors already suggest. The research is in
`docs/research/edge-routing.md` (Kindermann's lecture, the mixed-integer program as the quality oracle, A* with per-line weights
as the cheap implementation).

- [ ] the route type already holds any polyline; the invariants become per direction set: 4 for orthogonal, 8 for octilinear
- [ ] A* over the lattice with per-line weight inflation, shortest routes first, reported by the same measure anvaka's harness
  uses: the largest graph still answered inside a frame
- [ ] the octilinear step as a strategy behind the same `route`
- [ ] numbers: bends per route, angular resolution at a node, edge lengths — the metro map's quality measures — and the bundle
  count (262 today) against the swept corpus
- [ ] the mixed-integer program is the quality oracle for the six spec graphs, not a dependency

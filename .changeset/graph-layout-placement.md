---
"@cssints/graph-layout": minor
---

Placement: `place(graph, layout, spacing?)` turns a layout into boxes. A layer is a column at its own x, its slots stack with
`spacing.nodes`, the columns are `spacing.layers` apart, and the sizes come from `graph.sizes` — a node without one is a point,
and so is every dummy. The boxes then move toward the median of their neighbours' centres and each layer settles onto its
neighbours as one piece; a dummy is put on the straight line between the two nodes its edge joins and clamped into the gap of
the layer it crosses, which is where the router will pass.

Over the specs' six graphs the placement is at least as straight as elk-rs with `nodePlacement.strategy: SIMPLE` — 80 px of
total edge deviation against 102, five of the six graphs perfectly straight — with the same columns and no overlapping boxes.
`test/placement.mjs` checks the invariants over 7 shapes and 120 seeded graphs, and `test/elk-placement.mjs` is the
comparison, which fails if the columns differ, a box overlaps, or the placement is less straight than ELK's. A placement over
the 1000-graph corpus costs 31 µs.

---
"@cssints/graph-layout": minor
---

A graph can name clusters: `graph.clusters` is `{ id, members }`, one level deep, and the layering stays hierarchy-agnostic —
every node keeps the longest-path layer it had without the clusters (ELK's `INCLUDE_CHILDREN` reading, not a cluster as a node
of its own layer). A cluster buys four things: its members sit in one contiguous block of every layer's slots (the sweep orders
blocks by the mean barycentre and never swaps across a block), `clusterBoxes` reports a box that holds its members and no
stranger (`place` pushes one away until it finds none, or throws), and an edge with one end inside crosses the border once, at a
port of its own that `route` reports as `borders`. Two new suites hold it: `test/clusters.mjs` over 5 shapes and 120 random
two-level graphs, and `test/elk-compound.mjs` against elk-rs with `INCLUDE_CHILDREN`. A graph with no clusters lays out,
places and routes byte-identically to before.

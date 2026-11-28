---
"@cssints/graph-layout": minor
---

A second layering strategy. `assignLayers(graph, "minimize-length")` and `layout(graph, { layering: "minimize-length" })`
run the same phases over layers chosen for the total length of the edges — `Σ (layer(target) − layer(source))` over the
dummy-expanded graph — instead of the earliest layer every node can take; the default is `longest-path` and byte-identical.
Longest path is not always the shortest drawing: `a→b` beside `x1→x2→b`, in the model order `a, x1, x2, b`, spans 4 at
`a=0` and 3 at `a=1`.

The solver is a relaxation, not the exact min-cost flow: from the longest path it raises a node with more out-edges than
in-edges into the highest layer its successors leave free, in reverse model order, until no single node can move. Each move
shortens the sum by at least one and keeps every edge forward, so it terminates at a fixpoint — not necessarily the optimum.
Brute force over every feasible layering of 411 graphs of up to 7 nodes finds it optimal on all 411; elk-rs with
`elk.layered.layering.strategy: NETWORK_SIMPLEX` agrees on the specs' six graphs in layers and span, and over 60 seeded
graphs of up to 40 nodes agrees in layers with a span of 153 against 149 (two graphs are 2 longer).

Over the 120-graph corpus the layer count stays 239, while dummies fall from 80 to 59, span from 459 to 438 and crossings
from 65 to 55 after the sweep, with 12 graphs laid out shorter than the default. `assignLayers` costs 11.98 µs a graph
against 2.11 and `layout` 19.57 against 8.75, while the whole pipeline is 375.34 µs against 432.25 against the sweep's fewer
dummies. `test/layering.mjs` holds the invariants for both strategies and both oracles.

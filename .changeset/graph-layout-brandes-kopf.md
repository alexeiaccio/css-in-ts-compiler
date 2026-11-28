---
"@cssints/graph-layout": minor
---

A second placement behind the same `place`: `place(graph, layout, spacing, { placement: "brandes-kopf" })` runs Brandes and
Köpf's horizontal coordinate assignment on the y coordinate — four vertical alignments (layers down and up, each resolved
leftmost and rightmost) with type-1 conflict marking, a block-graph longest path per alignment, and the balancing step that
anchors the narrowest assignment and takes the mean of the middle two coordinates — while `"median"` stays the default and
byte-identical. Dummies are put on the straight line between their edge's ends and clamped into their slot's gap exactly as
before. The option lowers the edge deviation over the 120-graph corpus from 15 805 px to 13 772.5 (−12.9%, better on 14
graphs, worse on 16) and raises it on the specs' six graphs from 80 to 140, at 120.46 µs a graph against 33.68; elk-rs with
`nodePlacement.strategy: BRANDES_KOEPF` totals 113.3 on the six and 2 726.5 over 60 seeded graphs against 3 192.5 here, on
its own slot order. `test/brandes-kopf.mjs` holds both strategies to the placement invariants and prints the comparison;
`test/bench.mjs` has the row. Since the change only adds an option and leaves the default untouched, the change is a minor.

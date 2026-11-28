---
"@cssints/graph-layout": minor
---

A second router behind the same `route`: `route(graph, layout, boxes, { router: "lattice" })`, with `"channels"` the default
and byte-identical. The lattice is the channel of one layer boundary — columns at a 6 px pitch with the strip's edges kept, rows
the height of every slot on both sides plus a uniform grid the drawing shares — and an A\* minimises
`length + bends·wBend + reused·wReuse + crossings·wCross` over right, up, down and (with `directions: 8`) the two 45° diagonals,
never left, with the edges routed shortest port-to-port first. Ends are the same ports and band heights as today, cluster edges
keep the channel path, loops are unchanged, and the weights are exposed as `RouteOptions.lattice`. Over the 120-graph corpus the
four-direction lattice draws 2 crossings, 170 bundled corridor pairs and 624 bends in the same 37 682 px where the channel router
draws 168, 5 and 730; eight directions draw 16 crossings and 654 bends in 35 599 px (−5.5%), and the six spec graphs go from 8
bends to 4, 5 and 5 on picks 2, 4 and 6. The weight sweep (`wReuse` 0, 2, 5, 10 against `wCross` 0, 5, 20) shows the per-line
inflation separates lines rather than bundling them — 2 crossings at 0, 97 at 2, 114 at 10 — so the pair (0, 20) is the default
and the bundles are the shortest-first order's. It costs `route` 506 µs a graph against 9.2 and the whole pipeline 546 against
58: an option, not the default. `test/lattice.mjs` holds the invariants over 8 shapes, 120 seeded graphs and 120 two-level graphs,
the label case, the sweep and the comparison; `test/geometry.mjs` is the shared drawing geometry the suites now read.

---
"@cssints/graph-layout": minor
---

A layered graph layout engine: `@cssints/graph-layout`, a new package of three pure functions named after the spec's
actions — `breakCycles` (reverse every edge that points backwards in model order), `assignLayers` (the longest path from a
source over the broken graph) and `orderNodes` (group by layer, rank by model order) — plus `layout`, which composes them
and returns `{ layers, ranks }` for a graph of `{ nodes, edges }` whose node array order is the model order.

The contract is `specs/patterns/graph-layout.qnt` of `@cssints/apg-specs`, and the package tests itself against it: the
spec's eight scenarios replay against the engine, and a seeded differential walk drives the engine and the generated
reference model with the same random steps, comparing the layers after every one. `@cssints/apg-specs` is a dev
dependency and no published code imports it. No DOM, no reactivity, no dependencies.

---
"@cssints/apg-specs": minor
---

A second graph-layout spec, with the junction points made explicit. `specs/patterns/graph-layout-slots.qnt` runs the same six
graphs through the same three phases, but phase 3 becomes slots: two per layer, holding the layer's nodes and the dummies of
the long edges that pass through it. `src/patterns/graph-layout-slots.bridge.ts` maps the same scenario vocabulary onto it and
projects the state as `{ slots }` — per layer, the node ids and the dummy ids (`ad@1`), sorted.

`test/patterns/graph-layout-slots.test.ts` replays its eight scenarios against the generated model and against elk-rs 0.12.2
with the portable strategies pinned, and walks both with the same seeded steps. The dummies are read back from elk's routes:
at each intermediate layer's x the edge has to be drawn in the gap between the boxes, which is what `slotsOfLayout` in
`test/patterns/elk.ts` checks, so a route that skips the layer it spans or crosses it inside a node fails. `NoCrowdedLayer`
and `AtMostOneLongEdgePerLayer` state the model's bound — two slots cannot hold two nodes and a dummy — as a property of
these six graphs rather than a silent drop.

---
"@cssints/apg-specs": minor
---

A layered graph layout spec, replayed against elk-rs. `specs/patterns/graph-layout.qnt` models the discrete part of Eclipse
Layout Kernel's pipeline — cycle breaking, layer assignment, ordering — over four nodes and six pair slots, and
`src/patterns/graph-layout.bridge.ts` maps the scenario vocabulary (`set_graph` with one of six graphs, the three phases,
or `layout` for all of them) onto it, with `layersOf` as the projection both sides answer: one array of node ids per layer,
ids sorted. `test/patterns/graph-layout.test.ts` replays the eight scenarios of
`scenarios/patterns/graph-layout.spec.json` against the generated reference model and against `@openedges/elk-layout`
0.12.2 with the portable strategies pinned (model-order cycle breaking, longest-path layering, no crossing minimization),
and walks both with the same seeded steps. Node placement, routing, ports, labels, compound graphs and the strategy knobs
are not modelled, with the reasons in the spec's header.

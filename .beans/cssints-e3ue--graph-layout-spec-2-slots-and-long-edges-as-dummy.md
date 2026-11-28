---
# cssints-e3ue
title: 'graph-layout spec 2: slots, and long edges as dummy nodes'
status: completed
type: feature
priority: high
tags:
    - layout
    - spec-first
created_at: 2026-11-27T20:27:29Z
updated_at: 2026-11-28T07:49:25Z
parent: cssints-sw9a
blocked_by:
    - cssints-7p7g
---

The spec stops at ordering (`NOT MODELLED`: placement, routing, dummies). Crossing minimization and routing need long edges split
into dummy nodes — a discrete structure that belongs in the spec before the engine grows it.

- [x] `specs/patterns/graph-layout-slots.qnt` (module `patterns_graph_layout_slots`): the same six graphs, a slot per node
  per layer (`order` becomes the slot), and a long edge as dummy slots — the state gains a dummy count per edge or a dummy
  per layer a long edge crosses, as the six-graph shape allows
- [x] invariants that mean something for a browser engine: slots dense per layer and a bijection, a dummy sits in the layers
  strictly between its ends and in a slot of its own, every edge crosses each layer boundary between its ends exactly once
  (a track per boundary)
- [x] scenarios for the new machine: the same eight graphs' layouts projected to slots, replayed against elk-rs with the
  pinned strategies (dummies visible in the routes: `bendPoints` at the boundaries)
- [x] `bun run generate:all` and the spec-only test in the same commit

Approach notes: the generator takes no collections, so slots and dummies are enumerated vars over the six graphs — verbose
and exact, like `graph-layout.qnt`. The value projection is one array of slot ids per layer, dummies included (an id like
`ab@1`, the edge and the boundary it crosses).

Done when: elk-rs passes the new scenarios, the invariants hold over the machine's whole state space, and the bridge exports
the projection the engine's later beans will answer.


## Summary of Changes

`specs/patterns/graph-layout-slots.qnt` (module `patterns_graph_layout_slots`): the same six graphs and the same three
phases, with phase 3 becoming slots — two per layer, each holding 0, a node (1..4) or the dummy of a pair (5..10). A long edge
is spliced into one dummy per layer it crosses, and the projection is `{ slots }` with ids like `ad@1`.

`src/patterns/graph-layout-slots.bridge.ts` maps the same scenario vocabulary (`set_graph`, the three phases, `layout`), with
the third step still called `order_nodes` at the user level and `order_slots` in the spec. `scenarios/patterns/graph-layout-slots.spec.json`
has the same eight scenarios, including the long edge's `ad@1`/`ad@2` and the three-cycle's `ac@1`.

`test/patterns/graph-layout-slots.test.ts` replays them against the model and against elk-rs 0.12.2 (portable strategies
pinned), and walks both with the same seeded steps. The dummies are read back from elk's geometry by `slotsOfLayout` in the new
`test/patterns/elk.ts` (shared with the first slice, which lost its copy of the pinned options): each intermediate layer's x
must be crossed in the gap between the boxes, so a route that skips a layer it spans or crosses it inside a node fails.

Two design points found by running it. `init` picks the chain graph instead of the empty one: the empty graph puts all four
nodes in layer 0, which two slots cannot hold, and the first exploration reported `NodesInTheirLayers` at step 3. And the
two-slot bound is an invariant, not a comment: `NoCrowdedLayer` and `AtMostOneLongEdgePerLayer` say these six graphs never
need three occupants in a layer, so a graph outside the domain fails instead of dropping a dummy.

Gates: apg-specs 1090 tests (56 files), `generate:all` byte-for-byte, typecheck 0 diagnostics, lint 0/0, lint:flakes and
lint:comments clean, diff:check silent. Mutating `slotOne` to ignore dummies fails six tests, the exploration among them.
Next: `cssints-cj4i` (crossing minimization over these slots).

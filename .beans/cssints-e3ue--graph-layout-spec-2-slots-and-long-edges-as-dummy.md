---
# cssints-e3ue
title: 'graph-layout spec 2: slots, and long edges as dummy nodes'
status: todo
type: feature
priority: high
tags:
    - layout
    - spec-first
created_at: 2026-11-27T20:27:29Z
updated_at: 2026-11-27T20:27:29Z
parent: cssints-sw9a
blocked_by:
    - cssints-7p7g
---

The spec stops at ordering (`NOT MODELLED`: placement, routing, dummies). Crossing minimization and routing need long edges split
into dummy nodes — a discrete structure that belongs in the spec before the engine grows it.

- [ ] `specs/patterns/graph-layout-slots.qnt` (module `patterns_graph_layout_slots`): the same six graphs, a slot per node
  per layer (`order` becomes the slot), and a long edge as dummy slots — the state gains a dummy count per edge or a dummy
  per layer a long edge crosses, as the six-graph shape allows
- [ ] invariants that mean something for a browser engine: slots dense per layer and a bijection, a dummy sits in the layers
  strictly between its ends and in a slot of its own, every edge crosses each layer boundary between its ends exactly once
  (a track per boundary)
- [ ] scenarios for the new machine: the same eight graphs' layouts projected to slots, replayed against elk-rs with the
  pinned strategies (dummies visible in the routes: `bendPoints` at the boundaries)
- [ ] `bun run generate:all` and the spec-only test in the same commit

Approach notes: the generator takes no collections, so slots and dummies are enumerated vars over the six graphs — verbose
and exact, like `graph-layout.qnt`. The value projection is one array of slot ids per layer, dummies included (an id like
`ab@1`, the edge and the boundary it crosses).

Done when: elk-rs passes the new scenarios, the invariants hold over the machine's whole state space, and the bridge exports
the projection the engine's later beans will answer.

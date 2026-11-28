---
# cssints-sw9a
title: 'graph-layout: a layered layout engine in the browser, from the spec'
status: completed
type: epic
priority: normal
tags:
    - layout
    - spec-first
created_at: 2026-11-27T20:16:55Z
updated_at: 2026-11-28T10:10:50Z
---

User (2026-11-27), pointing at the elk-rs pipeline page: "нам нужен елк на квинт
спеках", then "нарежь бины на браузерную реализацию".

The oracle half is done (`0a088663`): `specs/patterns/graph-layout.qnt` states the discrete contract of ELK's layered
pipeline over six graphs, and `test/patterns/graph-layout.test.ts` replays the scenarios against the generated model and
against elk-rs 0.12.2 with the portable strategies pinned. This epic is the other half: an engine that runs in the
browser, in this repository, and answers the same projection (`layersOf`).

Decisions the children assume:

- `@cssints/graph-layout` is its own package: a solver of pure functions — no DOM, no reactivity, no attributes — whose
  oracle is `@cssints/apg-specs` (a dev dependency). `@cssints/headless` keeps the diagram primitive, which is a widget.
- The spec stays the oracle: every slice that can be stated discretely in Quint gets a spec slice before its
  implementation (the slot model of placement and the dummies of long edges is one), and the rest is property tests
  beside the engine, with the numbers in `docs/wayfinder.md`.
- The spec's `NOT MODELLED` list is this epic's backlog, not its scope: ports, labels, compound graphs, partitions,
  layer constraints and the strategy knobs are the last bean, deferred.

The cut: the pipeline and the spec's eight scenarios → arbitrary graphs and their invariants → the spec's slot slice →
placement → crossing minimization over the dummies → orthogonal routing → the diagram starter.

Related: `cssints-7hbv` rejected orthogonal routing that avoids nodes for the skin, because it is a layout problem.
This is that problem, with the engine outside the skin.


## Summary of Changes

Done 2026-11-28 in seven slices, each its own commit and its own oracle:

| Slice | What it is | The number |
| --- | --- | --- |
| `cssints-wgrw` | `@cssints/graph-layout`: cycle breaking, layering, ordering; the spec's eight scenarios replayed, a walk in Chromium | 2.35 kB packed, 0.90 gzip |
| `cssints-7p7g` | the contract on arbitrary graphs: 8 shapes + 400 seeded graphs as properties, and the bench | layout 3.9 µs at ≤80 nodes, 42 µs for a 200-node chain |
| `cssints-e3ue` | the second spec: slots and long edges as dummies, the dummies read back from elk-rs' routes | 17 tests, 1 090 in the package |
| `cssints-cj4i` | slots in the engine, the barycentre sweep and the greedy switch | crossings 85 388 → 23 681 (72% fewer), 329 µs |
| `cssints-xfma` | placement: boxes, alignment, dummies on the straight line | 80 px of edge deviation against elk-rs' 102, 31 µs |
| `cssints-i6pb` | orthogonal routes through the channels | 140 drawn crossings against 481 at the model order, 21 µs |
| `cssints-osne` | the diagram starter lays its graph out on demand | 20 nodes in 0.49 ms against dagre's 7.2 |

The whole pipeline on a graph of up to 80 nodes: ~400 µs, four fifths of it the sweep. The specs (`specs/patterns/graph-layout.qnt`,
`graph-layout-slots.qnt`) remain the contract; elk-rs is the oracle they were written from, and dagre is the comparator the
starter's bench answers.

Left as the deferred backlog, not as part of this epic: `cssints-a65d` — ports beyond the border midpoints, labels, compound
graphs, partitions, the strategy knobs, self loops, and the octilinear drawing the metro-map notes in
`docs/research/edge-routing.md` argue for (the channel's bundled corridors are the same conversation).

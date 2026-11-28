---
# cssints-n1ix
title: 'graph-layout: compound graphs and cross-hierarchy edges'
status: completed
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T14:18:44Z
parent: cssints-a65d
---

Compound nodes and clusters: a node with children of its own, and edges that cross the hierarchy. ELK does it with
`INCLUDE_CHILDREN` and cross-hierarchy edges; the spec would need a recursive shape the generator cannot carry, so this is the
slice where the oracle becomes elk-rs alone.

- [x] the graph type gains a parent per node; layer assignment treats a compound node as a layer of its own content
- [x] `INCLUDE_CHILDREN`-style routing: an edge that leaves a cluster crosses its border once, at a port
- [x] the oracle: elk-rs on a fixture of two clusters and a cross-hierarchy edge, compared on layers and crossings
- [x] a property suite over random two-level graphs


## Summary of Changes

Taken 2026-11-28 as the **inline** reading of the bean, ELK's `INCLUDE_CHILDREN`: `graph.clusters` is `{ id, members }`, one level
deep, and the layering stays hierarchy-agnostic — no node gets a parent, and `assignLayers` never learns about a cluster. The
recursive reading (a cluster as a node of its own layer with its contents laid out inside it) is deferred in
`docs/wayfinder.md` with the reason: it is a second placement inside every box, and elk-rs on the probe layers the clusters at
the root and puts an unclustered cross-edge node after all of them, so there is no clean outer layer index to compare with either.

The cluster buys contiguity (`orderSlots` groups its members first, the sweep orders blocks by the mean barycentre and the greedy
switch never swaps across a block edge), containment (`clusterBoxes` is what the cluster holds, grown by 12 px, and `place` pushes
every non-member out of it — up above its block or down below it, at most 8 rounds, then a `RangeError`), and one border crossing
at a port (`route` spreads the left and right borders evenly, ordered by the height of the other end, jogs to the port's height in
the padding band and the gap beside it, and reports `borders: [{ cluster, point }]`; a top or bottom border crosses at the edge's
own track). Two router changes were needed for the crossing to be the only one: a track keeps off a cluster's border and out of its
padding band, and a cross edge's dummy row is clamped into its cluster's box while the edge crosses the cluster's columns.

Numbers: 5 shapes and 120 random two-level graphs (902 nodes, 954 edges, 645 cross edges) — 1 310 ports on 251 borders (at most 18
on one, 5.3–94.7% of its height), 10 pushes in at most 1 round, 0 violations; the constrained sweep leaves 507 crossings against 385
for the same graphs flattened; over 400 two-level graphs layout 5.60 µs against 4.00 flat, `place` 19.09 against 12.08, `route`
26.57 against 11.14. Against elk-rs with `INCLUDE_CHILDREN`: the same member columns in model order, the same containment, one
crossing per cross edge per border on both, boxes 134×44 against ELK's 134×44 and 164×44, and 2 drawn crossings against 6; the
unclustered nodes are where the readings differ. A graph with no clusters prints every old number (168 drawn crossings, 5 bundled
pairs, 96 diagonals, 379 labels).

Gates: `bun run build:packages`, the package's `test` (with `test/clusters.mjs` and `test/elk-compound.mjs` added to the chain),
`typecheck` and `bench`, `apps/ui`'s test, typecheck, skin and theme checks, and the root `lint`, `lint:comments`, `typecheck`,
`diff:check` and `fmt` — all green; `docs/wayfinder.md`'s `fmt` check stays red on two rewrapped lines it was already red on
master, and they are left alone so the diff is the new entry.

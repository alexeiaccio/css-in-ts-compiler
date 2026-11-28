---
# cssints-n1ix
title: 'graph-layout: compound graphs and cross-hierarchy edges'
status: todo
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T10:28:10Z
parent: cssints-a65d
---

Compound nodes and clusters: a node with children of its own, and edges that cross the hierarchy. ELK does it with
`INCLUDE_CHILDREN` and cross-hierarchy edges; the spec would need a recursive shape the generator cannot carry, so this is the
slice where the oracle becomes elk-rs alone.

- [ ] the graph type gains a parent per node; layer assignment treats a compound node as a layer of its own content
- [ ] `INCLUDE_CHILDREN`-style routing: an edge that leaves a cluster crosses its border once, at a port
- [ ] the oracle: elk-rs on a fixture of two clusters and a cross-hierarchy edge, compared on layers and crossings
- [ ] a property suite over random two-level graphs

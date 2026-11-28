---
# cssints-wibi
title: 'graph-layout: layer constraints and partitions'
status: todo
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T10:28:10Z
parent: cssints-a65d
---

Layer constraints (`FIRST` / `LAST`) and partitions: a host pins a node to the first or last layer, or groups nodes into
partitions that keep an order. Used by diagrams that must read in a direction (a source on the left, a sink on the right).

- [ ] `Graph` carries `first`/`last` per node (or a partition index) and `assignLayers` honours it, widening the longest path
- [ ] the spec's six graphs gain a pinned node per pick, with the invariants `pinned first` / `pinned last` and the layering
  unchanged otherwise; elk-rs with `elk.layered.layering.layerConstraint` is the oracle
- [ ] partitions: an order between groups, checked as layers of groups

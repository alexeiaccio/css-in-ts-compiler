---
# cssints-a65d
title: 'graph-layout: ports, labels, compound graphs and the strategy knobs'
status: todo
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-27T20:27:36Z
updated_at: 2026-11-27T20:27:36Z
parent: cssints-sw9a
---

Deferred, and each of these is its own spec slice before it is code. The spec's `NOT MODELLED` list is the backlog.

- [ ] ports: a node's anchor points and sides, the port constraints of ELK (`FIXED_SIDE`, `FIXED_ORDER`)
- [ ] edge labels and node labels: their own slots in a layer, which the crossing minimization must order
- [ ] compound graphs and clusters: hierarchy, cross-hierarchy edges, the `INCLUDE_CHILDREN` mode
- [ ] partitions and layer constraints (`FIRST`/`LAST`), and the direction priority
- [ ] the strategy knobs: network simplex layering, Brandes-Köpf placement, spline routing — each changes which valid layout
  is drawn, so each is a strategy behind the same invariants
- [ ] self loops and multi-edges: the two graph features the spec's six graphs do not carry

Not before a consumer needs it: the diagram starter's graphs are flat, unlabelled and simple, and the engine's value now is
being small and correct for those.

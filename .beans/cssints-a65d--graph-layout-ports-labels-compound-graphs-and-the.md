---
# cssints-a65d
title: 'graph-layout: ports, labels, compound graphs and the strategy knobs'
status: todo
type: epic
priority: deferred
tags:
    - layout
created_at: 2026-11-27T20:27:36Z
updated_at: 2026-11-28T10:28:17Z
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


## Summary of Changes

Taken 2026-11-28: the bean became an epic with seven children, and the first slice landed — **self loops**.

A loop is not a way to another layer, but `assignLayers` counted it as an edge into its own node: `a -> a, a -> b` put `a` on
layer 1, `b` on layer 2, and left layer 0 empty. Every graph with a loop was laid out wrong, silently. The layering now skips an
edge whose ends are the same node; `layout` of a graph with loops is identical to the layout of the same graph without them, the
slots and the crossings never see a loop, and `route` draws one as a bracket on the node's right border (out 16 px, between
`centre - 6` and `centre + 6`). The property, placement and routing suites each gained a loopy shape.

The rest is cut into children, each its own slice with its own oracle: `cssints-mamm` ports (anchors beyond the midpoint, the
first of the router's two shared-line cases), `cssints-boq9` the skin's loop shape, `cssints-8iq0` edge labels as slots,
`cssints-n1ix` compound graphs, `cssints-wibi` layer constraints and partitions, `cssints-6ysl` the strategy knobs,
`cssints-m0f0` octilinear routing (the metro-map drawing and the corridor bundling together).

---
# cssints-mamm
title: 'graph-layout: ports on the border, beyond the midpoint'
status: todo
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T10:28:10Z
parent: cssints-a65d
---

A node's edge leaves at the border's midpoint, so two edges from one node share their first stem — one of the two places the router
allows a shared line (the other is a channel corridor). Ports spread the anchors along the border, ordered by where each route
goes, so siblings leave at different heights.

- [ ] `Placement`/`route`: one anchor per edge on the border, ordered by the edge's y at the next layer (deterministic, no
  collection in the spec), a side chosen by the route's direction
- [ ] the first/last stem then never overlaps another route's stem: the routing test's "shared segment outside a port" check
  becomes "shared segment only inside a channel"
- [ ] the skin's `shapeBetween` takes the anchor instead of the midpoint
- [ ] an oracle: elk-rs with `elk.portConstraints: FIXED_SIDE` on the six graphs — the ports' order, not their pixels

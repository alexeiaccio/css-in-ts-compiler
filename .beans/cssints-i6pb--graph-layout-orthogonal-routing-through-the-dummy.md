---
# cssints-i6pb
title: 'graph-layout: orthogonal routing through the dummy slots'
status: todo
type: feature
priority: normal
tags:
    - layout
created_at: 2026-11-27T20:27:36Z
updated_at: 2026-11-27T20:27:36Z
parent: cssints-sw9a
blocked_by:
    - cssints-xfma
---

The last phase, and the one the diagram skin consumes: bend points it can draw.

- [ ] orthogonal routes through the dummy slots: a channel per layer boundary, a route is a list of points from the source's
  border to the target's border, monotone in `x`
- [ ] ports on the border midpoints (the skin's `shapeBetween` already draws from those), a port side per direction
- [ ] invariants: every segment is horizontal or vertical, no segment crosses a node's interior, no two routes share a
  segment (or they are grouped into one and drawn once), the route touches each layer boundary between its ends once
- [ ] the skin's crossings count (`crossingsOf` in `apps/ui/src/registry/route.ts`) as the projection's check: the engine's
  routes cut a corpus's crossings below the model-order baseline
- [ ] the browser check: a laid-out graph drawn from bend points in Chrome (a vitest browser test that measures the path,
  not a screenshot)

Done when: the routes satisfy the invariants on the corpus, the crossings are recorded, and the diagram starter can draw the
result (the next bean).

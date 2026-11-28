---
# cssints-i6pb
title: 'graph-layout: orthogonal routing through the dummy slots'
status: todo
type: feature
priority: normal
tags:
    - layout
created_at: 2026-11-27T20:27:36Z
updated_at: 2026-11-28T08:55:53Z
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


## From docs/research/edge-routing.md (2026-11-28)

Two refs named in the thread that started this (MacWright's diagram tool; the replies to it): Kindermann's *Octilinear Graph
Drawing: Metro Map Layout* (the eight-direction problem, NP-hard: straightness, angular resolution, bounded lengths) and
Nöllenburg & Wolff's *A Mixed-Integer Program for Drawing High-Quality Metro Maps* (exact for small instances, not a
dependency).

Decisions this adds:

- the goal is **bundling and overlap reduction**, not only "no overlaps": a corridor two routes share is drawn once, which is
  what the invariant already said in parentheses;
- the route type is a polyline of points and the invariants are stated per **direction set**, so octilinear (multiples of 45°)
  is a second strategy behind the same type rather than a rewrite. Orthogonal is the four-direction case and stays first:
  cheaper collision tests, and the skin's step shapes already speak it;
- the first implementation can be A\* over a coarse lattice with per-line weight inflation — route shortest paths first, raise
  the weight of tiles earlier lines used — which needs no channel bookkeeping and turns crossings, overlaps and node avoidance
  into one weight table; the channel router through the dummy slots stays as what its results are checked against;
- record the metro map's numbers when octilinear lands: bends per route, angular resolution at a node, edge lengths.

The MIP is the quality oracle, not code. Edge labels and control points are deferred with ports (`cssints-a65d`).

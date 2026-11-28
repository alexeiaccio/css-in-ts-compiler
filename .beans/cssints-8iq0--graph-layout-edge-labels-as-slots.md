---
# cssints-8iq0
title: 'graph-layout: edge labels as slots'
status: todo
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T10:28:10Z
parent: cssints-a65d
---

Labels are their own slots: an edge label needs a place on its route that does not overlap another label or a box, and a node
label is inside its box (already done by the skin).

- [ ] an edge label as a slot per boundary: a track for the label alongside the route's track, ordered like the routes
- [ ] invariants: no two labels overlap, no label over a box, a label is within its edge's span
- [ ] the discrete part (which layer a label sits in, its order) as a spec slice; the pixels are the skin's
- [ ] measured: labels placed versus a greedy first-fit baseline on the corpus

---
# cssints-osne
title: the diagram starter lays its graph out on demand
status: todo
type: feature
priority: normal
tags:
    - layout
    - ui
created_at: 2026-11-27T20:27:36Z
updated_at: 2026-11-27T20:27:36Z
parent: cssints-sw9a
blocked_by:
    - cssints-i6pb
---

The engine's first consumer: the diagram and canvas starters of `apps/ui` (bean `cssints-7hbv`, which rejected routing as a
layout problem for the skin).

- [ ] a control on the diagram starter: a button (keyboard operable, labelled) that lays the current graph out; the layout runs
  synchronously in the handler, no worker unless a measurement says otherwise
- [ ] the graph the starter holds is the engine's input and back (ids, sizes, edges), so a second press is idempotent
- [ ] the story and the page: `src/registry/diagram/`, a story with a small graph, the screen's conformance record
- [ ] a Chrome test: press the control, the nodes move to a layered arrangement (measured: boxes disjoint, every edge's
  source left of its target), arrow keys still move nodes afterwards, no console error
- [ ] the shape to copy, from Pele (obsidianmd/pele, MIT): small, synchronous, no runtime dependencies, a bench in Chrome
  against the reference implementation, and a documented CSS-variable theme seam — the theme here is cssints tokens, so only
  the first two apply

Done when: the starter lays out on demand in Chrome, the conformance and the site tests are green, and the wayfinder entry
records the bundle cost.

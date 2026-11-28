---
# cssints-osne
title: the diagram starter lays its graph out on demand
status: completed
type: feature
priority: normal
tags:
    - layout
    - ui
created_at: 2026-11-27T20:27:36Z
updated_at: 2026-11-28T10:10:01Z
parent: cssints-sw9a
blocked_by:
    - cssints-i6pb
---

The engine's first consumer: the diagram and canvas starters of `apps/ui` (bean `cssints-7hbv`, which rejected routing as a
layout problem for the skin).

- [x] a control on the diagram starter: a button (keyboard operable, labelled) that lays the current graph out; the layout runs
  synchronously in the handler, no worker unless a measurement says otherwise
- [x] the graph the starter holds is the engine's input and back (ids, sizes, edges), so a second press is idempotent
- [x] the story and the page: `src/registry/diagram/`, a story with a small graph, the screen's conformance record
- [x] a Chrome test: press the control, the nodes move to a layered arrangement (measured: boxes disjoint, every edge's
  source left of its target), arrow keys still move nodes afterwards, no console error
- [x] the shape to copy, from Pele (obsidianmd/pele, MIT): small, synchronous, no runtime dependencies, a bench in Chrome
  against the reference implementation, and a documented CSS-variable theme seam — the theme here is cssints tokens, so only
  the first two apply

Done when: the starter lays out on demand in Chrome, the conformance and the site tests are green, and the wayfinder entry
records the bundle cost.


## The comparator (from docs/research/graph-drawing.md, 2026-11-28)

The bench is `@dagrejs/dagre` (1.4 MB unpacked, MIT, the maintained fork of the JS Sugiyama baseline), on the same graph and
the same measure anvaka's harness uses: the largest graph the handler still returns for inside a frame, not an average
latency. `elkjs` is not a candidate to bundle — EPL-2.0 OR GPL-3.0 — and stays a dev-only oracle. Publish the limit beside
the engine so a consumer knows what it is buying, and once routing lands review the drawing as the same graph under every
strategy side by side.


## Summary of Changes

The engine's first consumer. `src/registry/diagram/layout.ts` turns the starter's graph into the engine's input — ids in the
diagram's order, sizes from the boxes, edges from `from`/`to` — runs `minimizeCrossings(layout(...))` + `place`, and returns
the same nodes moved onto the layout. Nothing is mutated, so a second press reads what the first wrote.
`src/registry/diagram/starter.tsx` holds the graph in a signal and puts one labelled `<button>` beside the diagram, outside the
diagram's own tab stop; the layout runs in the handler, no worker. The story is `LayOut` ("Laid out on demand"), and
`diagram.browser.test.tsx` gained four tests: the control is a labelled button outside the tab stop; a press moves the boxes
into layers with no overlaps and every edge left to right; a second press changes nothing; the arrows still walk the new
drawing; and the console stays silent.

Measured in Chrome (`layout.browser.test.tsx`, median of twenty runs) and against the reference the survey named, on the same
forward-only graph: 4 nodes 0.23 ms, 20 0.49, 60 1.15, 200 3.96; `@dagrejs/dagre` 0.77, 7.2, 22.3, 88.4 ms. The test asserts the
frame at 20 nodes and prints the rest.

Two things the starter made explicit: the demo flow's `refunded -> shipped` is a back edge, which a layered drawing does not
have yet (the router's next slice), so the starter's story holds the flow without it; and `bun run catalog` rewrites the catalog
unformatted — `vp fmt` brought the diff from 1 529 lines to the 6 the new story needs.

Gates: apps/ui 73 files and 1 041 browser tests, `test:site` (stories, ids, controls, screens, catalog, theme switch, tint
group; 121 untracked reads, unchanged), skin and theme checks, typecheck, lint 0/0, comment budget. Next: `cssints-a65d`, the
deferred slice (ports, labels, compound graphs, the strategy knobs, octilinear).

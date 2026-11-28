---
# cssints-8iq0
title: 'graph-layout: edge labels as slots'
status: completed
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T13:06:12Z
parent: cssints-a65d
---

Labels are their own slots: an edge label needs a place on its route that does not overlap another label or a box, and a node
label is inside its box (already done by the skin).

- [x] an edge label as a slot per boundary: a track for the label alongside the route's track, ordered like the routes
- [x] invariants: no two labels overlap, no label over a box, a label is within its edge's span
- [x] the discrete part (which layer a label sits in, its order) as a spec slice; the pixels are the skin's
- [x] measured: labels placed versus a greedy first-fit baseline on the corpus


## Summary of Changes

Taken 2026-11-28. A label is a slot now, and the engine owns its discrete half: `packages/graph-layout/src/label.ts` exports
`label(graph, layout, boxes, routes, requests, spacing)`, one box per requested route in route order. The x band is the channel of
the boundary the label sits at, inset by 2 px on both sides, and a request wider than that band comes back clamped — which is what
makes "no label over a box" true by construction, since a channel is the gap between two layers. The boundary is the middle of the
ones the edge crosses, `first + floor((last - first - 1) / 2)`; the ideal y is the middle of the route's own segment inside that
channel; and at one boundary the labels are sorted by that y (ties by route id) and stacked top-down, each pushed down by the
label above it and never back up. One pass, no search, no overlap. A loop has no boundary: `boundary: -1`, a column beside the
bracket. `route`'s `columns`/`borders`/`channelOf` became `channels(graph, layout, boxes)` with two consumers, and the router's
output is byte-identical (168 and 174 drawn crossings, 5 and 4 bundled pairs, unchanged).

`test/labels.mjs` (in the package's `test` chain) proves the contract over the same eight shapes and 120 seeded graphs as
`test/routing.mjs`: one slot per request in route order, the box inside its channel, no two slots overlapping, no slot over a node
box, the ideal y never moved up, the order at a boundary the routes' own with the gap kept, a request wider than the channel
clamped, a loop's slot beside its bracket, and the same graph labelled the same way twice. The corpus measured against a greedy
first-fit (same order, the ideal band else down and up by a label and a gap, 64 steps, inside the drawing's y extent): at the swept
layouts both place all 379 labels, the engine 351 at the ideal band with 0.68 px mean and 19.50 px worst drift, the greedy 342 at
1.94 px mean and 48.00 px worst; 79 of the 119 boundaries carry two or more labels and the deepest stack is 12. At the model order
the engine is 306 at the ideal band, 2.09 px mean, 33.75 px worst, the greedy 298, 4.52 px, 64.00 px. `label` costs 10.36 µs a
graph over 1 000 graphs, against `route`'s 30.58 and `place`'s 32.74.

The discrete half is `packages/apg-specs/specs/patterns/graph-layout-labels.qnt`: per pair a boundary `l_<pair>` (one-based, 0
absent, so no negative number in the state) and a track `o_<pair>`, plus `place_labels` after `order_slots`. `LabelOnSpan`,
`MiddleBoundary`, `DistinctTracks` and `TrackOrder` are the four invariants, and the track is the count of labels at the same
boundary with a smaller key — the edge's right-side slot in the next layer, then the pair's model order. `generate:all` writes the
model and the scaffolding, the bridge projects the pair ids per boundary in track order, and the eight scenarios are replayed
against the model *and* against the engine's new `labelsDriver` (layout → place at 40 x 20 → route → label, read back per
boundary), which agrees on all of them. The two earlier specs are untouched and regenerate byte-identically.

The skin takes the slot: `layOut` returns `{ nodes, labelSlots }`, keyed by `from>to` and `to>from`, and `Diagram` grows one
optional `labelSlots` prop — an edge with a band draws its `<text>` centred in it, an edge without keeps `labelAt`, and a loop's
label stays the skin's own. After "Lay out" the starter's `pay` and `cancel` — the collision this slice exists for — take
130..190 x 45..63 and 130..190 x 75..93 in the same 60 px channel, 30 px apart. Three new Chrome tests (the two bands disjoint, every
label's ink inside its band and still named, the second press drawing the same bands), 27 in the diagram file.

Left for their own slices: a route that crosses a label's band still runs through its ink (the A\* bundling's to fix), a loop's
label never joins a channel's stack, a label wider than the channel is clamped while its text may still overhang it (the engine has
no font), and multi-line or rotated labels, ports beyond the border midpoints and a label-to-label search are each their own
change — the last measured above as not worth its cost.

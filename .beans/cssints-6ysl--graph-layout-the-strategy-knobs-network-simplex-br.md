---
# cssints-6ysl
title: 'graph-layout: the strategy knobs (network simplex, Brandes-Köpf, splines)'
status: todo
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T14:46:40Z
parent: cssints-a65d
---

The knobs ELK offers behind the invariants: network-simplex layering (fewer total layers for some graphs), Brandes-Köpf
placement (straighter drawings than the median sweeps), and spline routing.

- [ ] `layout`/`minimizeCrossings`/`place` take a strategy, the default being today's behaviour; each strategy is checked
  against the same invariants and its own numbers (crossings, deviation, time) on the corpus
- [x] network simplex: measured against longest path on the corpus (layers, crossings, µs)
- [x] Brandes–Köpf: measured against the median sweeps (edge deviation, µs)
- [ ] each strategy that is not a function of the input says so and is compared by its numbers, not by equality
- [x] spline routing: a third shape behind `route`, the polyline kept and a cubic per bend, measured over the corpus and against ELK's `SPLINES`

## Summary of Changes

The network-simplex item landed as a second layering strategy behind the same pipeline:
`assignLayers(graph, "minimize-length")` and `layout(graph, { layering: "minimize-length" })`, with `longest-path` the
default and byte-identical — the scenarios and the 400-graph property suite replay unchanged. The objective is the total
edge length over the dummy-expanded graph, `Σ (layer(target) − layer(source))`; longest path is the earliest feasible
layering and not always the shortest, `a→b` beside `x1→x2→b` spanning 4 at `a=0` and 3 at `a=1`.

The solver is the documented relaxation, not the exact min-cost flow: from the longest path it raises a node with more
out-edges than in-edges into the highest layer its successors leave free, in reverse model order, until no single node can
move. Each move shortens the sum by at least one and keeps every edge forward, so it terminates at a fixpoint. Brute force
over every feasible layering of 411 graphs of up to 7 nodes finds it optimal on all 411; elk-rs with
`elk.layered.layering.strategy: NETWORK_SIMPLEX` agrees on the specs' six graphs in layers and span, and over 60 seeded graphs
of up to 40 nodes agrees in layers with a span of 153 against 149 (corpus 40 and 55 are 2 longer — the single-node move does
not climb out of those).

Over the 120-graph corpus: layers 239 both ways, dummies 80 → 59, span 459 → 438, crossings 310 → 65 against 274 → 55 at the
model order and after the sweep, 12 of the 120 graphs shorter. Times over 1 000 graphs: `assignLayers` 11.98 µs against
2.11, `layout` 19.57 against 8.75, the whole pipeline 375.34 against 432.25 (the sweep has 21 fewer dummies on the corpus).
`test/layering.mjs` carries the invariants for both strategies and both oracles; `test/bench.mjs` the two rows.

Deferred and unticked at that point: Brandes–Köpf placement and spline routing (the spline landed in the section below), the exact min-cost flow —
the relaxation is optimal on every graph brute force can enumerate and 2 units of span short of ELK on two of sixty — and
per-edge weights, which need a `weight` on `Edge` or a second option.
## Summary of Changes

Brandes–Köpf placement landed behind the same `place`: `place(graph, layout, spacing, { placement: "brandes-kopf" })` runs
the paper's four vertical alignments on the y coordinate — layers down and up, each resolved leftmost and rightmost — with
type-1 conflict marking, a block-graph longest path per alignment, and the balancing step that anchors the narrowest
assignment and takes the mean of the middle two coordinates; `"median"` is the default and byte-identical. Dummies are not
aligned by the strategy: each is put on the straight line between its edge's two nodes and clamped into its slot's gap, as
before, so the router's channel is unchanged.

Numbers: over the 120 seeded graphs the edge deviation is 15 805 px for the median against 13 772.5 (−12.9%, better on 14
graphs, worse on 16, the same on 90), over the 8 shapes 1 365 against 1 730 (the 200-node cycle 0 → 35, the dense 40
1 365 → 1 695), and over the specs' six graphs 80 against 140 (picks 4 and 6 are 30 px off). `place` is 120.46 µs a graph over
1 000 random graphs against 33.68, and 34.10 over 400 two-level graphs against 18.49; the containment still pushes 10 boxes
in one round with 0 violations. elk-rs with `nodePlacement.strategy: BRANDES_KOEPF` takes 113.3 on the six and 2 726.5 over
60 seeded graphs against 3 192.5 here, laying the graphs out in its own slot order (the real nodes' order within a column
agrees on 12 of the 60), so that oracle compares drawings rather than one algorithm's two runs.

`test/brandes-kopf.mjs` holds both strategies to the placement invariants and prints these numbers; `test/bench.mjs` has the
`place (brandes-kopf)` row; `packages/graph-layout/README.md` and `docs/wayfinder.md` carry the section; the changeset is
`.changeset/graph-layout-brandes-kopf.md` (minor). Splines and per-edge weights stay open in this bean.

The spline is a drawing, not a router: `route(..., { shape: "spline" })` keeps the orthogonal route's `points`, ports and
`borders` and adds `curve`, an SVG path with one cubic per bend. The cubic follows the circular-arc approximation, its control
points on the two segments at `(4/3) r tan(δ/4)` from the tangent points; its tangent reach is at most half of each adjacent
segment and its radius at most 8 px, so adjacent bends cannot overlap and the ends stay on the ports. The curve is a function of the
polyline alone, stays inside its bounding box, and no sampled chord enters a box; the default shape is byte-identical.

Over the 8 shapes and 120 seeded graphs (16 chords per cubic, one per straight segment): 1 232 of 1 232 bends soften (the
other 498 interior vertices are collinear), the smallest radius is 0.833 px, the drawing is 3.70% shorter (71 229.42 to
68 591.12 px) and at most 2.34 px from the polyline, and drawn crossings fall from 249 to 237 with one drawing of the 128
gaining one. Eight directions: 502 bends, 1.29% shorter, 81 to 77 crossings. Sixty clustered graphs: 2 636 bends, 15.41%
shorter, every port and border unmoved. `route` costs 36.25 → 56.88 µs a graph (`test/bench.mjs`'s `route (spline)` row).

The oracle is elk-rs with `elk.edgeRouting: "SPLINES"` on the specs' six graphs: ELK draws 25 cubic segments for 18 edges,
this engine 24 fillets; the sampled crossings are 0 against 3. ELK chooses control points in the channel (and can bend into a
crossing), this smooths the corridor the channel router fixed, so the comparison states the difference instead of scoring it.
Left for their own slices: a real spline router that searches control points against the boxes, curves for label boxes, and
the skin that assigns `curve` to a `<path>`.

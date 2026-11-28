---
# cssints-6ysl
title: 'graph-layout: the strategy knobs (network simplex, Brandes-Köpf, splines)'
status: todo
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T13:57:01Z
parent: cssints-a65d
---

The knobs ELK offers behind the invariants: network-simplex layering (fewer total layers for some graphs), Brandes-Köpf
placement (straighter drawings than the median sweeps), and spline routing.

- [ ] `layout`/`minimizeCrossings`/`place` take a strategy, the default being today's behaviour; each strategy is checked
  against the same invariants and its own numbers (crossings, deviation, time) on the corpus
- [x] network simplex: measured against longest path on the corpus (layers, crossings, µs)
- [ ] Brandes-Köpf: measured against the median sweeps (edge deviation, µs)
- [ ] each strategy that is not a function of the input says so and is compared by its numbers, not by equality

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

Deferred and unticked: Brandes–Köpf placement and spline routing (the bean's other two items), the exact min-cost flow —
the relaxation is optimal on every graph brute force can enumerate and 2 units of span short of ELK on two of sixty — and
per-edge weights, which need a `weight` on `Edge` or a second option.

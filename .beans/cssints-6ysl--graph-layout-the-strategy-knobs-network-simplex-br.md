---
# cssints-6ysl
title: 'graph-layout: the strategy knobs (network simplex, Brandes-Köpf, splines)'
status: todo
type: feature
priority: deferred
tags:
    - layout
created_at: 2026-11-28T10:28:10Z
updated_at: 2026-11-28T10:28:10Z
parent: cssints-a65d
---

The knobs ELK offers behind the invariants: network-simplex layering (fewer total layers for some graphs), Brandes-Köpf
placement (straighter drawings than the median sweeps), and spline routing.

- [ ] `layout`/`minimizeCrossings`/`place` take a strategy, the default being today's behaviour; each strategy is checked
  against the same invariants and its own numbers (crossings, deviation, time) on the corpus
- [ ] network simplex: measured against longest path on the corpus (layers, crossings, µs)
- [ ] Brandes-Köpf: measured against the median sweeps (edge deviation, µs)
- [ ] each strategy that is not a function of the input says so and is compared by its numbers, not by equality

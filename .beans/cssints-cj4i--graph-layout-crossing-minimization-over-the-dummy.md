---
# cssints-cj4i
title: 'graph-layout: crossing minimization over the dummy slots'
status: completed
type: feature
priority: high
tags:
    - layout
created_at: 2026-11-27T20:27:36Z
updated_at: 2026-11-28T09:13:06Z
parent: cssints-sw9a
blocked_by:
    - cssints-e3ue
---

The first phase that changes the drawing's quality rather than its validity: the order inside a layer.

- [x] layer sweep: barycentre (median as a switch) forward and backward passes over the slots, the ties broken by model
  order so the result is a function of the input; the greedy-switch pass as the second half
- [x] the spec's slot projection as the driver's answer (`graph-layout.slots`), so the walk and the scenarios compare slots,
  not ids
- [x] the numbers: crossings on a corpus of 1k random graphs, model order vs sweep vs sweep+greedy, in `docs/wayfinder.md`;
  the corpus crossings must not exceed the model-order baseline, and the six spec graphs must keep elk's slot sets under the
  pinned strategies
- [x] deterministic: a fixed seed corpus run twice gives byte-identical output

Done when: the slot scenarios agree with elk-rs, the corpus numbers are in the wayfinder entry, and the engine's tests are
green.


## Summary of Changes

Shipped in `3493598f..` (this commit). The engine learned the slots the second spec models, then the sweep over them.

`orderSlots` (renamed from `orderNodes`) is phase 3 for real: per layer, its nodes in model order and one dummy per long edge,
named `a>d@1`; `layout` returns `slots` beside `layers` and `ranks`, and parallel edges are folded to one line (two lines
between the same nodes would be drawn as one, and duplicate dummy ids would collide). `minimizeCrossings` runs four barycentre
rounds forward and backward (ties kept where they were) and then a greedy switch on adjacent pairs, and returns the sweep only
when it is strictly better than the layout it was given — a pass can make a graph worse, and the guard is what lets the
property suite state "never adds a crossing". `crossings(graph, layout)` counts crossing pairs per layer boundary.

Numbers over the same 1000 random graphs of up to 80 nodes (`bun run bench`): 85 388 crossings at the model order, 23 681 after
the sweep (72% fewer; 585 graphs improve, 379 still cross). Barycentre alone: 80 µs a graph and 26 276 crossings; the greedy
adds 10% fewer crossings for 4× the time. The first greedy took 2.57 ms a graph because it counted every pair of edges at both
boundaries of a layer for every candidate swap; only pairs touching the two swapped slots can change, so counting those is the
same result at 0.33 ms (p50 53 µs, p90 0.7 ms, p99 6 ms, worst 13 ms on a dense 48-node graph). A layout is 7.6 µs.

The engine now also replays the slots spec's eight scenarios and walks its generated model in Chromium through
`slotsDriver`, which answers sorted occupants (and translates `a>d@1` to the spec's `ad@1`): the comparison is *which* nodes
and dummies sit in a layer, which is exactly what the sweep must not change.

Gates: package 8 scenarios + 400 seeded graphs + 6 browser tests (two walks, two scenario sets, the diamond, the long edge and
the crossing example), lint 0/0, typecheck 8 files, lint:flakes and lint:comments clean, diff:check silent. Next:
`cssints-xfma` (placement).

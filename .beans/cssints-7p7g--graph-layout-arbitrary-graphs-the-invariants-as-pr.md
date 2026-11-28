---
# cssints-7p7g
title: 'graph-layout: arbitrary graphs — the invariants as property tests, and the cost'
status: completed
type: feature
priority: high
tags:
    - layout
created_at: 2026-11-27T20:27:29Z
updated_at: 2026-11-28T07:38:28Z
parent: cssints-sw9a
blocked_by:
    - cssints-wgrw
---

The spec's six graphs are a fixture; the engine has to lay out what a diagram actually holds.

- [x] a graph type that is not the spec's: `n` nodes (n ≤ 200) with explicit ids, edges with a direction, isolates, several
  components, cycles; the six graphs stay as fixtures
- [x] the invariants restated as property tests beside the engine, with fixed seeds and a corpus: every edge forward in its
  effective direction, every node above a source one layer below a predecessor (tightness), ranks dense per layer, no node
  lost or duplicated, the same input twice gives the same output
- [x] no cycles left after phase 1: for a random graph, the effective graph is acyclic (checked by a topological sort in the
  test, independent of the implementation)
- [x] the cost: a bench (like `packages/cssints/test/perf.mjs` in spirit, plain node) over 1k random graphs, per-phase µs
  into `docs/wayfinder.md`; a regression threshold only if a consumer cares

Approach notes: no Quint here — the spec cannot carry collections, so the arbitrary-graph contract is invariants in TS, and
the six-graph machine stays the oracle for the pipeline's shape (phase order, the reversal rule).

Done when: the property suite is green on the corpus, the bench number is recorded, and the engine's tests still replay the
spec's scenarios.


## Summary of Changes

`test/graphs.mjs` is a seeded generator (LCG, so a failure reproduces from its seed) plus the corpus and the two extremes: up
to 80 nodes a graph, density 2–14%, 0–4 isolates, parallel edges, and 200-node chains and cycles.

`test/properties.mjs` is the contract the spec cannot state — its graph is a literal `pick` of six. Eight shapes (empty,
single, isolates, two components, a chain of 200, a cycle of 200, a dense 40-node graph, parallel edges) and 400 seeded
graphs, checked as properties: an independent Kahn sort proves phase 1 leaves no cycle; every effective edge points forward
in model order and reversed edges are exactly the ones whose target precedes their source; every node at layer `k` has a
predecessor at `k - 1`; layers and ranks are dense, in model order, and complete; `layout` is the composition of the three
phases and the same input twice is the same output. An edge to a node the graph does not have is refused with a `RangeError`.

The suite was proved to bite: relaxing every edge instead of the longest one, a rank off by one, and leaving one backward
edge unreversed each fail a different assertion, named by the graph ("`n4` sits above `n6`", "the rank of `only` is its
index", "edge 19 is reversed").

`test/bench.mjs` (`bun run bench`) measures best-of-five: 3.9 µs per layout over 1000 random graphs of up to 80 nodes (1.2
`breakCycles` + 2.2 `assignLayers` + 0.9 `orderNodes`), 42 µs for a 200-node chain and 46 µs for a 200-node cycle. No budget:
the number that matters is the dagre comparison in `cssints-osne`. Recorded in `docs/wayfinder.md`.

Package: the tests are one command (`bun test/scenarios.mjs && node test/properties.mjs && vp test run`) and a `bench`
script; README and AGENTS.md say what each proves. Next: `cssints-e3ue` (the spec's slots and dummy nodes for long edges).

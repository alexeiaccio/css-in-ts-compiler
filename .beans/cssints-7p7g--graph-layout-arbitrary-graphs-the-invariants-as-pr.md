---
# cssints-7p7g
title: 'graph-layout: arbitrary graphs — the invariants as property tests, and the cost'
status: todo
type: feature
priority: high
tags:
    - layout
created_at: 2026-11-27T20:27:29Z
updated_at: 2026-11-27T20:27:29Z
parent: cssints-sw9a
blocked_by:
    - cssints-wgrw
---

The spec's six graphs are a fixture; the engine has to lay out what a diagram actually holds.

- [ ] a graph type that is not the spec's: `n` nodes (n ≤ 200) with explicit ids, edges with a direction, isolates, several
  components, cycles; the six graphs stay as fixtures
- [ ] the invariants restated as property tests beside the engine, with fixed seeds and a corpus: every edge forward in its
  effective direction, every node above a source one layer below a predecessor (tightness), ranks dense per layer, no node
  lost or duplicated, the same input twice gives the same output
- [ ] no cycles left after phase 1: for a random graph, the effective graph is acyclic (checked by a topological sort in the
  test, independent of the implementation)
- [ ] the cost: a bench (like `packages/cssints/test/perf.mjs` in spirit, plain node) over 1k random graphs, per-phase µs
  into `docs/wayfinder.md`; a regression threshold only if a consumer cares

Approach notes: no Quint here — the spec cannot carry collections, so the arbitrary-graph contract is invariants in TS, and
the six-graph machine stays the oracle for the pipeline's shape (phase order, the reversal rule).

Done when: the property suite is green on the corpus, the bench number is recorded, and the engine's tests still replay the
spec's scenarios.

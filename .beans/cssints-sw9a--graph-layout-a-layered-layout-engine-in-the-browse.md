---
# cssints-sw9a
title: 'graph-layout: a layered layout engine in the browser, from the spec'
status: todo
type: epic
priority: normal
tags:
    - layout
    - spec-first
created_at: 2026-11-27T20:16:55Z
updated_at: 2026-11-27T20:16:55Z
---

User (2026-11-27), pointing at the elk-rs pipeline page: "нам нужен елк на квинт
спеках", then "нарежь бины на браузерную реализацию".

The oracle half is done (`0a088663`): `specs/patterns/graph-layout.qnt` states the discrete contract of ELK's layered
pipeline over six graphs, and `test/patterns/graph-layout.test.ts` replays the scenarios against the generated model and
against elk-rs 0.12.2 with the portable strategies pinned. This epic is the other half: an engine that runs in the
browser, in this repository, and answers the same projection (`layersOf`).

Decisions the children assume:

- `@cssints/graph-layout` is its own package: a solver of pure functions — no DOM, no reactivity, no attributes — whose
  oracle is `@cssints/apg-specs` (a dev dependency). `@cssints/headless` keeps the diagram primitive, which is a widget.
- The spec stays the oracle: every slice that can be stated discretely in Quint gets a spec slice before its
  implementation (the slot model of placement and the dummies of long edges is one), and the rest is property tests
  beside the engine, with the numbers in `docs/wayfinder.md`.
- The spec's `NOT MODELLED` list is this epic's backlog, not its scope: ports, labels, compound graphs, partitions,
  layer constraints and the strategy knobs are the last bean, deferred.

The cut: the pipeline and the spec's eight scenarios → arbitrary graphs and their invariants → the spec's slot slice →
placement → crossing minimization over the dummies → orthogonal routing → the diagram starter.

Related: `cssints-7hbv` rejected orthogonal routing that avoids nodes for the skin, because it is a layout problem.
This is that problem, with the engine outside the skin.

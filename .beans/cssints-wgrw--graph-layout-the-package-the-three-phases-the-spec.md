---
# cssints-wgrw
title: 'graph-layout: the package, the three phases, the spec''s eight scenarios'
status: completed
type: feature
priority: high
tags:
    - layout
created_at: 2026-11-27T20:27:29Z
updated_at: 2026-11-27T20:42:50Z
parent: cssints-sw9a
---

The epic's first slice: the engine behind the spec that shipped in `0a088663`.

`@cssints/graph-layout`, a package of pure functions — a graph in, layers and ranks out. No DOM, no reactivity, no
attributes; `@cssints/headless` keeps the diagram primitive, which is a widget.

- [x] `packages/graph-layout`: `src/index.ts`, README, tests, the changesets `fixed` group and a `minor` changeset; the name
  is free (`@cssints/layout` is the CSS layout plugin)
- [x] `layout(graph)` with the three phases as the spec states them: cycle breaking by model order (a backwards edge is
  reversed), longest-path layering, ranks in model order; the return is `{ layers, ranks }`
- [x] a driver over `@cssints/apg-specs/scenario` and the eight scenarios of
  `scenarios/patterns/graph-layout.spec.json` replayed in Node against the engine — the same scenarios the model and elk-rs
  already pass
- [x] `differentialWalk` against the generated spec model in Chromium (vitest browser mode, as `@cssints/headless` does),
  with `layersOf` as the compared value
- [x] `@cssints/apg-specs` a devDependency only: no published code imports it

Approach notes: the phases are pure functions over `{ nodes, edges }`; the six graphs of the spec are a fixture, not the
API. A backwards edge is the one whose target precedes its source in the node order, which is what makes the result a
function of the input.

Done when: the eight scenarios pass against the model and the engine, the walk is green, and the package's tests, the root
`bun run lint` and `bun run typecheck` are clean.


## Summary of Changes

Shipped in `7f13c7a7`. `packages/graph-layout` is `@cssints/graph-layout`, a package of pure functions named after the spec's
actions — `breakCycles`, `assignLayers`, `orderNodes`, and `layout` composing them — over `{ nodes, edges }` whose node array
order is the model order, returning `{ layers, ranks }`. No DOM, no reactivity, no dependencies; 2.35 kB packed.

The model-order breaker turned out to be a proof rather than a heuristic: an edge whose target precedes its source is
reversed, so every effective edge runs from a lower index to a higher one, which makes the graph acyclic and lets layering
be one pass in model order (no Kahn queue, no fixed point). The spec's `order` has no counterpart in the projection, so the
ranks are asserted once — the diamond's `b` and `c` at 0 and 1 — instead of being pretended to be compared.

Tests: `test/scenarios.mjs` replays the spec's eight scenarios against the engine, `test/walk.browser.test.ts` is a seeded
8 x 24 differential walk of the engine against the generated reference model in Chromium plus the diamond's ranks. A
neutered `breakCycles` fails both (the two-cycle gives `[a,d],[c],[b]` against the spec's `[a,d],[b],[c]`). The scenarios
run under Bun, not Node: the oracle's sources import each other without extensions, which Bun and Vite resolve and Node's
loader does not.

Also: the changeset (minor, the `fixed` group), AGENTS.md and RELEASING.md at 33 packages, a wayfinder entry, the docs page
(skipped by the playground: nothing to draw yet) and the diff-check's plain-code list. Next: cssints-7p7g (arbitrary
graphs, the invariants as property tests, the cost).

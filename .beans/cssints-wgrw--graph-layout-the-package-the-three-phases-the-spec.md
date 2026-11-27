---
# cssints-wgrw
title: 'graph-layout: the package, the three phases, the spec''s eight scenarios'
status: todo
type: feature
priority: high
tags:
    - layout
created_at: 2026-11-27T20:27:29Z
updated_at: 2026-11-27T20:27:29Z
parent: cssints-sw9a
---

The epic's first slice: the engine behind the spec that shipped in `0a088663`.

`@cssints/graph-layout`, a package of pure functions — a graph in, layers and ranks out. No DOM, no reactivity, no
attributes; `@cssints/headless` keeps the diagram primitive, which is a widget.

- [ ] `packages/graph-layout`: `src/index.ts`, README, tests, the changesets `fixed` group and a `minor` changeset; the name
  is free (`@cssints/layout` is the CSS layout plugin)
- [ ] `layout(graph)` with the three phases as the spec states them: cycle breaking by model order (a backwards edge is
  reversed), longest-path layering, ranks in model order; the return is `{ layers, ranks }`
- [ ] a driver over `@cssints/apg-specs/scenario` and the eight scenarios of
  `scenarios/patterns/graph-layout.spec.json` replayed in Node against the engine — the same scenarios the model and elk-rs
  already pass
- [ ] `differentialWalk` against the generated spec model in Chromium (vitest browser mode, as `@cssints/headless` does),
  with `layersOf` as the compared value
- [ ] `@cssints/apg-specs` a devDependency only: no published code imports it

Approach notes: the phases are pure functions over `{ nodes, edges }`; the six graphs of the spec are a fixture, not the
API. A backwards edge is the one whose target precedes its source in the node order, which is what makes the result a
function of the input.

Done when: the eight scenarios pass against the model and the engine, the walk is green, and the package's tests, the root
`bun run lint` and `bun run typecheck` are clean.

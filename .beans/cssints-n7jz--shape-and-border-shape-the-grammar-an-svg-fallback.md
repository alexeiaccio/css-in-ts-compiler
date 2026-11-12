---
# cssints-n7jz
title: 'shape() and border-shape: the grammar, an SVG fallback, and the board''s shape line'
status: completed
type: feature
created_at: 2026-11-12T11:21:49Z
updated_at: 2026-11-12T11:21:49Z
---

The third article of Temani Afif's series (blog.master.dev, 2026-11-11) draws graphs with `shape()` and `border-shape`; neither was in the grammar (mdn-data 2.27.1 lacks both, @webref/css 8.7.5 has both, BCD has `css.properties.border-shape` Chrome 147 and `css.types.basic-shape.shape` Chrome 135).

## What shipped

- `border-shape` in `AHEAD_OF_CHROME` (webref's grammar, verbatim) and `shape()` in `<basic-shape>`, so `clip-path`, `shape-outside` and `offset-path` take it too.
- `shape()` is checked by `src/shape.ts` (the twin), not the call grammar: a `#` list of multi-keyword commands fits no separator. The types read the body as balanced tokens (`runtimeOnly` cases for the invalid ones).
- The same file generates the fallback: `shapePath(value, box?)` → `{ d, viewBox }`, with the smooth reflection and the spec's arc defaults (ccw, small, one radius against the direction-agnostic size).
- Support keys: `css.types.shape` is a referenced SVG shape and answered for the function, so `support.ts` and `scripts/members.ts` point `shape` at `css.types.basic-shape.shape`.
- The board's `line: "shape"` edge: `connectorBetween` gives one cubic in percentages of the union box, `border-shape: var(--_shape)` draws it, and the same string becomes the SVG path with `vector-effect: non-scaling-stroke`; `@supports` decides which one paints.

## Checks

`packages/css-grammar/test/shape.ts` (the article's shapes, the spec's speech bubble, `by`/`from end`, arcs, keywords, errors), the grammar suite (both twins agree; invalid bodies are `runtimeOnly`), `packages/cssints` (fixture with `borderShape`/`clipPath`, a build error for `curve` without `with`, docs blocks, whole suite), the board conformance test (union box, path equals `shapePath` of `--_shape`, one surface per `CSS.supports`), `apps/ui` typecheck, build and `test:site`.

## Not taken

`anchor()`/`anchor-size()` positioning for the connector (Chrome-only too, no fallback: the boxes are data here), and a CSS connector as the board's default line (a band cannot route around a card; perfect-arrows stays).

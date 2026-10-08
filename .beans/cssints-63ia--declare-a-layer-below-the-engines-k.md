---
# cssints-63ia
title: Declare a layer below the engine's _.k
status: completed
type: feature
priority: normal
created_at: 2026-10-08T09:42:19Z
updated_at: 2026-10-08T11:10:00Z
---

Found by reset() (cssints-n9my, repro under "## Engine gaps"). Every declared layer is printed after `@layer _.k, _.a, ...;`, so a `reset` layer ranks above the classes and `* { margin: 0 }` beats `margin("1rem")`. reset() works around it with a global `@layer reset { ... }` that nests as `_.k.reset`; a user stylesheet cannot then name a layer between the reset and cssints.

## Todo
- [x] a `{ layers: [...], before: true }` (or similar) entry printed before `_.k`
- [x] move reset() to it

## Summary of Changes

- API: `layers("reset", { before: true })`; a table entry `{ layers: ["reset"], before: true }`; `layers: { layers: [...], before: true }` from `build` (a plain list stays after). The sheet prints the statements before the engine's first: `@layer reset;` then `@layer _.k, _.a, …;` then the layers after. Each side keeps the old rules (one order, holder first, longest then by name): deterministic across scopes. A layer declared on both sides is a build error at the second call (`layers(reset) declares reset after the engine's layers, and layers(reset) before`).
- Engine: `LayersDecl { names, before? }` on nodes and the registry; `@layers<\t` sheet entries; `check.contrast` ranks before-layers < `_.k` < after-layers. Only the order of statements changed, not sheet freshness: the Quint model is untouched.
- Tests: sheet.mjs (order, both-ways errors), plugin-seams.mjs (fixture layers-both.ts, located error), types (themes.ts, scope.ts).
- @cssints/reset: globals in `layer: "reset"` with `layers: { layers: ["reset"], before: true }`; test asserts `@layer reset;` before `_.k`, no nesting; README (sheet, `layers("reset", "base", { before: true })` for a layer in between).
- docs/API.md (layers, plugins table entry and globals, packages table), docs/wayfinder.md entry; dist rebuilt.

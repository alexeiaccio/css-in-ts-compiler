---
"@cssints/headless": minor
"@cssints/apg-specs": minor
---

The V2 half of the platform's `focusgroup` contract is now ours, because nothing publishes it: no engine reports
`focusGroup.supports("grid")`, npm's `@microsoft/focusgroup-polyfill` 1.6.0 has no grid token at all, and the
polyfill's `main` (grid merged 2026-09-29) has no built `dist`.

`focusGrid(owner, { definition, items })` renders `focusgroup="grid"` / `"grid manual"` (plus the per-axis
`rowwrap` / `rowflow` / `colwrap` / `colflow` and `nomemory`) and provides the movement where the engine does not:
one tab stop over the authors' `tabindex`, arrows on both axes, Home / End per row, Ctrl+Home / Ctrl+End for the
grid, hard edges by default with per-axis wrap and flow, `focusgroupstart` as the entry target, the last-focused
memory, the `focusgrouprow` markers of a manual topology, the native key-conflict guard, and an inert body when the
coordinates are not a rectangle. `destroy()` restores the authors' `tabindex` and removes the markers it added.
`focusgridAttribute` and `supportsFocusGrid` are exported too; no new dependency.

`@cssints/apg-specs` gains `specs/patterns/focusgrid.qnt` (the contract: one tab stop, both axes, the per-axis
edges, entry / memory / `focusgroupstart`, `grid` vs `grid manual`, and what a grid does not do — spans, ragged
rows, virtualisation, edit, selection, `itemcontrols`), its bridge and scenario set, and the spec-only test.
`specs/apg/grid.qnt` is untouched and does not import it yet; adopting the runtime in `grid.ts` is a follow-up.

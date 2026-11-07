---
"@cssints/headless": minor
"@cssints/apg-specs": minor
---

`createGrid` hands the body's movement and its roving tab stop to the V2 `focusgroup="grid"` runtime
(`packages/headless/src/focusgrid.ts`): `gridProps` carries the `focusgroup` attribute rendered from the
same definition and a `ref` that builds the provider, the owner's `focusin` maps the focused cell back to
`row` / `col`, and arrows on both axes, Home/End, Ctrl+Home/End, the edges and the last-focused memory are
no longer the primitive's. The definition maps APG's linear wrapping to the platform's `flow`, not `wrap`:
`{ rowEdge: wrapCols ? "flow" : "none", colEdge: wrapRows ? "flow" : "none", memory: true }`, re-applied
through `update(definition)` by `setWrapCols` / `setWrapRows` / `setGridKind` (`setFocusTarget` only
re-collects). The library keeps edit mode, selection, sort, PageUp/PageDown, the mount window, the `aria-*`
indices and the header row's own one-dimensional roving — the headers are `focusgroup="none"`, so neither
provider pulls them into the body's group. `date-picker` now finds the current day by the grid's
`currentCellId()` instead of `[tabindex="0"]`, and its `gridProps` no longer carries the runtime (the picker
owns its keyboard and stop). Breaking: `gridProps` gained `focusgroup` and `ref`; `cellProps` / `widgetProps`
gained `ref` and `focusgroupstart` and lost `onFocus` / `onKeyDown`; their `tabindex` is the constant
focusability value of the item set (`0` for the cells, `-1` when the widget is the target, and the reverse),
not the roving stop. To migrate, spread `gridProps` on the `role="grid"` element, spread
`cellProps` / `widgetProps`, delete any `tabindex` your host bound, and find the current cell by
`currentCellId()` rather than by `[tabindex="0"]`. `grid.qnt` now imports `shared/focusgroup.qnt`, adds the
platform's `tabStop` and derives `tabindex` from `fgTabIndex`, and pins the difference from the tablist:
grids have memory, so the stop is the last focused cell after focus leaves.

# @cssints/apg-specs

## 0.37.0

No changes in this release.

## 0.36.0

No changes in this release.

## 0.35.1

No changes in this release.

## 0.35.0

No changes in this release.

## 0.34.0

### Minor Changes

- 9a5a4dd: The V2 half of the platform's `focusgroup` contract is now ours, because nothing publishes it: no engine reports
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

- d2461a4: `createGrid` hands the body's movement and its roving tab stop to the V2 `focusgroup="grid"` runtime
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
- f2f755d: `createTabs` is now on the `focusgroup` adapter: the platform (Chromium 150+, or `@microsoft/focusgroup-polyfill`)
  owns the tablist's single tab stop, the arrows along the axis, Home / End and wrap, and the library keeps only
  its delta — selection, automatic vs manual activation, `aria-selected` / `aria-controls`, panel visibility,
  close and rename. The definition is `tablist nomemory wrap` (the vertical axis as `block`), with
  `focusgroupstart` on the selected tab, so the tablist is entered on the selection; the library selects on the
  `focusin` a move causes (automatic) or on Enter / Space (manual). A disabled tab is not an item of the group
  and carries a static `tabindex="-1"` instead of being arrow-reachable. `provider?: "auto" | "polyfill"` forces
  the polyfill (a test, or a host that needs the fallback).

  `tabs.qnt` now imports `shared/focusgroup.qnt` and models `tabStop` beside `selected`: the stop follows focus
  while focus is inside the tablist and returns to the selected tab on entry and leave, so manual activation and
  a controlled host that rejected a request are modelled the way the platform renders them.

  Breaking: `TabProps` no longer carries the roving `tabindex` (the provider writes it), and `Tabs.keyDown` is
  gone. `TablistProps` gained `focusgroup`, `ref` and `dir`; `TabProps` gained `focusgroupstart`, `ref`, and a
  static `tabindex: -1` on a disabled tab only. To migrate, spread `tablistProps` on the owner and `tabProps(i)`
  on each tab, delete any `tabindex` you bound on a tab, and — if a tab is not a natively focusable element (a
  `<div role="tab">`) — give that element its own `tabindex="0"`; the platform still keeps one stop among them.

## 0.33.0

No changes in this release.

## 0.32.0

No changes in this release.

## 0.31.0

No changes in this release.

## 0.30.1

No changes in this release.

## 0.30.0

No changes in this release.

## 0.29.0

No changes in this release.

## 0.28.0

No changes in this release.

## 0.27.0

### Minor Changes

- 51dd78a: An animated disclosure's machine (`specs/patterns/animation.qnt`) and its bridge, scenarios and spec-only test: the protocol a signal cannot hold — two intents in one frame ending at the last one with one live effect, a superseded effect cancelled and its late completion ignored, a reversal continuing from the box's own progress, one effect handle per transition, and the debounce window whose last intent always wins — plus the optimistic split between the state the host exposes (`aria-expanded`) and the state the machine has committed. Fifteen invariants, `Atomic` among them as the mapping note to `reactive.qnt`'s one-flush property, and 15 scenarios through the spec driver. There is no APG pattern and no CSS specification to cite, so it lives in `specs/patterns/` beside `resizable-panels` and `dropzone`, and the header says the protocol itself is the source of truth.

## 0.26.0

### Minor Changes

- 53f573a: A Quint machine for the drop zone (`specs/patterns/dropzone.qnt`) and its bridge, scenarios and spec-only test: the drag depth (0 none, 1 the zone, 2 a child), `disabled` and the last delivery, with the five invariants `DraggingIffDepth`, `DepthClearsOnDrop`, `DepthClearsOnExit`, `DisabledNeverDelivers`, `OneDropOneBatch` and `DepthNeverNegative`. There is no APG pattern for file dropping, so it lives in `specs/patterns/` beside `resizable-panels`, and `@cssints/headless`'s `dropzone-spec.browser.test.tsx` replays it in Chromium.

  `Probe` gained `value`, off by default: a pattern whose observable state has no attribute of its own (the drop zone's `dragging()` and `message()`) can now have it compared by the differential walk.

## 0.25.0

### Minor Changes

- a8e92ae: A Quint model of `@cssints/reactive`'s owners, programs and flush (`specs/patterns/reactive.qnt`, `src/patterns/reactive.bridge.ts` and two scenario sets in `scenarios/patterns/`), replayed on a page in `packages/reactive/test/scenarios.mjs` with the scenario engine and two seeded differential walks. The model states that `inside()` is a CSS ancestor match, not nearest-scoped, for a nested owner that declares the same state as an outer one.

## 0.24.0

### Minor Changes

- cde22d7: `createSliderMultiThumb` takes a press on the rail and drags. `trackProps` reads the
  pointer's position on the rail in all four orientation/direction combinations,
  names the nearer thumb (a tie goes to the lower) and moves it there; a press that
  starts on a thumb drags it from the value it already has, without a jump. Every
  `pointermove` asks for that thumb's value again, rounded to `step` and clamped at
  the neighbour, until `pointerup`, `pointercancel` or a lost capture. The rail owns
  the gesture with pointer capture, so the moves sit on `trackProps` and the thumb
  only marks its own press. `focused()` now reads synchronously, so a host can move
  the DOM focus to the thumb a press named. `disabled` announces `aria-disabled` on
  both thumbs, keeps their tab stops, and drops every key, rail press and drag.
  `pointerDown(index, 0..1)` stays for a programmatic press and the differential
  walk. `slider-multithumb.qnt` records the nearest-thumb press and the drag as
  deliberate extensions and names the invariants the model does not carry
  (`NearestThumbTakesPress`, `DragFollowsPointer`), with
  `slider-multithumb.browser.test.tsx` as their oracle. The kit's two-thumb slider
  drops its own press arithmetic and focuses the thumb the primitive announces.

## 0.23.0

### Minor Changes

- 93ce448: `createSlider` drags: a `pointerdown` on the rail jumps to the pointer and starts a
  drag, a press on the thumb starts it where the value is, and `pointermove` follows the
  pointer's position on the rail (rounded to `step`, clamped to `min`/`max`, in all four
  orientation/direction combinations) until `pointerup`, `pointercancel` or a lost capture.
  The rail owns the gesture with pointer capture, so `trackProps` carries the moves and the
  release and the thumb only marks its own press; a drag is still one request per distinct
  value, so a controlled host that ignores it keeps its value, and `disabled` captures
  nothing and changes nothing. `slider.qnt` records the drag as a deliberate extension and
  names the invariant the model does not carry (`DragFollowsPointer`), with
  `slider.browser.test.tsx` as its oracle.

## 0.22.0

No changes in this release.

## 0.21.0

### Minor Changes

- ab516f1: `createCombobox` takes `disabled`: the combobox and its trigger announce `aria-disabled`, the combobox keeps its tab
  stop, and a key, a click, a typeahead character, a filter input and an option click change nothing, so no popup opens;
  `setOpen` / `setValue` stay host requests. The spec records it as a deliberate extension (no model var), so
  `combobox.browser.test.tsx` is its oracle. `createCheckboxGroup`'s children take `<base>-0`..`-2` instead of `"0"`,
  `"1"`, `"2"`, so two groups on one page no longer share ids.

## 0.20.0

### Minor Changes

- b81b4b1: `@cssints/headless`: two ARIA gaps the styled kit hit. `createMenu` takes a controlled open state — `open`, `defaultOpen` and `onOpenChange` on top of `createControllable` — and every intent that opens or closes (the trigger's click and keys, Escape, an item's activation, Tab, `openMenu` / `closeMenu`) is a request the host may ignore; a rejected request leaves the focus where it was, as `menu-button.qnt` models it. `createCheckboxGroup` takes the name, the description and the error `createField` gives a control: `label` (`aria-label`) or `labelledby`, `describedby`, `invalid` / `error` (`aria-invalid`, the error id in `aria-describedby`, and an `errorProps` element that is `role="alert"` while it is shown), plus the group element's `id`. `menu-button.qnt` changed minimally: a host write of the open value it already has moves no focus, because no widget can observe it; regenerated, nothing else moved.

## 0.19.0

### Minor Changes

- 2022f38: `createSlider` and `createSpinbutton` take `disabled`: a disabled slider announces `aria-disabled` on its thumb, keeps
  the thumb as its tab stop and drops every key and rail press; a disabled spinbutton's field announces `aria-disabled`
  and carries the native `disabled`, takes no typing or spin key, and offers neither stepper. The APG specs record it as a
  deliberate extension of the patterns (no model var), so the browser tests are its oracle.

## 0.18.0

No changes in this release.

## 0.17.0

No changes in this release.

## 0.16.0

No changes in this release.

## 0.15.0

No changes in this release.

## 0.14.0

No changes in this release.

## 0.13.1

No changes in this release.

## 0.13.0

No changes in this release.

## 0.12.1

No changes in this release.

## 0.12.0

No changes in this release.

## 0.11.0

### Patch Changes

- 20c14ca: `parseScenarioFile` takes `unknown` rather than `Schema.Json`: a scenario file arrives as a JSON import, whose type has no index signature, so a copy of a test could not pass `tsc` without a cast. The schema was already the check that matters.

## 0.10.0

No changes in this release.

## 0.9.0

No changes in this release.

## 0.8.0

No changes in this release.

## 0.7.0

No changes in this release.

## 0.6.1

### Patch Changes

- 337af7e: effect 4.0.6 (from 4.0.0) in the packages that depend on it, and every package rebuilt with vite-plus 1.4.0 (tsdown 0.23.1): the bundles change shape, the API does not. `dist/` is no longer tracked in the repository, the release builds it.

## 0.6.0

### Minor Changes

- `@cssints/headless`: `createResizablePanels`, a group of N panes and N-1 separators — percent sizes that always sum to 100, per-pane min/max, collapsible panes, arrows and Home/End as pair moves, Enter to collapse and restore, a pointer drag that re-solves from the pointerdown snapshot, controlled `sizes` + `onSizesChange`, and a `storageKey`. `@cssints/apg-specs`: `specs/patterns/resizable-panels.qnt` (not an APG pattern: a group of window splitters), its generated model, the bridge with the drag vocabulary, 11 scenarios under `scenarios/patterns/`, and the `patterns/` exports.

## 0.5.2

### Patch Changes

- 62d2a2a: `@cssints/apg-specs`, first release: the 43 APG and canvas Quint specs, their generated models, the scenario bridges and replay runner, and the ported scenario sets, the test oracle of `@cssints/headless`, as subpath exports (`/scenario`, `/apg/<pattern>.bridge`, `/apg/<pattern>.model.json`, `/scenarios/apg/*.json`, `/specs/apg/*.qnt`).

# Changelog

All 25 packages share one version (`cssints` and every `@cssints/*`). cssints is in alpha: on 0.x a minor version can break, and each breaking change here says how to migrate. The entries come from the changesets of each release (`scripts/changelog.mjs`, run by `bun run version-packages`).

## 0.34.0 (2026-11-07)

### Minor changes

- `@cssints/data`: `data()`, statistics over runtime values computed by the browser's layout — the largest, the total and the
  count of a list's `--value`s, read back with `round(100cqw / 1px)` in a container query and printed by a counter. No
  runtime and no state: the values stay the host's, and changing one updates the answer in the same frame. The DOM contract
  and its accessibility note (the printed number is not text a screen reader sees) are in the README.
- The V2 half of the platform's `focusgroup` contract is now ours, because nothing publishes it: no engine reports
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
- `@cssints/gamut`: gamut and contrast colour maths at build time — `fit()` brings a colour into sRGB or Display P3,
  `readable()` gives a text colour that reaches a WCAG 2 ratio on a background, and `tones()` a lightness scale as DTCG data
  for `createTokens`. The decisions are [gamutant](https://github.com/noscripting/gamutant)'s, made once with culori instead
  of per element in CSS.
- The platform's `focusgroup` contract is now one adapter: `focusGroup(owner, { definition, items })` sets the
  owner's `focusgroup` attribute where the engine has it (Chromium 150+) and otherwise drives
  `@microsoft/focusgroup-polyfill`'s low-level `FocusGroup` over an array-backed item collection, with
  `update()` and the measured teardown (`update({ definition: {} })` before `disconnect()`).
  `focusGroupPolyfill`, `focusGroupAttribute` and `supportsFocusGroup` are exported too; the polyfill is a new
  dependency (MIT, 5.5 KB gz).
  
  `createToolbar` is the first widget on it: the platform now moves focus (arrows, Home / End, wrap, memory) and
  owns the item `tabindex`.
  
  Breaking: `ToolbarItemProps` no longer carries `tabindex` — the platform owns it — and `Toolbar.keyDown` is
  gone. `toolbarProps` gained `focusgroup` and `ref` and lost `onKeyDown`. To migrate, spread `toolbarProps` on
  the owner, `itemProps(i)` on each item, and delete any `tabindex` you bound on an item.
- `createGrid` hands the body's movement and its roving tab stop to the V2 `focusgroup="grid"` runtime
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
- `createListbox` is the second widget on the `focusgroup` adapter: the platform (Chromium 150+) or
  `@microsoft/focusgroup-polyfill` now owns the roving tab stop, the arrows along the block axis (no wrap),
  Home / End and the last-focused memory, and the primitive never computes them. `focus` / `active` are
  readings of the DOM — an option's `focus` is the move — so a platform arrow, a click and a host's own
  `element.focus()` land in the same state. The library keeps its delta: the selection model, `aria-selected`,
  range selection (Shift+Arrow, Shift+Space, Ctrl+Shift+Home/End), type-ahead, `aria-disabled` options (an
  option the arrows must not reach is out of the item collection and wears `focusgroup="none"`), and the
  `aria-activedescendant` listbox a host keeps DOM focus on is unchanged — a focusgroup is a roving model,
  so that mode keeps its own arrow handling, as `createRearrangeableListbox` does.
  
  Breaking: `listboxProps` gained `focusgroup` and `ref` and lost `onKeyDown` (the listener is registered by
  the ref, before the provider's), and `optionProps` gained `focusgroup` and `ref`. The option `tabindex` is
  no longer the roving one — it is the constant focusability value (`0`, `-1` when disabled), because the
  platform owns WHICH option is the tab stop and the item only has to be focusable for it to own one. `keyDown`
  still drives the selection keys, but no longer moves the active option. To migrate, spread `listboxProps` on
  the owner (its `ref` is required — without it nothing moves), `optionProps(i)` on each option, delete any
  `tabindex` you bound after them and any code that reads `[tabindex="0"]` to find the active option: use
  `active()` or `aria-activedescendant`. A host that moved DOM focus to the active option must keep doing so
  for programmatic moves (type-ahead, a click, a controlled `activeValue`); the platform's own moves need no
  mirror.
- `createMenu` and `createMenubar` now take the item `tabindex` and the movement along every level's axis from the
  platform's `focusgroup` contract instead of computing them: the menu list is one `focusgroup="menu"` segment
  (block axis, wrap), the menubar is one `focusgroup="menubar"` segment (the declared axis and wrap) and each
  submenu is its own `menu` segment, because the contract is per segment and a popup's list is a segment only
  while the popup is shown (a closed one is suspended with `focusgroup="none"`, which also keeps the native engine
  out of a hidden list). The arrows along each axis, Home / End, the wrap and the tab stop are the browser's
  (Chromium 150+) or `@microsoft/focusgroup-polyfill`'s, behind the same `provider: "auto" | "polyfill"` seam
  `createToolbar` has.
  
  The library keeps what the platform never infers: activation (Enter / Space), Escape and Tab, typeahead, the
  cross-axis keys (a submenu, the next / previous bar item, the open keys of the bar), the checkable state, the
  `aria-haspopup` / `aria-expanded` sync and the light dismiss. Its keydown listener is registered by the owner's
  `ref` **before** the provider's, so a key it consumes is `preventDefault`ed by the time the polyfill (also on the
  owner) reads it — a delegated Solid `onKeyDown` would run at the document, after focus had moved.
  
  Breaking: `MenuItemProps` no longer carries `tabindex` and `menuProps` / `menubarProps` no longer carry
  `onKeyDown`; the list, the bar, each menu and each submenu gained `focusgroup` and `ref`, and the item props
  gained `ref`. `keyDown(key)` now takes only the keys the library owns — the arrows, Home and End are the
  platform's and are no-ops there. To migrate, spread `menuProps` on the list (and `menubarProps` on the bar,
  `menuProps(i)` / `submenuProps(i, j)` on each popup), spread `itemProps(i)` on each row, delete any `tabindex`
  you bound, and render rows that are focusable by nature (`<button>`, `<a href>`): the native engine writes no
  `tabindex`, so it can only move focus to an item that is tabbable already. A `minor`, since `@cssints/headless`
  is 0.x.
- `createRadioGroup`'s roving flavor is now the platform's `focusgroup="radiogroup"` contract: the group
  builds its provider from the owner's `ref`, and the browser (Chromium 150+) or
  `@microsoft/focusgroup-polyfill` moves focus on both axes, wraps, and owns the item `tabindex`. Two things
  stay the library's, as `shared/focusgroup.qnt` leaves them to the pattern: **selection follows focus** (the
  owner's `focusin` handler checks the radio the platform landed on — a Tab entry or a click only moves the
  focus state) and the **entry point**: the definition is `nomemory` with `focusgroupstart` on the checked
  radio (else the first enabled one), which is where the next Tab entry lands. While focus is inside the group
  the tab stop is the platform's — the focused radio — and the primitive does not re-seat it; that is what a
  native engine keeps (in its focus controller) and what the polyfill renders as `tabindex=0`. A disabled radio
  is opted out of the group (`focusgroup="none"`) and keeps `tabindex="-1"`, as before. The
  `aria-activedescendant` flavor is unchanged: it moves a virtual focus on the group, which focusgroup does
  not model.
  
  Breaking: the group props gained `focusgroup`, `ref` and `dir`, and `RadioGroup.keyDown` is gone — the
  platform moves focus. `RadioProps` no longer carries a roving `tabindex` (the platform writes `0` / `-1`);
  what it carries is the author value the platform needs: `focusgroupstart` on the entry radio,
  `focusgroup="none"` plus `tabindex="-1"` on a disabled one, and — only where the native engine is used —
  `tabindex="0"`, because that engine navigates only items with `tabIndex > -1` and a `<div role=radio>` is
  not focusable otherwise. To migrate, spread `radiogroupProps` on the owner (keeping its `ref`), `radioProps(i)`
  on each radio, and delete any roving `tabindex` you bound on an item.
  
  `radio.qnt` now models that stop instead of pinning it to the check (`radioTabindex` is `fgTabIndex`, the
  entry and leave transitions are `fgEntry` / `fgStopOnLeave`), so the differential walk checks the stop the
  engine keeps rather than one the widget could only fake by scripting the tabindex.
- `createTabs` is now on the `focusgroup` adapter: the platform (Chromium 150+, or `@microsoft/focusgroup-polyfill`)
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

## 0.33.0 (2026-11-04)

### Minor changes

- A pointer drag says where it will land (`state().landing`, the origin the release will commit, snapped, clamped and `null` when no drag runs), and when the commit has to move the node — a world-bound clamp — `state().drop` gives the correction as `from`/`to`, so a host can draw the landing and animate the move.

## 0.32.0 (2026-11-04)

### Minor changes

- Pseudo-elements are wrappers: `css.before(...)`, `css.after(...)`, `css.placeholder(...)`, `css.selection(...)`, `css.markerElement(...)` and the rest of the standard set without arguments, from mdn-data. They join the element itself, so they are the innermost condition — `hover(before(...))` is `.k:hover::before`, and the other order is a build error at its call. `::marker` is also the `marker` property, so its wrapper is `markerElement`, as a function named like a pseudo-class takes `Fn`. A pseudo-element that paints still needs its `content`, as in CSS.
- The canvas handle converts between screen and world points (`screenToWorld`, `worldToScreen`), so a host can draw a remote cursor or hit-test outside the pointer pipeline.

## 0.31.0 (2026-11-03)

### Minor changes

- A story declares its own `argTypes`, over the meta's: a file whose stories have different args gives each of them the
  controls it uses (`Story.argTypes`, merged per arg as CSF 3 merges it).

## 0.30.1 (2026-11-03)

### Patch changes

- `TableProps` declares the `role: "table"` it has always returned.
  
  The object `tableProps` has carried the role since 0.30.0 — that is what makes a `display: contents`
  skin keep the table's place in the accessibility tree — but the interface left it out, so a skin
  written in TypeScript could spread it and still not read it. No behaviour changes.

## 0.30.0 (2026-11-03)

### Minor changes

- A table states its roles, and a column may name its track.
  
  `createTable` used to add no `role`, because a native `<table>` said it itself. A skin that lays the
  rows out as a CSS grid cannot: `display: contents` on `<thead>`/`<tbody>`/`<tr>` leaves those
  elements without a box, and an element without a box keeps its place in the accessibility tree only
  when it carries its own role. Every part now states one (`table`, `rowgroup`, `row`,
  `columnheader`, `cell`), a grid skin can be built without losing the semantics, and
  `TableColumn.width` carries the CSS track a `grid-template-columns` needs.
  
  The body row's `aria-rowindex` stays the skin's job: under a window only the host knows a row's
  place in the whole set (the primitive is given the window), so `renderRow(row, index)` is where it
  goes.

## 0.29.0 (2026-11-02)

### Minor changes

- `createPanZoom` gains `panBy(dx, dy)`: a relative pan through the same bounded `move` as a drag, for a host that moves the picture without a pointer (an inertial glide after a flick). The clamp and `onPanChange` apply exactly as they do to a pointer.
- `@cssints/stories`: the CSF 3 loader of a cssints storybook, published — `entries()`, `storyOfId()`, `parseHash()` and the `Meta`/`Story`/`ArgTypes` types, with the ids Storybook builds. It was the loader of `apps/ui` and `apps/lab`; a native storybook is the third reader, so it is a package instead of two copies.

### Patch changes

- The virtualizer's measured jump is now `@cssints/machine`'s `settle` machine: one definition for the target, the
  landings, the manual scroll, the count shrink and the stale completion. No behaviour change.

## 0.28.0 (2026-11-02)

### Minor changes

- `createTreegrid`: the Right arrow decides before the expansion is written, so a collapsed parent always expands and keeps the row focused instead of depending on read-after-write timing. Removed the options that were never read — `SwitchOptions.id`, `TooltipTriggerInput.label` and `PaginationLabels.gap` — and corrected the textbox's `onValueChange` note (it is the `input` event).

### Patch changes

- `createResizablePanels`: a pane's `defaultSize` is kept, and the panes that name none share the rest equally instead of the first pane taking the residual.

## 0.27.0 (2026-11-01)

### Minor changes

- An animated disclosure's machine (`specs/patterns/animation.qnt`) and its bridge, scenarios and spec-only test: the protocol a signal cannot hold — two intents in one frame ending at the last one with one live effect, a superseded effect cancelled and its late completion ignored, a reversal continuing from the box's own progress, one effect handle per transition, and the debounce window whose last intent always wins — plus the optimistic split between the state the host exposes (`aria-expanded`) and the state the machine has committed. Fifteen invariants, `Atomic` among them as the mapping note to `reactive.qnt`'s one-flush property, and 15 scenarios through the spec driver. There is no APG pattern and no CSS specification to cite, so it lives in `specs/patterns/` beside `resizable-panels` and `dropzone`, and the header says the protocol itself is the source of truth.
- `createVirtualizer`: a DOM virtualiser ported from the native renderer's window (`fixedWindow` / `measuredWindow`). The host renders only the visible rows plus an overscan and two gap-compensated spacers stand in for the rest, so the content height, the scroll's clamp and its thumb are the whole list's. A fixed `itemSize` is arithmetic; a per-row estimate (or no `itemSize` at all) measures the rendered rows through a `ResizeObserver`, declares the whole column while any height is unknown, and then virtualises at exact heights. Every declared row carries `aria-setsize` / `aria-posinset`, `attach` wires the scrollport without creating a computation (the `createPopover` ref lesson), and `scrollToIndex` is the host's focus hook. A measured jump keeps its target and lands again as the heights arrive (the first offset is an estimate), and a hand scroll cancels it.
- `@cssints/machine`: a minimal, dependency-free state machine for UI protocols — `defineMachine` with typed events and
  an inferred context, effects as data with handles (a stale completion is dropped), debounce with `flush` and `cancel`,
  an injectable clock, a selector store, a `./solid` bridge (`createStore`/`createProjection`/`createOptimisticStore`)
  and a harness that proves five properties in plain node.
- `createControllable`: an intent the host has not answered yet is one request. A controlled host's value is applied on
  Solid's flush, so two dismissals in the same frame (an Escape and a backdrop click, or a second Escape during a
  transition) used to ask `onValueChange` twice for the same state; the request path now remembers the intent it is
  waiting on for one microtask. A separate, later intent is asked again, so a host that refuses a close is still asked
  when the reader asks again.
- `createPagination`'s previous and next controls follow the current page: `previousProps` and `nextProps` are getters over an offset, and their `onClick` resolves the page when it runs. A host that spreads the object onto an anchor once can now step past the first move, which it could not before — the second click on Next targeted the page it was already on. `packages/headless/test/pagination.browser.test.tsx` covers it (next twice, then previous).
- `createToast`: the countdown asks before it removes. `onDismissRequest(handler)` is the expiry's channel, so a renderer
  can animate a row's departure and call `dismiss(id)` when it is gone; `requestDismiss(id)` is the same ask for a host's
  own imperative call, and it removes at once when no handler is subscribed, as `dismiss`, `dismissAll` and the ceiling
  always do.
- `createTreegrid` takes the tree it renders: `parents` is the parent of each row in document order (`-1` for a root), and `defaultExpanded` opens rows at mount. The spec's Email Inbox tree stays the default, so `treegrid.qnt` and every existing test are unchanged; a host with its own data no longer has to fit it into the seven spec rows.

## 0.26.0 (2026-10-31)

### Minor changes

- `createDatePicker` hands the host the popup's placement: `contentStyle()` is the same page-space `position: absolute` box `createPopover` gives. Without it the picker measured and flipped the popup but exposed nothing to put on the element, so a host that portalled the panel had to re-implement the placement or leave the panel at the page's top-left. `date-picker.browser.test.tsx` now asserts the panel starts one gap under the trigger's bottom edge.
  
  `createPopover.attach` and `createDatePicker.attach` no longer create a computation. A host calls `attach` from a `ref`,
  Solid 2 runs refs in the effect phase, and a primitive created there belongs to nobody: the dev build throws
  `PRIMITIVE_IN_EFFECT_CALLBACK` while the production one stays silent — so the packaged tanstack of this repo's tests passed
  and the starter smoke (a real `vite dev` build) failed on every popover and date-picker case. The measurement, the focus
  handover and the roving-day focus now live in effects created at setup, and `attach` only records the elements and adds
  listeners.
- A Quint machine for the drop zone (`specs/patterns/dropzone.qnt`) and its bridge, scenarios and spec-only test: the drag depth (0 none, 1 the zone, 2 a child), `disabled` and the last delivery, with the five invariants `DraggingIffDepth`, `DepthClearsOnDrop`, `DepthClearsOnExit`, `DisabledNeverDelivers`, `OneDropOneBatch` and `DepthNeverNegative`. There is no APG pattern for file dropping, so it lives in `specs/patterns/` beside `resizable-panels`, and `@cssints/headless`'s `dropzone-spec.browser.test.tsx` replays it in Chromium.
  
  `Probe` gained `value`, off by default: a pattern whose observable state has no attribute of its own (the drop zone's `dragging()` and `message()`) can now have it compared by the differential walk.
- `emit()` and `listen()`: the one hand-off to JavaScript. `on({ submit: emit("save") })` writes no state and dispatches a bubbling `reactive:save` `CustomEvent` from the element the native event fired on, its `detail` `{ event, owner }` (the native event and the nearest reactive owner); `listen(target, name, handler)` from `@cssints/reactive/runtime` hears it and returns a disposer.
- `createTabs` takes `dir: "ltr" | "rtl"` (default ltr). A horizontal tablist swaps ArrowLeft / ArrowRight in a right-to-left page, as `radio.ts` does; a vertical tablist keeps Up / Down, and ltr is unchanged. `tabs.qnt` still models ltr only, so the ported `direction` scenarios stay skipped in the differential walk and `test/tabs-requirements.browser.test.tsx` holds the arrow swap.
  
  The same file closes four other requirement gaps in `packages/headless/docs/requirements/tabs.md`: roles and names (G3), focus leaving the component with hidden panels out of the tab order (G6), activation on the up event (G8), and RTL (G11). G5 (icons) is documented as a host obligation; the other seven gaps stay open.

## 0.25.0 (2026-10-31)

### Minor changes

- `@cssints/headless`: the second composition, a date picker. `createDatePicker` is `createPopover` + `createGrid` + `createStatus`, not a new primitive: a trigger with `aria-haspopup="dialog"` opens a **non-modal** popup (Tab leaves it, nothing behind it is `inert`) holding a `role="grid"` month of six rows, with `aria-selected` on the chosen day, `aria-current="date"` on today and `aria-disabled` outside `min`/`max`. The calendar maths is integer day numbers — a UTC day index, no locale arithmetic and no `@internationalized/date` — so leap years and month lengths are one `Date` read. `monthDays()` paints the neighbouring days rather than blanks so every cell can hold the roving focus; arrows move a day or a week, Home/End the week, PageUp/PageDown the month, Shift+PageUp/PageDown the year, Enter/Space selects and closes, Escape closes without changing the value. `firstDayOfWeek`, an injectable `today`, localised `labels` (including a day formatter for the polite announcement) and the controlled `value`/`open` pair are part of the API; a segmented date field stays a host composition of `createField` + `createSpinbutton`.
- `createFilterableMenu`: the filterable menu as a composition of `createDialogModal`, `createTextInput` and `createStatus` — a dialog whose trigger says `aria-haspopup="dialog"`, a `searchbox` field with no combobox affordances, and a filtered `role=menu` with groups, an empty state, one polite count, submenu levels, the arrow loop back to the field, the Home/End rule, the IME guard, and Tab/Escape leaving in Base UI's order. The host renders the groups, the submenu geometry and mounts the dialog only while open.
- `bind()` takes a comparison (`equals()`), a choice of two literals (`either()`) or a literal beside a source: the runtime derives `aria-selected`, roving `tabindex` and literal attributes like `aria-controls` from the nearest owner in the same flush, through three new kinds of `--reactive-binding`.
- A Quint model of `@cssints/reactive`'s owners, programs and flush (`specs/patterns/reactive.qnt`, `src/patterns/reactive.bridge.ts` and two scenario sets in `scenarios/patterns/`), replayed on a page in `packages/reactive/test/scenarios.mjs` with the scenario engine and two seeded differential walks. The model states that `inside()` is a CSS ancestor match, not nearest-scoped, for a nested owner that declares the same state as an outer one.

## 0.24.0 (2026-10-31)

### Minor changes

- `createDiagramFocus`: a diagram read from the keyboard — one roving tab stop over the nodes, arrows that follow the layout (nearest centre in that direction, wrapping at the edge), `e` for a cursor over the active node's outgoing edges, and a polite live region that says where the user is.
- A declaration can be a list: `append(prop, value)` in `cssints/plugin` joins two declarations of one property in one `cn()` instead of the later replacing the earlier, and a list beside a plain value is a build error.
- `createSliderMultiThumb` takes a press on the rail and drags. `trackProps` reads the
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
- `value()` and `checked()` read the field's value in `set()`, and calls of `on()`, `bind()` or `state()` on one element append their programs and lists instead of the later replacing the earlier.
- `persist(value, key)` keeps a state in `localStorage` across a reload: the runtime restores it when the owner is initialised (a stored value wins over the declared one) and stores it on every write, with the keys in a new non-inheriting `--reactive-persist` protocol property.

## 0.23.0 (2026-10-31)

### Minor changes

- `createSlider` drags: a `pointerdown` on the rail jumps to the pointer and starts a
  drag, a press on the thumb starts it where the value is, and `pointermove` follows the
  pointer's position on the rail (rounded to `step`, clamped to `min`/`max`, in all four
  orientation/direction combinations) until `pointerup`, `pointercancel` or a lost capture.
  The rail owns the gesture with pointer capture, so `trackProps` carries the moves and the
  release and the thumb only marks its own press; a drag is still one request per distinct
  value, so a controlled host that ignores it keeps its value, and `disabled` captures
  nothing and changes nothing. `slider.qnt` records the drag as a deliberate extension and
  names the invariant the model does not carry (`DragFollowsPointer`), with
  `slider.browser.test.tsx` as its oracle.

## 0.22.0 (2026-10-31)

### Minor changes

- The feedback that adopting 0.20.0 produced, in one release.
  
  **Lists that arrive later.** `createListbox`'s `items`, `createTable`'s `rows`, `createRadioGroup`'s `values` and `createTimeline`'s rows now take a getter (`() => list()`) and read it at attribute-read time, so an async fetch no longer forces the host to rebuild the widget and lose the active option, the selection and the roving tab stop. `listbox.items` is a getter over the live list; a `defaultValue` chosen before the items arrived now survives them.
  
  **Host-owned values.** `createRadioGroup` takes `value: () => checked()`, so `undefined` can be a real controlled state ("nothing checked") instead of meaning "uncontrolled"; its `radioProps` carries `type="button"`, so a radio rendered as a `<button>` no longer submits the form. `createStatus` and `createAlert` take `from: () => text`, and read the host's signal directly instead of asking for an effect that mirrors it into `show()`.
  
  **Host-named ids.** `createTabs` takes `tabId(index)` and `panelId(index)`, and `aria-controls` / `aria-labelledby` follow them: a console whose panels are `#traces`, `#logs`, `#metrics` no longer re-implements the two attributes.
  
  **Drop zone.** `maxFiles` caps one batch (a new `"count"` reject reason), `labels.labelledby` names the zone by the host's own visible heading, and `formatMessage` returns the announcement in the host's language from the same counts.
  
  **Timeline.** Rows mode reports `focusedId()`, the row that holds the roving tab stop.
  
  `test/props-later.browser.test.tsx` is the regression net for all of it.
- `createMenu` takes the checked state as a readable pair as well as the packed number: `checked` (the checked checkbox item indices) and `choice` (the chosen radio index, `-1` for none) with `onCheckedValuesChange(checked, choice)`. The readable pair is the store and the packed `value` / `onCheckedValueChange` (unchanged for existing callers and `menu-checkable.qnt`) is its derived view, so a controlled menu can check any checkbox item, not only item 0; `value()` joins `checked()` / `choice()` as the packed accessor.

### Patch changes

- The evaluation server compiles a dependency's `.jsx` inertly too.
  
  A package that ships `.jsx` sources (`@solidjs/router` does, behind its `solid` condition) reached the private Vite server of a build and the app server's `ssr` environment untransformed, where Vite's generic transform asked for `react/jsx-runtime` — which an app on another framework does not install, so the build failed on the first module importing it. A `.jsx` the runner follows into has the same job as the app's own components: its top level must run, its elements are irrelevant.

## 0.21.0 (2026-10-31)

### Minor changes

- CSS-first interactions: `state()` gives an owner element and one source per state, `toggle()`/`set()` write only inside `on()` (click, input, change, submit, key, pointer and focus events), `bind()` writes attributes from the nearest owner, and `when()`/`inside()` are plain CSS conditions on its `data-reactive-*` attributes. The DOM runtime ships to every target (1.75 kB minified, 0.87 kB gzipped).
- `createCombobox` takes `disabled`: the combobox and its trigger announce `aria-disabled`, the combobox keeps its tab
  stop, and a key, a click, a typeahead character, a filter input and an option click change nothing, so no popup opens;
  `setOpen` / `setValue` stay host requests. The spec records it as a deliberate extension (no model var), so
  `combobox.browser.test.tsx` is its oracle. `createCheckboxGroup`'s children take `<base>-0`..`-2` instead of `"0"`,
  `"1"`, `"2"`, so two groups on one page no longer share ids.
- A plugin runtime with a `script` (or `css`) and no `polyfills` is delivered for every target, not only where a target lacks a feature: a plugin whose own script is the feature (`@cssints/reactive`) ships it in every build. `ship({ owner, open })` (from `cssints/plugin`) is a site that returns more than a class string: each style becomes its class string and the rest its JSON, so `state()`'s owner and its sources reach the browser as an object.

## 0.20.0 (2026-10-30)

### Minor changes

- `@cssints/headless`: the first composition, a command palette. `createCommandPalette` is `createDialogModal` + `createTextInput` + `createStatus`, not a new primitive: the container is a modal dialog (announced as one), the field is `input[type=text][role=searchbox]` rather than a combobox because choosing a row runs a command instead of completing the field, and the list is a `listbox` filtered by a plain case-insensitive match on `label` and `keywords`. Focus stays in the field with `aria-activedescendant` on the highlight; ↓ on the last option and ↑ on the first return the highlight to the field; Home/End move the caret while there is text and are list keys while the field is empty; Enter closes and runs the command, Escape closes through the dialog. Groups, an empty state and one polite result count are part of the API, the query resets on close, and `attach()` binds the hotkey through `createHotkeys`. Rendering, grouping CSS, async command handling and the strings are the host's; the filterable menu and the date picker follow in later changes.
- `@cssints/headless`: two ARIA gaps the styled kit hit. `createMenu` takes a controlled open state — `open`, `defaultOpen` and `onOpenChange` on top of `createControllable` — and every intent that opens or closes (the trigger's click and keys, Escape, an item's activation, Tab, `openMenu` / `closeMenu`) is a request the host may ignore; a rejected request leaves the focus where it was, as `menu-button.qnt` models it. `createCheckboxGroup` takes the name, the description and the error `createField` gives a control: `label` (`aria-label`) or `labelledby`, `describedby`, `invalid` / `error` (`aria-invalid`, the error id in `aria-describedby`, and an `errorProps` element that is `role="alert"` while it is shown), plus the group element's `id`. `menu-button.qnt` changed minimally: a host write of the open value it already has moves no focus, because no widget can observe it; regenerated, nothing else moved.
- `@cssints/headless`: `createKnob`, a virtual knob after GarageBand's (spin around the centre, vertical or horizontal slide, one gesture locked per drag). It is a `role=slider` (no ARIA role exists for a dial) with `aria-valuenow` / `aria-valuetext`, keyboard steps, PageUp/PageDown, Home/End and a wheel, plus `percentOf` for the skin's rotation and a continuous `wrap` mode. There is no APG pattern, so no Quint spec: the contract is documented in the package README and `test/knob.browser.test.tsx` is its oracle.

## 0.19.0 (2026-10-30)

### Minor changes

- `createDropZone`: a file drop target on a hidden native `<input type="file">`, with a browse button as the accessible path
  (the zone is never drag-only), `accept` / `multiple` / `maxSize` validated once per file into `onFiles` and
  `onReject({ file, reason })`, a depth-counted `dragging()` that a child's `dragleave` does not clear, and a
  `role="status"` line the host fills with `message()` ("2 files, 1 rejected: too large"). A dropped folder or an empty
  `DataTransfer` is a no-op. No APG pattern and no Quint spec: `test/dropzone.browser.test.tsx` is its oracle.
- `createSlider` and `createSpinbutton` take `disabled`: a disabled slider announces `aria-disabled` on its thumb, keeps
  the thumb as its tab stop and drops every key and rail press; a disabled spinbutton's field announces `aria-disabled`
  and carries the native `disabled`, takes no typing or spin key, and offers neither stepper. The APG specs record it as a
  deliberate extension of the patterns (no model var), so the browser tests are its oracle.
- `createTabs` takes `closable` and `renamable` (both off by default, so the plain tablist is unchanged), `label`, and
  the requests `onClose` / `onRename`; it gains `closeProps`, `renameProps`, `editing`, and `focusAfterClose`. A close
  button stays out of the tablist's tab order (`tabindex=-1`) and Delete closes the focused tab; focus lands on the tab
  that slid into its place, or the previous one when the last tab closed, and the last remaining tab is never asked to
  close. A double click starts an inline rename: Enter commits, Escape reverts, blur commits, and the arrows are the
  input's while it runs. The primitive owns no list: it asks, the host removes or renames.
- `createTimeline` takes real span data: `createTimeline({ rows, axis, selected, onSelect })` lays a trace waterfall out over the rows' own extent (`extent`, `barProps` with `left`/`width` percentages and a `--depth` custom property, `labelProps`, `depthOf`, derived ruler `ticks`), with click, Enter and Space selection and a roving tab stop. The rows are `role="list"` / `role="listitem"` with `aria-level` and `aria-current` (no APG pattern exists for a waterfall), and a zero-length span keeps a 0.5% width floor so it stays visible. `createTimeline()` with no `rows` keeps the demo tree and its API.

## 0.18.0 (2026-10-30)

### Minor changes

- `createHotkeys`: one registry for the chords every app hand-rolls — `/`, Cmd/Ctrl+K, Cmd/Ctrl+S — with exact modifiers, `mod` as Cmd on macOS, a text-field guard, `when`, scopes and last-bound-wins precedence.
- `@cssints/headless`: `createPanZoom`, pan and zoom for one image in a viewport. There is no APG pattern for pan-zoom, so the contract is the module's own and `test/panzoom.browser.test.tsx` is its oracle: a focusable viewport (`role=group`, `tabindex=0`, `aria-roledescription="zoomable image"`, `aria-describedby` the value), keyboard operations that stand in for every gesture (`+` / `=` / `-` zoom by `step`, arrows pan by 24 px, Shift x4, `0` resets), and a polite live value (`"150%"`). The pointer adds drag-to-pan, a two-pointer pinch and a double-click reset; the wheel zooms only with `ctrl` / `meta` (the browser's pinch) and a bare wheel is left to the page. `bounds: "clamp"` keeps the scaled image covering the viewport, `"free"` lets it be dragged out. Not `createCanvas`: that is a camera over an infinite world, this is one image fitted to a box.
- `@cssints/headless`: `createScrollspy`, a table of contents whose current entry is the last heading to reach the top of the scrollport, with `aria-current="location"` on that link (exactly one at a time) and `role="list"` items. One passive `scroll` listener on the root (the document by default; `offset` is px below its top edge, so a sticky header passes its height), no `IntersectionObserver`: a total order over the headings is what the reader sees, and a band observer has to rebuild it from enter/leave state. Smooth scrolling stays the host's CSS. No APG pattern exists for a scrollspy, so `test/scrollspy.browser.test.tsx` is its oracle.

## 0.17.0 (2026-10-30)

### Minor changes

- `@cssints/headless`: `createTable`, a data table on a native `<table>`: sortable column headers with `aria-sort` on the sorted column only, a header button that cycles `ascending` -> `descending` -> unsorted by default (`sortCycle: "toggle"` for `ascending` <-> `descending`), and optional single or multiple row selection over ids with `aria-selected`, a mixed `aria-checked="mixed"` select-all, and `aria-rowcount` / `aria-colcount` / `aria-colindex` only while the host windows rows or columns. Sorting is the host's data: the primitive carries the descriptor and never reorders a row. It composes `grid-sort.qnt` and `grid-selection.qnt` without the grid's navigation, so `test/table.browser.test.tsx` is its oracle.

## 0.16.0 (2026-10-30)

### Minor changes

- `@cssints/headless`: `createDrawer`, the drawer / bottom-sheet shell over Dialog (Modal): `side` (`"left" | "right" | "bottom"`) and `modal` are the whole presentation API, so a sheet below a breakpoint and a side rail above it are one drawer; `modal` is read at attribute-read time, so the host's breakpoint may flip it while the drawer is open. A modal drawer has a backdrop, focus into the panel and back to the trigger, a Tab cycle, a counted page-wide scroll lock (shared with `createConfirm`, so a confirm over a drawer nests) and Escape from the document; a non-modal one keeps the page's scroll, focus and clicks. No drag-to-dismiss: a drag is the host's native scroll snap (docs/bottom-sheet.md), so `handleProps` is a decorative grab handle and swipe-to-dismiss stays a separate decision. No `attach`: the panel is edge-anchored and nothing is measured.

## 0.15.0 (2026-10-30)

### Minor changes

- `@cssints/headless`: `createToast`, a toast queue (one live region per toast, `role=alert` for the error tone and `role=status` otherwise, a 5000 ms timeout that pauses on hover and focus and resumes with the time left, `max` that drops the oldest, `dismiss`/`dismissAll`, and a `role=region` landmark), and `createStatus`, one polite `role=status` region whose text is replaced. No APG pattern exists for either, so the browser test is the oracle; the toast's own text is the announcement (the host renders the `title` and `description` given to `show`), and F6 into the region stays the host's handler (hotkeys are a separate bean).

## 0.14.0 (2026-10-30)

### Minor changes

- `@cssints/headless`: `createPopover`, the non-modal overlay: an anchored content a trigger opens, dismissed by a click on the trigger, an outside `pointerdown` or Escape, with focus moving into the content and back to the trigger, a placement that flips at the viewport edge, and `attach(trigger, content)` for the measure, the focus and the light dismiss. There is no APG pattern for a popover, so it follows Base UI's Popover and React Aria's `usePopover` and its oracle is the browser test; the page behind stays interactive (no `inert`, no scroll lock — that is `createDialogModal`).

## 0.13.1 (2026-10-30)

### Patch changes

- `@cssints/headless`: every optional `createTextInput` / `createTextArea` option is typed `T | undefined`, like the field's, so a host that passes a getter over an optional prop compiles under `exactOptionalPropertyTypes`.

## 0.13.0 (2026-10-30)

### Minor changes

- `@cssints/headless`: `createPagination` (a navigation landmark over a page list: one `aria-current="page"`, ends kept and disabled at the boundary, one gap per elided run, the count announced once in a `role="status"`, and `hrefFor` so the links work without JS), and `createTextInput` / `createTextArea` (the field contract plus `autocomplete` tokens, `inputmode`, `spellcheck`, `maxlength`, `readOnly`/`disabled`, and `rows`/`wrap`/`resize` for the area). Both are TetraLogical's last two components; neither has an APG pattern, so their oracles are the browser tests.

## 0.12.1 (2026-10-29)

### Patch changes

- `cssints/eval` is in the published manifest: `publishConfig.exports` shadows the top-level one at publish time, and the subpath
  was only in the latter (a consumer resolved it through the `./*` wildcard, without its own types).

## 0.12.0 (2026-10-29)

### Minor changes

- appear(): the same entrance presets as reveal(), but scroll-triggered (timeline-trigger + animation-trigger) with their own duration and easing, an inOut() method, and the same IntersectionObserver fallback
- The library is imported by a subpath that cannot resolve to a browser build (`cssints/eval`), and a runner whose ssr
  environment is not one (vitest's browser mode puts `browser` in its conditions) gets an evaluation server of the plugin's own,
  with the app's aliases, dedupe, conditions and `noExternal`; `cssints({ evaluation: { inline: [...] } })` names what a framework
  needs inlined when that environment inlines everything. A styled component — `cv()`, tokens, `attr()`/`within()` and `render` —
  now runs its browser test in vitest, which it could not before.
- Kernels: a scope may declare a custom property another scope owns (motion's `--motion-*` in reveal's kernel), so `motion()` and `reveal()` can sit in one app; two kernels of one scope still may not share one of its names, nor may two scopes share a name neither of them owns

## 0.11.0 (2026-10-28)

### Minor changes

- `createTokens` takes a leaf as its value when the group's `$type` is in scope: `color: { $type: "color", bg: "#fff", link: "{color.accent}" }`, the form a theme's overrides already take. A string is a value of the group's type and a number one for `number` and `fontWeight`; a DTCG object value, or a token with its own `$type`, `$description` or `$extensions`, keeps `{ $value }`. A value with no `$type` in scope is an error in the types and at build time.

### Patch changes

- `parseScenarioFile` takes `unknown` rather than `Schema.Json`: a scenario file arrives as a JSON import, whose type has no index signature, so a copy of a test could not pass `tsc` without a cast. The schema was already the check that matters.

## 0.10.0 (2026-10-27)

### Minor changes

- `@cssints/headless`: `createField` and `createConfirm`, found in two apps. `errorProps` is `role="alert"` while the error is shown (the hint is not); `createField({ describedby })` takes an id or a list of ids the host owns and appends them to `aria-describedby` after the hint and the error, for one form-level error that belongs to two controls; `id`, `required` and the other options accept `undefined`, so a getter over an optional prop typechecks under `exactOptionalPropertyTypes`. `createConfirm` gets the dialog shell it needed: Tab and Shift+Tab cycle inside the dialog, `overflow: hidden` on the document element while open (counted, restored on close), Escape from the document so it works with the focus outside, and the last confirm opened takes Escape and Tab when several are open. The default labels stay English: a translating host passes `confirmLabel` and `cancelLabel`.

## 0.9.0 (2026-10-26)

### Minor changes

- `@cssints/headless`: `createField`, the ARIA contract of a form field (`controlProps`, `labelProps`, `hintProps`, `errorProps`: ids that are stable, `aria-describedby` listing the hint and then the error while they are shown, `aria-invalid` only when invalid, `required` with `aria-required`, nothing that points at a hidden id), and `createConfirm`, a promise-based `confirm({ title, description?, confirmLabel?, cancelLabel?, destructive? })` over `createDialogModal({ role: "alertdialog" })`: `true` on confirm, `false` on cancel, Escape or the backdrop, focus on the cancel button and back to the invoker, one request at a time (a second one rejects with `ConfirmPendingError`). Neither has an APG pattern, so neither has a Quint spec.

## 0.8.0 (2026-10-25)

### Minor changes

- `scv()`: slot variants. `scv({ slots: { base, label, icon }, variants, defaultVariants, compoundVariants })` is one
  function whose result is the class string of every slot (`{ base, label, icon }`). A variant value that is a style styles
  the `base` slot, a record by slot styles the slots it names; in a `compoundVariants` entry, `class` is the `base` slot and
  a slot's own name styles that slot. The rules are `cv()`'s, computed per slot (a variant wins over the slot's base, a
  compound over both, and an overlap without containment is a build error that names the slot). Props are typed from
  `variants`, and the result is `{ [K in keyof slots]: string }`.

## 0.7.0 (2026-10-25)

### Minor changes

- `sx()`: one style built by chaining properties, with no `cn()`. Every property is a method, `.flex()` and `.grid()` with no argument set `display`, and a chain sets each property once — a second `bg` is a type error (a shorthand and its longhand stay legal, as in `cn()`). `cn()` is still the tool for runtime values and `cv()` variants.
- `cssints/clay`: `backdrop({ blur })` is glass over our own content — a renderer effect beside the declaration, since Clay 1.0 has no such field: the literal carries it as a sibling `backdrop` key, `header()` prints nothing for it, and the desktop renderer draws everything before the element, blurs the element's box in its own buffer, then draws the element over the blurred pixels, so a translucent fill shows the page behind it and the element's own text and border stay crisp. It is the frame's content, not the window behind the window, and the element needs an `id`.
- `cssints/clay`: `backgroundImage("linear-gradient(...)")` fills an element's box with a linear gradient — CSS's own grammar as one string: an optional direction (`<number>deg`, or `to top | to right | to bottom | to left`, 180deg by default) and two or more colour stops with an optional `<number>%`. A renderer effect beside the declaration, since Clay 1.0 has no gradient field: the literal carries it as a sibling `backgroundImage` key (`{ kind: "linear", angle, stops: [{ offset, color }] }`), `header()` prints nothing for it, the C targets keep their solid fill, and the desktop renderer fills the element's box instead of `backgroundColor`. A state may override the whole gradient, so `css.hover(css.backgroundImage(...))` lightens a card. Only linear gradients are drawn; radial, conic, repeating and `url()` are build errors.
- `cssints/clay`: `shadow({ x, y, blur, color })` is a shadow for an element — a renderer effect beside the declaration, since Clay 1.0 has no shadow field: the literal carries it as a sibling `shadow` key, `header()` prints nothing for it, and the desktop renderer draws it before the element's own command, keyed by Clay's element id. A state's overlay merges the fields it names, so `css.hover(css.shadow({ blur: 20 }))` keeps the base's offset and colour.

## 0.6.1 (2026-10-25)

### Patch changes

- effect 4.0.6 (from 4.0.0) in the packages that depend on it, and every package rebuilt with vite-plus 1.4.0 (tsdown 0.23.1): the bundles change shape, the API does not. `dist/` is no longer tracked in the repository, the release builds it.

## 0.6.0 (2026-10-23)

### Minor changes

- `@cssints/headless`: `createResizablePanels`, a group of N panes and N-1 separators — percent sizes that always sum to 100, per-pane min/max, collapsible panes, arrows and Home/End as pair moves, Enter to collapse and restore, a pointer drag that re-solves from the pointerdown snapshot, controlled `sizes` + `onSizesChange`, and a `storageKey`. `@cssints/apg-specs`: `specs/patterns/resizable-panels.qnt` (not an APG pattern: a group of window splitters), its generated model, the bridge with the drag vocabulary, 11 scenarios under `scenarios/patterns/`, and the `patterns/` exports.

## 0.5.2 (2026-10-23)

### Patch changes

- `@cssints/apg-specs`, first release: the 43 APG and canvas Quint specs, their generated models, the scenario bridges and replay runner, and the ported scenario sets, the test oracle of `@cssints/headless`, as subpath exports (`/scenario`, `/apg/<pattern>.bridge`, `/apg/<pattern>.model.json`, `/scenarios/apg/*.json`, `/specs/apg/*.qnt`).

## 0.5.1 (2026-10-23)

### Patch changes

- `@cssints/headless`, first release: headless APG widgets on Solid 2 (state and DOM attribute objects, no styling), each conformance-checked in Chromium against its Quint spec and the ported scenarios.

## 0.5.0 (2026-10-22)

### Minor changes

- `cssints/clay`: `image(src, { width, height, fit })` fills Clay's `image` — the path in `imageData` for the renderer to load, the image's size as the element's box, and `fit: "contain"` as Clay's `aspectRatio`.

### Patch changes

- Deprecated in favour of the `terminal/` target of [cssints-native](https://github.com/alexeiaccio/cssints-native): `cssints/clay` styles laid out by Clay and drawn into character cells on termbox2, with the focus layer in C. The package keeps working; importing it warns once, and the README says what carries over (`packages/tui/README.md`).

## 0.4.0 (2026-10-21)

### Minor changes

- New subpath `cssints/clay`: styles for a [Clay](https://github.com/nicbarker/clay) layout, compiled to object literals shaped as `Clay_ElementDeclaration` and `Clay_TextElementConfig`, and `header()` to print a module of them as C initializers for a firmware that runs no JS. Pixels for lengths, `stretch` for Clay's GROW, colours by the web's `color` grammar; a property Clay cannot draw is no member. States (`hover`, `focus`, `active`) print as declarations of their own, colour tokens and named themes as a declaration per theme, `fonts()` sets `fontId` from the app's font list, and `float({ attach, parent, root, offset, expand, zIndex, capture, clip })` fills Clay's `floating` for menus, popovers and dialogs.
- New package `@cssints/color-names`: the Color Name List (31,939 names) as typed colour values. `named("tangerine")` is its hex (`#ff9300`) as a `<color>` for `color()`, `bg()` and the rest; an unknown name is a type error and a build error with the nearest key. `colorNames.<sector>(name)` is the same name in one of ten sectors (`red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`, `brown`, `neutral`), so an editor's completion is a few thousand names and not 31,939: a colour word in the name decides the sector (`ferrari-red` is in `red`), else the oklch hue (a dark orange or yellow is `brown`, low chroma is `neutral`). `named()` resolves list names, so `named("green")` is `#00ff00`; a CSS keyword stays a string (`color("green")`). `@cssints/color-names/nearest` is the CIEDE2000 reverse lookup, build time only, in its own subpath. No runtime: the sheet holds the hex.
- `freeformGradient("red top left, gold 4 60% 40%, yellow bottom right")`: the spec's `freeform-gradient()` where the
  browser has it, else a stack of radial gradients for the first paint (a layer per point, so freeform has a fallback without
  JS where mesh has only its average colour) and a canvas the runtime redraws (inverse-distance weighting, the weight of a
  point `spread / d²`, in oklab or srgb — this package's rule, not the spec's, which is not public and may be named
  `diffusion-gradient()`). Points only: a point is `<color> <number>? <position>`; a line, a shape, a length and a second
  point at one position are build errors. Mesh is unchanged; the runtime now carries both rules (3.9 kB minified, 1.9 kB
  gzipped, against 2.9/1.6 for mesh alone).
- New package `@cssints/gradient-2d`: `meshGradient("red, blue; green, yellow")` is the spec's `mesh-gradient()` where the browser has it (the `@supports` switch), else a canvas that a runtime draws, bicubic in oklab, as the background. No browser has the function yet. Positions and the `by`/`with` control points are build errors for now. css-grammar gives `css.types.gradient.mesh-gradient` and `freeform-gradient` own BCD entries (`version_added: false` for the tracked browsers), read only where BCD has no key, so the runtime ships to the builds whose targets lack them.
- `@cssints/tokens/madoromi`: the eight madoromi flavours (the-moonwitch/madoromi, MPL-2.0 in that one file) as DTCG data: neutrals, inks, roles and ANSI, one flavour a theme of another.

### Patch changes

- The JSDoc of `named()` and `colorNames` and the README link the Color Name List's site, https://names.color.pizza/, where a colour has its own page at `/color/<name>/`.
- The types of `createGlobalTheme` take a DTCG override with digit keys (`"500"` for the token `_500`), as the run time does, and check its values.

## 0.3.1 (2026-10-12)

### Patch changes

- The OpenCode plugin of the devtools is the main entry of the package, so OpenCode loads it by the package name: `"plugins": ["@cssints/devtools"]` in opencode.jsonc (checked on OpenCode 2.0.27, which said "Plugin entrypoint not found" for a package with no `.` export). The `@cssints/devtools/opencode` subpath stays.
- An evaluation that hits the 30 second limit now stops at the next module it would load, so it no longer registers tokens and styles during the evaluations that follow. `CSSINTS_EVAL_TIMEOUT` (milliseconds) changes the limit for tests.

## 0.3.0 (2026-10-12)

### Minor changes

- In dev with `devtools`, each `cn(...)` and `cv(...)` gets a readable class such as `cs-Landing-logo` (the enclosing component or file, and the variable, property or JSX attribute it is assigned to), shown first in the panel; a build is unchanged.
- The devtools OpenCode box sends its prompts to the session that the new OpenCode command `/cssints-devtools` (plugin `@cssints/devtools/opencode`) attached to a dev server, instead of starting a session each time; files in `node_modules/.cache/cssints-devtools/` are the rendezvous (new export `cssints/devtools-link`), and the link probe tells the attached session.
- Export groups for downstream browsers and Baseline years: `cssints/widely-available/with-downstream` and `cssints/newly-available/with-downstream` (also checked against Opera, Opera Mobile, Samsung Internet, Android WebView, UC and QQ at the minimum versions of baseline-browser-mapping), `cssints/baseline-2015` to `cssints/baseline-2026` (what was Baseline by the end of the year) and `cssints/baseline-YYYY/with-downstream`.
- `inGroup(group, property, value)` in `cssints/plugin`: whether a declaration is in an export group (`widely-available`, `baseline-2022/with-downstream`, ...), by the same scan `cssints/<group>` runs on a call. A plugin with a variant per group emits only what passes.
- Baseline variants: `@cssints/reset/widely-available`, `/newly-available`, `/baseline-2015` to `/baseline-2026` and each `/with-downstream` (and `/limited-availability`, the whole reset). A variant keeps only the declarations whose property and value are in the group, and drops a rule left with none; `@cssints/reset` stays the full reset.
- The base takes the border off buttons (`button` and `input` of type `button`, `submit` and `reset`) in a `:where()` rule of the `reset` layer, so a button no longer shows the bevel of the browser; text fields, text areas and selects keep their borders.

### Patch changes

- The devtools OpenCode box (`opencode` option) is always shown and pinned to the panel's edge (bottom in a left or right dock, right in a top or bottom dock), with a title, whether a service is found (a new `cssints:devtools:link` probe, no session created), and the last session; with no element picked the prompt is the instruction and the page.
- The prompt of the devtools OpenCode box says where it is: `App:` (the Vite root in the repository, added by the dev server), `Page:`, `Title:` and `Display:` (viewport, `<html>` attributes, colour scheme, the element's box and state) in both variants, and for an element its `id`, `role`, `aria-label`, `href`, `src`, `alt`, `type`, `name`, `placeholder`, `title` and `data-*` (never a value).
- `list_plugins` reads the plugin table of docs/API.md also when the formatter pads its cells.
- Dev server: a file with a named token that is renamed or deleted frees its names. `forget` drops the `@property` and the value of the tokens of a file, and a deleted file is forgotten and leaves the sheet, so the name can be declared in another file (it failed with "is already declared with another @property").

## 0.2.0 (2026-10-11)

### Breaking: `cx` is folded into `cn`

`cx` is no longer exported, and importing it is a build error. `cn(...)` takes runtime values now: the arguments known at build time merge into one class string as before, and the others (`on && p(4)`, `cond ? a : b`, `props.class`, a signal) go into a few lines of runtime the plugin adds. The styles inside them are still class strings made at build time, and a conditional style replaces the classes it overrides while it is active: `cn(p(2), on && p(4))` gives `p(4)` when `on`, `p(2)` otherwise (`cx` kept both and left it to the order of the sheet).

Migrate:

```ts skip
// 0.1
import { cx } from "cssints";
import { p, bg } from "cssints" with { type: "cssints" };
const box = (on: boolean) => cx(bg("white"), on && p(4));

// 0.2
import { cn, p, bg } from "cssints" with { type: "cssints" };
const box = (on: boolean) => cn(bg("white"), on && p(4));
```

The SVG property `cx` is written `css.cx(...)`.

### Added

- Export groups by Baseline: `cssints/widely-available`, `cssints/newly-available`, `cssints/not-discouraged` (`cssints/limited-availability` is `cssints`). A group exports the members whose CSS feature is in it, and a keyword, function, unit or media feature outside it is an error in the types and in the build.
- Export groups by spec, named by the W3C shortname: `cssints/mediaqueries-4`, `cssints/css-grid-2`, `cssints/css-color-5` and 89 more. A level includes the earlier levels of its series.
- Releases go to the npm dist-tag `latest`: `npm install cssints` (0.1.0 was published under `next`).

## 0.1.0 (2026-10-10)

The first release on npm: `cssints` (the Vite plugin, the build-time library, `cx` and the runtime of `cv`), `@cssints/css-grammar`, `@cssints/devtools`, `@cssints/mcp`, `@cssints/tokens`, `@cssints/tui` and the plugin packages (balance, fluid, fonts, gradient, icons, layout, masonry, mise-en-mode, motion, placeholder, ramp, reset, reveal, rybitten, skeleton, squircle, stuck).

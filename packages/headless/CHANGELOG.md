# @cssints/headless

## 0.22.0

### Minor Changes

- 2aebd87: The feedback that adopting 0.20.0 produced, in one release.
  
  **Lists that arrive later.** `createListbox`'s `items`, `createTable`'s `rows`, `createRadioGroup`'s `values` and `createTimeline`'s rows now take a getter (`() => list()`) and read it at attribute-read time, so an async fetch no longer forces the host to rebuild the widget and lose the active option, the selection and the roving tab stop. `listbox.items` is a getter over the live list; a `defaultValue` chosen before the items arrived now survives them.
  
  **Host-owned values.** `createRadioGroup` takes `value: () => checked()`, so `undefined` can be a real controlled state ("nothing checked") instead of meaning "uncontrolled"; its `radioProps` carries `type="button"`, so a radio rendered as a `<button>` no longer submits the form. `createStatus` and `createAlert` take `from: () => text`, and read the host's signal directly instead of asking for an effect that mirrors it into `show()`.
  
  **Host-named ids.** `createTabs` takes `tabId(index)` and `panelId(index)`, and `aria-controls` / `aria-labelledby` follow them: a console whose panels are `#traces`, `#logs`, `#metrics` no longer re-implements the two attributes.
  
  **Drop zone.** `maxFiles` caps one batch (a new `"count"` reject reason), `labels.labelledby` names the zone by the host's own visible heading, and `formatMessage` returns the announcement in the host's language from the same counts.
  
  **Timeline.** Rows mode reports `focusedId()`, the row that holds the roving tab stop.
  
  `test/props-later.browser.test.tsx` is the regression net for all of it.
- 111c9c9: `createMenu` takes the checked state as a readable pair as well as the packed number: `checked` (the checked checkbox item indices) and `choice` (the chosen radio index, `-1` for none) with `onCheckedValuesChange(checked, choice)`. The readable pair is the store and the packed `value` / `onCheckedValueChange` (unchanged for existing callers and `menu-checkable.qnt`) is its derived view, so a controlled menu can check any checkbox item, not only item 0; `value()` joins `checked()` / `choice()` as the packed accessor.

## 0.21.0

### Minor Changes

- ab516f1: `createCombobox` takes `disabled`: the combobox and its trigger announce `aria-disabled`, the combobox keeps its tab
  stop, and a key, a click, a typeahead character, a filter input and an option click change nothing, so no popup opens;
  `setOpen` / `setValue` stay host requests. The spec records it as a deliberate extension (no model var), so
  `combobox.browser.test.tsx` is its oracle. `createCheckboxGroup`'s children take `<base>-0`..`-2` instead of `"0"`,
  `"1"`, `"2"`, so two groups on one page no longer share ids.

## 0.20.0

### Minor Changes

- f166890: `@cssints/headless`: the first composition, a command palette. `createCommandPalette` is `createDialogModal` + `createTextInput` + `createStatus`, not a new primitive: the container is a modal dialog (announced as one), the field is `input[type=text][role=searchbox]` rather than a combobox because choosing a row runs a command instead of completing the field, and the list is a `listbox` filtered by a plain case-insensitive match on `label` and `keywords`. Focus stays in the field with `aria-activedescendant` on the highlight; ↓ on the last option and ↑ on the first return the highlight to the field; Home/End move the caret while there is text and are list keys while the field is empty; Enter closes and runs the command, Escape closes through the dialog. Groups, an empty state and one polite result count are part of the API, the query resets on close, and `attach()` binds the hotkey through `createHotkeys`. Rendering, grouping CSS, async command handling and the strings are the host's; the filterable menu and the date picker follow in later changes.
- b81b4b1: `@cssints/headless`: two ARIA gaps the styled kit hit. `createMenu` takes a controlled open state — `open`, `defaultOpen` and `onOpenChange` on top of `createControllable` — and every intent that opens or closes (the trigger's click and keys, Escape, an item's activation, Tab, `openMenu` / `closeMenu`) is a request the host may ignore; a rejected request leaves the focus where it was, as `menu-button.qnt` models it. `createCheckboxGroup` takes the name, the description and the error `createField` gives a control: `label` (`aria-label`) or `labelledby`, `describedby`, `invalid` / `error` (`aria-invalid`, the error id in `aria-describedby`, and an `errorProps` element that is `role="alert"` while it is shown), plus the group element's `id`. `menu-button.qnt` changed minimally: a host write of the open value it already has moves no focus, because no widget can observe it; regenerated, nothing else moved.
- 702a52b: `@cssints/headless`: `createKnob`, a virtual knob after GarageBand's (spin around the centre, vertical or horizontal slide, one gesture locked per drag). It is a `role=slider` (no ARIA role exists for a dial) with `aria-valuenow` / `aria-valuetext`, keyboard steps, PageUp/PageDown, Home/End and a wheel, plus `percentOf` for the skin's rotation and a continuous `wrap` mode. There is no APG pattern, so no Quint spec: the contract is documented in the package README and `test/knob.browser.test.tsx` is its oracle.

## 0.19.0

### Minor Changes

- ce545d1: `createDropZone`: a file drop target on a hidden native `<input type="file">`, with a browse button as the accessible path
  (the zone is never drag-only), `accept` / `multiple` / `maxSize` validated once per file into `onFiles` and
  `onReject({ file, reason })`, a depth-counted `dragging()` that a child's `dragleave` does not clear, and a
  `role="status"` line the host fills with `message()` ("2 files, 1 rejected: too large"). A dropped folder or an empty
  `DataTransfer` is a no-op. No APG pattern and no Quint spec: `test/dropzone.browser.test.tsx` is its oracle.
- 2022f38: `createSlider` and `createSpinbutton` take `disabled`: a disabled slider announces `aria-disabled` on its thumb, keeps
  the thumb as its tab stop and drops every key and rail press; a disabled spinbutton's field announces `aria-disabled`
  and carries the native `disabled`, takes no typing or spin key, and offers neither stepper. The APG specs record it as a
  deliberate extension of the patterns (no model var), so the browser tests are its oracle.
- 77a2c2c: `createTabs` takes `closable` and `renamable` (both off by default, so the plain tablist is unchanged), `label`, and
  the requests `onClose` / `onRename`; it gains `closeProps`, `renameProps`, `editing`, and `focusAfterClose`. A close
  button stays out of the tablist's tab order (`tabindex=-1`) and Delete closes the focused tab; focus lands on the tab
  that slid into its place, or the previous one when the last tab closed, and the last remaining tab is never asked to
  close. A double click starts an inline rename: Enter commits, Escape reverts, blur commits, and the arrows are the
  input's while it runs. The primitive owns no list: it asks, the host removes or renames.
- 6d09aa0: `createTimeline` takes real span data: `createTimeline({ rows, axis, selected, onSelect })` lays a trace waterfall out over the rows' own extent (`extent`, `barProps` with `left`/`width` percentages and a `--depth` custom property, `labelProps`, `depthOf`, derived ruler `ticks`), with click, Enter and Space selection and a roving tab stop. The rows are `role="list"` / `role="listitem"` with `aria-level` and `aria-current` (no APG pattern exists for a waterfall), and a zero-length span keeps a 0.5% width floor so it stays visible. `createTimeline()` with no `rows` keeps the demo tree and its API.

## 0.18.0

### Minor Changes

- f6c6e9b: `createHotkeys`: one registry for the chords every app hand-rolls — `/`, Cmd/Ctrl+K, Cmd/Ctrl+S — with exact modifiers, `mod` as Cmd on macOS, a text-field guard, `when`, scopes and last-bound-wins precedence.
- 66caa1a: `@cssints/headless`: `createPanZoom`, pan and zoom for one image in a viewport. There is no APG pattern for pan-zoom, so the contract is the module's own and `test/panzoom.browser.test.tsx` is its oracle: a focusable viewport (`role=group`, `tabindex=0`, `aria-roledescription="zoomable image"`, `aria-describedby` the value), keyboard operations that stand in for every gesture (`+` / `=` / `-` zoom by `step`, arrows pan by 24 px, Shift x4, `0` resets), and a polite live value (`"150%"`). The pointer adds drag-to-pan, a two-pointer pinch and a double-click reset; the wheel zooms only with `ctrl` / `meta` (the browser's pinch) and a bare wheel is left to the page. `bounds: "clamp"` keeps the scaled image covering the viewport, `"free"` lets it be dragged out. Not `createCanvas`: that is a camera over an infinite world, this is one image fitted to a box.
- a9a68fa: `@cssints/headless`: `createScrollspy`, a table of contents whose current entry is the last heading to reach the top of the scrollport, with `aria-current="location"` on that link (exactly one at a time) and `role="list"` items. One passive `scroll` listener on the root (the document by default; `offset` is px below its top edge, so a sticky header passes its height), no `IntersectionObserver`: a total order over the headings is what the reader sees, and a band observer has to rebuild it from enter/leave state. Smooth scrolling stays the host's CSS. No APG pattern exists for a scrollspy, so `test/scrollspy.browser.test.tsx` is its oracle.

## 0.17.0

### Minor Changes

- 3b387ec: `@cssints/headless`: `createTable`, a data table on a native `<table>`: sortable column headers with `aria-sort` on the sorted column only, a header button that cycles `ascending` -> `descending` -> unsorted by default (`sortCycle: "toggle"` for `ascending` <-> `descending`), and optional single or multiple row selection over ids with `aria-selected`, a mixed `aria-checked="mixed"` select-all, and `aria-rowcount` / `aria-colcount` / `aria-colindex` only while the host windows rows or columns. Sorting is the host's data: the primitive carries the descriptor and never reorders a row. It composes `grid-sort.qnt` and `grid-selection.qnt` without the grid's navigation, so `test/table.browser.test.tsx` is its oracle.

## 0.16.0

### Minor Changes

- 4abf93f: `@cssints/headless`: `createDrawer`, the drawer / bottom-sheet shell over Dialog (Modal): `side` (`"left" | "right" | "bottom"`) and `modal` are the whole presentation API, so a sheet below a breakpoint and a side rail above it are one drawer; `modal` is read at attribute-read time, so the host's breakpoint may flip it while the drawer is open. A modal drawer has a backdrop, focus into the panel and back to the trigger, a Tab cycle, a counted page-wide scroll lock (shared with `createConfirm`, so a confirm over a drawer nests) and Escape from the document; a non-modal one keeps the page's scroll, focus and clicks. No drag-to-dismiss: a drag is the host's native scroll snap (docs/bottom-sheet.md), so `handleProps` is a decorative grab handle and swipe-to-dismiss stays a separate decision. No `attach`: the panel is edge-anchored and nothing is measured.

## 0.15.0

### Minor Changes

- 77244d4: `@cssints/headless`: `createToast`, a toast queue (one live region per toast, `role=alert` for the error tone and `role=status` otherwise, a 5000 ms timeout that pauses on hover and focus and resumes with the time left, `max` that drops the oldest, `dismiss`/`dismissAll`, and a `role=region` landmark), and `createStatus`, one polite `role=status` region whose text is replaced. No APG pattern exists for either, so the browser test is the oracle; the toast's own text is the announcement (the host renders the `title` and `description` given to `show`), and F6 into the region stays the host's handler (hotkeys are a separate bean).

## 0.14.0

### Minor Changes

- 5b10f77: `@cssints/headless`: `createPopover`, the non-modal overlay: an anchored content a trigger opens, dismissed by a click on the trigger, an outside `pointerdown` or Escape, with focus moving into the content and back to the trigger, a placement that flips at the viewport edge, and `attach(trigger, content)` for the measure, the focus and the light dismiss. There is no APG pattern for a popover, so it follows Base UI's Popover and React Aria's `usePopover` and its oracle is the browser test; the page behind stays interactive (no `inert`, no scroll lock — that is `createDialogModal`).

## 0.13.1

### Patch Changes

- 72b9369: `@cssints/headless`: every optional `createTextInput` / `createTextArea` option is typed `T | undefined`, like the field's, so a host that passes a getter over an optional prop compiles under `exactOptionalPropertyTypes`.

## 0.13.0

### Minor Changes

- 5813cd7: `@cssints/headless`: `createPagination` (a navigation landmark over a page list: one `aria-current="page"`, ends kept and disabled at the boundary, one gap per elided run, the count announced once in a `role="status"`, and `hrefFor` so the links work without JS), and `createTextInput` / `createTextArea` (the field contract plus `autocomplete` tokens, `inputmode`, `spellcheck`, `maxlength`, `readOnly`/`disabled`, and `rows`/`wrap`/`resize` for the area). Both are TetraLogical's last two components; neither has an APG pattern, so their oracles are the browser tests.

## 0.12.1

No changes in this release.

## 0.12.0

No changes in this release.

## 0.11.0

No changes in this release.

## 0.10.0

### Minor Changes

- c6d1cdc: `@cssints/headless`: `createField` and `createConfirm`, found in two apps. `errorProps` is `role="alert"` while the error is shown (the hint is not); `createField({ describedby })` takes an id or a list of ids the host owns and appends them to `aria-describedby` after the hint and the error, for one form-level error that belongs to two controls; `id`, `required` and the other options accept `undefined`, so a getter over an optional prop typechecks under `exactOptionalPropertyTypes`. `createConfirm` gets the dialog shell it needed: Tab and Shift+Tab cycle inside the dialog, `overflow: hidden` on the document element while open (counted, restored on close), Escape from the document so it works with the focus outside, and the last confirm opened takes Escape and Tab when several are open. The default labels stay English: a translating host passes `confirmLabel` and `cancelLabel`.

## 0.9.0

### Minor Changes

- 42f7313: `@cssints/headless`: `createField`, the ARIA contract of a form field (`controlProps`, `labelProps`, `hintProps`, `errorProps`: ids that are stable, `aria-describedby` listing the hint and then the error while they are shown, `aria-invalid` only when invalid, `required` with `aria-required`, nothing that points at a hidden id), and `createConfirm`, a promise-based `confirm({ title, description?, confirmLabel?, cancelLabel?, destructive? })` over `createDialogModal({ role: "alertdialog" })`: `true` on confirm, `false` on cancel, Escape or the backdrop, focus on the cancel button and back to the invoker, one request at a time (a second one rejects with `ConfirmPendingError`). Neither has an APG pattern, so neither has a Quint spec.

## 0.8.0

No changes in this release.

## 0.7.0

No changes in this release.

## 0.6.1

No changes in this release.

## 0.6.0

### Minor Changes

- `@cssints/headless`: `createResizablePanels`, a group of N panes and N-1 separators — percent sizes that always sum to 100, per-pane min/max, collapsible panes, arrows and Home/End as pair moves, Enter to collapse and restore, a pointer drag that re-solves from the pointerdown snapshot, controlled `sizes` + `onSizesChange`, and a `storageKey`. `@cssints/apg-specs`: `specs/patterns/resizable-panels.qnt` (not an APG pattern: a group of window splitters), its generated model, the bridge with the drag vocabulary, 11 scenarios under `scenarios/patterns/`, and the `patterns/` exports.

## 0.5.2

No changes in this release.

## 0.5.1

### Patch Changes

- 7dae24c: `@cssints/headless`, first release: headless APG widgets on Solid 2 (state and DOM attribute objects, no styling), each conformance-checked in Chromium against its Quint spec and the ported scenarios.

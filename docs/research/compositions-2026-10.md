# Compositions: Base UI, Ariakit, React Aria

Research for `cssints-77wx`; feeds `cssints-vk1y` (popover), `cssints-yntz` (filterable menu, command palette, date picker), `cssints-03li` (table), `cssints-6ca5` (toast), `cssints-jzwx` (drawer), `cssints-6sib` (drop zone). Read 2026-10-30 from the published docs; no library installed and no React run, so every line is a documented decision, not a measurement.

Claims that are accessibility requirements rather than library choices are marked **[TL]**: they belong to the requirement → Gherkin → test model of the TetraLogical library (references-2026-10.md §6, effects-of-atmosphere), not to one of the three implementations.

## The three models, against ours

Ours: `createX(options)` returns getters plus plain attribute objects the host spreads on its own elements — no elements, no context, no render props (`packages/headless/README.md`). Base UI is React context under a part tree where every part renders an element, styled through `data-*` and CSS variables [bui-styling]; Ariakit is a store (`useDialogStore`) plus one component per element, swapped with `render` and merged prop-by-prop [aki-composition]; React Aria is a `use*State` hook plus hooks returning `DOMAttributes` for your element, with the item list parsed out of the React tree as a collection. React Aria is closest to us in shape and furthest in implementation (refs to measure, tree to parse).

## Popover — `cssints-vk1y`

- **Base UI** [bui-popover]: Trigger/Portal/Backdrop/Positioner/Popup/Arrow/Title/Description/Close; `modal` = `false | true | 'trap-focus'` (default `false`; `true` requires a rendered `<Popover.Close>` so touch screen readers can escape); `initialFocus`/`finalFocus` = `boolean | ref | (interactionType) => element`; `handle` + typed `payload` for detached triggers; the Positioner publishes `data-side`, `data-align`, `--anchor-width`; exits through `data-starting-style`/`data-ending-style`.
- **Ariakit** [aki-popover]: one `<Popover>` with positioning props on it (`gutter`, `flip`, `fitViewport`, `overflowPadding`); `modal`; `autoFocusOnShow`/`autoFocusOnHide` + `initialFocus`/`finalFocus`; `alwaysVisible` for exit animations; `preserveTabOrder` keeps portalled content in tree order; `getPersistentElements` exempts an element (their toast) from the "outside" rule.
- **React Aria** [ra-popover]: `usePopover` positions and labels only and "should be combined with useDialog"; `isNonModal` is an explicit opt-out — "most popovers should not use this option as it may negatively impact the screen reader experience"; `shouldCloseOnInteractOutside(el) => boolean` filters dismissal.
- **Differ**: Base UI and Ariakit expose the focus policy as props, React Aria states it as a rule; Base UI puts alignment/arrow/animation in a Positioner part, Ariakit puts the same knobs on the element.
- **We take** the focus vocabulary as *modes*, not refs: `initialFocus: 'first-tabbable' | 'popup' | 'none'`, `finalFocus: 'trigger' | 'previous' | 'none'`; `modal: false | true | 'trap-focus'`; `data-side`/`data-align`; the starting/ending-style pair for CSS exits. A modal popover ships a visible close — **[TL]** (Base UI's reason: a hidden escape hatch is one a host forgets to configure). **We do not take** Portal/Backdrop parts, JS positioning and collision maths (native `popover` + CSS anchor positioning), the `handle`/payload plumbing.
- **Open**: does `position-area`/`position-try` cover flip/shift well enough that no Positioner port is needed? Settle it in `vk1y` before writing JS.

## Filterable menu — `cssints-yntz`

- **Base UI** [bui-filter, bui-menu]: the structure is a role argument — a menu, because choosing runs a command ("a role is a promise"), so the trigger says `aria-haspopup="dialog"` while the field has no `aria-autocomplete` and no `aria-haspopup`. The popup is a `dialog` holding a `searchbox` and a `menu`. The field is `input[type=text][role=searchbox]`, not `type=search` (no browser clear button to undo); `Menu.Clear` sits outside the tab order; DOM focus stays in the field and `aria-activedescendant` names the highlight; ↓ on the last item and ↑ on the first return the highlight to the field, which carries `data-highlighted` so sighted users see the step; Home/End are menu keys only while the query is empty *and* an item is highlighted; ArrowRight on a submenu trigger focuses the submenu field at once, hover shows the submenu but does not focus until the pointer is inside; Tab leaves, no trap; IME does not filter. Opt-in is a wrapper (`Menu.FilterProvider`) for three stated reasons: existing parts and styles survive, the trigger can announce a dialog before the input mounts, and non-filtering menus ship no filtering code.
- **Base UI** matching [bui-menu]: item text by default with a `label` override; contains, case/accent/punctuation-insensitive via `Intl`; `filter={null}` plus `value`/`onValueChange` for external results; empty groups get `hidden` and stay mounted; `<Menu.Empty>`; `autoHighlight: true | 'always'`; the query resets on close with reason `'popup-close'`.
- **Ariakit** [aki-combobox] has no filterable-menu guide; the two models exist as knobs — `virtualFocus` on the composite provider switches the container from roving tabindex to `aria-activedescendant`, plus `focusOnMove`, `moveOnKeyPress`, `autoSelect`, `showOnChange`. **React Aria** [ra-combobox] treats filtering as combobox, full stop: `useComboBox` + `useListBox` + `usePopover` with `isNonModal` (the documented exception to the popover rule) and `shouldCloseOnInteractOutside`; no menu with a search field.
- **Biggest disagreement**: Base UI argues a filterable *menu* must not be a combobox; Ariakit's palette and React Aria's combobox ship exactly that. Both hold, because the question is what the choice does — complete the field or run a command. We keep two primitives and let the role follow the purpose.
- **We take** the dialog + searchbox + menu structure, the arrow loop back to the field with `data-highlighted` on it, the text-input-with-searchbox-role trick, Clear out of the tab order, the two-signal Home/End rule, the IME guard, groups + empty state, and the opt-in as `filter: true` on `createMenu` (a provider is a wrapper component we do not need). **We do not take** `Menu.useFilter` as a hook (a plain `filter(text, query) => boolean` option), the provider tree, or their `label` override as anything but a field on the item input.
- **Bug checks we inherit** [bui-filter], all **[TL]**: a group label announced twice; Shift+Tab out of the trigger dropping focus on `body`; a submenu left open after VoiceOver focus return; an open submenu trigger not toggling under TalkBack.
- **Select**: Base UI's Select is a combobox without an input ("prefer Combobox for large lists", the popup overlaps the trigger by default through `alignItemWithTrigger`) [bui-select]; Ariakit's Select reference says "Deprecated: Use ComboboxSelect instead". We have `createCombobox` and ship no separate select primitive — a native `<select>` covers the rest.

## Command palette — `cssints-yntz`

- **Ariakit** [aki-cmdk] is the only shipped palette: `Dialog` + `Tab` + `Combobox` with a **grid** popup (`CommandMenuGrid cols={n}`) so arrows work across columns, `matchSorter` over `label` and `path`, tabs as scopes, and a concurrent-rendering tag for responsiveness.
- **Base UI** has no palette page: either `Dialog` + `Combobox` with `inline` (a listbox rendered inline, `open` bound to the dialog's so the filter query, highlight and input value reset when the dialog closes) or the filterable menu above [bui-combobox]. **React Aria** has no palette page either: `useComboBox` in a dialog, collections for groups.
- **We take** `combobox-dialog` (already specified: `packages/apg-specs/specs/apg/combobox-dialog.qnt`), the inline listbox, groups, an explicit reset-on-close event; scopes as tabs only if a page needs them, recent items as host data. **We do not take** the grid popup and 2D arrows in v1 — Ariakit needs them because its rows are wide. `ponytail:` single column, add when a palette page renders columns.
- **Open**: "run a command" palettes may have to be menus under Base UI's argument, "go to page" palettes are comboboxes. Decide per page; do not ship a `palette` primitive.

## Date picker — `cssints-yntz`

- Base UI and Ariakit ship no date picker. React Aria is three layers: `useDatePicker` (field + button + popover), a segmented date input whose segments are focusable spinbuttons, and `useCalendar`/`useCalendarGrid` returning `gridProps`/`rowProps`/`cellProps` for a `role="grid"` month [ra-datepicker, ra-calendar].
- **We take** nothing new: `combobox-dialog.qnt` already models the APG date picker (dialog popup, `aria-haspopup="dialog"`, focus moving into the dialog, one roving cell, PageUp/PageDown month, Shift+PageUp year, OK/Cancel). The picker is `createCombobox({ popup: 'dialog' })` + `createGrid`; segments are `spinbutton`. **We do not take** `@internationalized/date` (CalendarDate, per-locale arithmetic) — our spec fixes calendar maths as day numbers, and a host with real calendars brings its own date library; that is a dependency decision, not a primitive.
- **Open**: does the grid reuse cover `aria-selected` on the value cell vs `aria-current` on today, or does the picker need a grid option? One browser test decides.

## Table — `cssints-03li`

- React Aria only [ra-table]: `useTableState` (`sortDescriptor`, selection), `useTable` + row-group/header-row/column-header/row/cell hooks, `useTableSelectionCheckbox`/`useTableSelectAllCheckbox` (mixed state), `useTableColumnResize`, `isRowHeader` to name a row by its first cell. Base UI and Ariakit ship no table.
- **We take** the split we already have — `grid-sort`, `grid-selection` and `treegrid` are existing specs and primitives, and a table is a grid with a `th[scope]` header row, so `03li` composes them. `isRowHeader` and the mixed select-all state are the two not to drop: **[TL]**, each needs a requirement and a test.
- **We do not take** the collection API: React Aria needs `items` + a render function to memoise rows, Solid's `<For>` keys by identity, so our table takes `rows` and returns per-row props. The collection is a React reconciliation workaround, not an accessibility model.
- **Open**: column resize — React Aria models the grip as a `role="separator"` in the header, `resizable-panels` has the arithmetic. Defer until a page asks.

## Toast / status region — `cssints-6ca5`

- **Base UI** [bui-toast]: `Toast.Viewport` is a landmark, F6 enters it and F6 returns; `timeout` defaults to 5000 ms; `priority: 'low' | 'high'` picks polite vs assertive, and for high priority "the `title` and `description` strings are what are used to announce the toast to screen readers… screen readers do not announce any extra content rendered inside `<Toast.Root>`"; `--toast-index` drives stacking; `data-base-ui-swipe-ignore`; `promise()`; a global `createToastManager()` usable outside the tree.
- **React Aria** [ra-toast]: the same landmark and F6/Shift+F6; "toasts should have a minimum timeout of **5 seconds**"; "timers automatically pause when the user focuses or hovers over a toast"; closing a toast moves focus to the next, the last restores it. **Ariakit**: none.
- **They agree** on landmark + F6 + ≥5 s + pause; **they differ** on the announcement text — Base UI announces the strings handed to the manager, React Aria renders the toast content into the live region.
- **We take** one region per priority (`role="status"` polite, `role="alert"` assertive) instead of a live region per toast — **[TL]** a status message is announced without moving focus, and one region per priority keeps order predictable — with the text as an argument to `push({ title, description })` rather than read from the DOM (Base UI's reason), a timeout with a 5000 ms floor, timers paused on hover/focus, F6 into the region. **We do not take** the manager singleton and `promise()` (host composition), or swipe-to-dismiss on a toast (a pointer affordance that costs a gesture machine; the close button is the accessible path).
- **Open**: region and status cannot be one node — a landmark role and `role="status"` do not nest. Both libraries split them; follow the split and check the announcement in a test.

## Drawer / sheet — `cssints-jzwx`

- **Base UI** [bui-drawer]: Drawer *extends* Dialog with swipe-to-dismiss, snap points and an indent effect, and states the rule we already reached — a panel that slides in and needs no gestures is "a positioned Dialog". Snap points are props (`snapPoints: ['148px', 1]`), gestures are JS, `Drawer.VirtualKeyboardProvider` handles the soft keyboard. React Aria and Ariakit have no drawer: a modal dialog, or a popover with `isNonModal`.
- **We keep the verdict in `packages/headless/docs/bottom-sheet.md`**: no `sheet` primitive; `dialog-modal` (native `<dialog>`) + CSS scroll snap, `::backdrop`, scroll-driven animation; borrow only the rule — a drawer that needs gestures is no longer a dialog.
- **Open**: the snap-index readout (`scrollsnapchange` → a signal) is the one thing CSS cannot express as an attribute. Add it when a host reflects the sheet's height.

## Drop zone — `cssints-6sib`

- React Aria only [ra-dropzone]: `DropZone` over `useDrop`/`useDrag`, a unified `event.items` where an item is a file *or* text (`item.getText(type)`, `item.getFile()`), and `getDropOperation(types) => 'copy' | 'move' | 'cancel'` deciding acceptance before any data is read; the same zone covers paste ("Drop or paste text or images here"). Base UI and Ariakit: none.
- **We take** `getDropOperation(types)` as the accept predicate (a pure function over MIME types — an attribute-object input), `data-drop-target`/`data-drop-rejected` as the styling hook, and paste on the same path; drag events are DOM events, so `createDropZone` owns handlers without owning an element. **We do not take** `useDrag` and the collection-drop machinery (indicators inside a listbox, cross-window drag) — a file drop is one target.
- **Open**: touch. HTML drag-and-drop has no touch path and React Aria does not pretend otherwise: ship pointer + keyboard paste and document it.

## Where our oracle adds something none of them has

The filterable menu's "↓ on the last item returns the highlight to the field", the submenu focus rules and the palette's reset-on-close are state machine invariants. The three libraries assert them in hand-written and e2e tests (Base UI found its menu bugs by testing with screen readers, not with a model). Each composition gets one spec, a generated model and a differential browser test, so "Home is a menu key only while the query is empty and an item is highlighted" is checked, not prose.

## Model per pattern

| pattern | model we copy | open question | bean |
| --- | --- | --- | --- |
| popover | `dialog-modal` focus vocabulary as modes + native `popover`; `data-side`/`data-align` | does CSS anchor positioning cover flip/shift? | `cssints-vk1y` |
| filterable menu | Base UI's dialog + searchbox + menu, arrow loop to field, IME guard | is `filter: true` on `createMenu` enough? | `cssints-yntz` |
| command palette | `combobox-dialog` + inline listbox + reset-on-close, single column | menu or combobox for "run a command"? | `cssints-yntz` |
| date picker | `combobox-dialog.qnt` + grid + spinbutton segments | `aria-selected` vs `aria-current` on the day grid | `cssints-yntz` |
| table | `grid-sort` + `grid-selection` + `treegrid`, `isRowHeader` | column resize: separator in header or `resizable-panels`? | `cssints-03li` |
| toast / status | one region per priority, text as data, ≥5 s, pause, F6 | region + status split — confirm in a test | `cssints-6ca5` |
| drawer | no primitive: `dialog-modal` + CSS scroll snap | snap-index readout | `cssints-jzwx` |
| drop zone | `getDropOperation(types)` + `data-drop-target`, paste | no touch path — document, do not fake | `cssints-6sib` |

## Sources

[bui-popover]: https://base-ui.com/react/components/popover
[bui-menu]: https://base-ui.com/react/components/menu
[bui-filter]: https://base-ui.com/blog/building-a-filterable-menu
[bui-combobox]: https://base-ui.com/react/components/combobox
[bui-select]: https://base-ui.com/react/components/select
[bui-toast]: https://base-ui.com/react/components/toast
[bui-drawer]: https://base-ui.com/react/components/drawer
[bui-styling]: https://base-ui.com/react/handbook/styling

[aki-popover]: https://ariakit.org/reference/popover
[aki-combobox]: https://ariakit.org/reference/combobox
[aki-cmdk]: https://ariakit.org/examples/dialog-combobox-tab-command-menu
[aki-composition]: https://ariakit.org/guide/composition

[ra-popover]: https://react-spectrum.adobe.com/react-aria/usePopover.html
[ra-combobox]: https://react-spectrum.adobe.com/react-aria/useComboBox.html
[ra-table]: https://react-spectrum.adobe.com/react-aria/useTable.html
[ra-toast]: https://react-spectrum.adobe.com/react-aria/Toast.html
[ra-calendar]: https://react-spectrum.adobe.com/react-aria/useCalendar.html
[ra-datepicker]: https://react-spectrum.adobe.com/react-aria/useDatePicker.html
[ra-dropzone]: https://react-spectrum.adobe.com/react-aria/DropZone.html

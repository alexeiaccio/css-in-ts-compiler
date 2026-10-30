# @cssints/headless

Headless APG widgets on Solid 2 (`solid-js` + `@solidjs/web` 2.0.0-rc.13): state plus attribute objects, no elements, no styling. Each primitive is conformance-checked against its Quint spec (`packages/apg-specs/specs/apg/<pattern>.qnt`) and the ported scenarios (`packages/apg-specs/scenarios/apg/<pattern>.*.json`).

```tsx
const disclosure = createDisclosure({ defaultValue: false });
<button {...disclosure.triggerProps}>Details</button>
<div {...disclosure.panelProps}>…</div>
```

## Decision: signals + differential test, not the machine at runtime

`createDisclosure` is plain Solid signals. The generated Quint model is **not** loaded at runtime; it is the oracle in tests:

- scenario replay runs the same steps on the model (`specDriver`) and on the real DOM (`domDriver`);
- `differentialWalk` feeds seeded random steps to both and compares aria/hidden/focus/callbacks after every step.

Why: the machine adds Effect + a model evaluator to every consumer's bundle and forces a signal bridge, while the differential walk catches the same drift (mutation-checked: dropping the change callback of a controlled request fails 11 tests).

## Template for the next pattern

1. `specs/apg/<pattern>.qnt` + `generate:all specs/apg/<pattern>.qnt` + spec-only test (see `packages/apg-specs/test/apg/disclosure.test.ts`).
2. `packages/apg-specs/src/apg/<pattern>.bridge.ts`: a `SpecBridge` (scenario vocabulary <-> spec events/state), a `<pattern>Config` normalizer that throws `Unsupported` for config you do not model, `<pattern>Steps` (random-walk alphabet), `<pattern>Probe`.
3. `src/<pattern>.ts` primitive; `test/<pattern>.fixture.tsx` renders parts with `data-part="<name>"` and returns a `Mounted`; `test/<pattern>.browser.test.tsx` runs scenarios + `differentialWalk` (copy `disclosure.browser.test.tsx`).
4. Every scenario expectation the primitive deliberately misses goes into `DIVERGENCES` with a reason; the test requires it to still fail.

Conventions: `visible` lists the hideable content parts only; boolean attributes read `"true"` when present; `key`/`type` on a target focuses it first; `data-*` attributes are library styling hooks (`Unsupported`); `aria-controls`-style references read back as part targets.

## Divergence policy

When a ported scenario and the primitive disagree, decide it this way:

1. **The APG pattern _text_ wins** — the normative "Keyboard Interaction" and "WAI-ARIA Roles, States, and Properties" sections.
2. **The APG _examples_ decide only where the text is silent.**
3. **Where both are silent, the majority of ariakit / Base UI / react-aria wins.**

A scenario whose expectation we deliberately do not meet stays a **negative test**: it goes in the primitive's `DIVERGENCES` map with its reason, and the test requires it to _still fail_, so the gap cannot silently close. `skipped` is different — an `Unsupported` config or step the bridge cannot express at all, not a divergence. See `packages/apg-specs/scenarios/apg/README.md`.

## Controlled vs uncontrolled

State is one machine with a **request vs commit** split . An event a user would see as a change is a _request_ carrying the intent; the host either accepts it (uncontrolled — the common case, auto-commit) or the controlled `value` prop is the only thing that changes state.

Two invariants: **a rejected request leaves state untouched**, and **in controlled mode no event commits**. Uncontrolled is the degenerate case where every request is accepted, so one spec covers both.

Primitive API (the React/Solid convention): `value` + `onValueChange` (a request the host may ignore) for controlled, `defaultValue` for uncontrolled.

Implemented for `disclosure` (reference: `specs/apg/disclosure.qnt`, `src/disclosure.ts`) and `player` (the four preferences volume / muted / rate / fullscreen; transport stays adapter-driven). The shared core is `src/controllable.ts` (`createControllable`): `value` + `initial` + `onChange` in, `[current, request]` out.

**Template for every other pattern**. A pattern adds, in this order:

1. **Spec, config flag.** `var controlled: bool` (+ `var accepting: bool`, a controlled host that writes every intent back) and `var valueProp` (the controlled value, meaningful while `controlled`), set by _configuration events_ (`init` is literal-only): `control` (adopts the current value) and `acceptRequests`.
2. **Spec, request path.** Each user-intent event keeps its name and becomes a request: it records the intent (`requested`), bumps a `requests` counter when the intent differs from the current value, sets `outcome` (`"accepted"` uncontrolled or accepting host, `"rejected"` controlled and holding) and `base` (the value on arrival), and commits only through `landed(holds, current, want)`. Add `setValue` (nondet) / `hostToggle`: the host writing the value, the only commit while controlled, resetting `outcome` to `"none"`.
3. **Spec, invariants.** `ControlledFollowsProp` (`controlled => value == valueProp`: no event commits), `RejectedRequestUntouched` (`outcome == "rejected" => value == base`), `AcceptedRequestCommits` (`outcome == "accepted" => value == requested`), each with a hand-built bad state in the spec test.
4. **Bridge.** `<pattern>Config` maps `controlled` (and a pinned value, `expanded`, meaning a host that rejects) to `{ controlled, accepts }`; `setup` emits `control` / `acceptRequests` / `setValue`; `events` reads the `requests` counter and the `requested` payload; add the host steps to `<pattern>Steps` and the probe.
5. **Primitive.** `value` + `onValueChange` (a request the host may ignore) for controlled, `defaultValue` for uncontrolled, built on `createControllable`; programmatic methods are requests; `value` is `T | undefined` (`exactOptionalPropertyTypes`). The fixture is the host: a signal passed as `value`, written back only when `accepts`.
6. **Tests.** Walk each of: uncontrolled, controlled accepting, controlled holding. Replay the controlled scenarios; an expectation we deliberately miss goes to `DIVERGENCES`.

Generator limits met and worked around (no parameterized actions, no `let`): a request action spells `landed(...)` out per assignment; every action assigns every var.

## Preferences

A primitive that has a seam honours an optional `prefs` entry (a `Partial<Prefs>`, `src/prefs.ts`). **The host resolves its preferences and injects the values**; `@cssints/headless` depends on `solid-js` only and never imports a preferences store — `Prefs` is a structural type, and an absent pref keeps today's behaviour.

- **canvas** — `motion` (the internal reduced-motion default, unless the explicit `reducedMotion` option is set), `focusFollowsCamera` (off: focus still moves the cursor, but the camera does not pan to centre), `announce` (off: the live region stays empty while `onSelectionChange` still fires).
- **menu / menubar** — `typeaheadDelayMs` (the typeahead buffer timeout).
- **tooltip** — `tooltipShowDelayMs` / `tooltipHideDelayMs`, exposed as `showDelayMs()` / `hideDelayMs()` for the host to wire its `setTimeout` from (the spec keeps timers as events).

Everything else **ignores** prefs: accordion, alert, alertdialog, breadcrumb, button, carousel, checkbox, checkbox-group, combobox, confirm, dialog-modal, disclosure, feed, field, grid, link, listbox, meter, player, popover, radio, resizable-panels, scrollspy, slider, slider-multithumb, spinbutton, switch, table, tabs, timeline, toolbar, treegrid, treeview, windowsplitter — they expose no timing / motion / live-region / camera seam. `listbox` / `treeview` / `timeline` typeahead timeouts are host-driven via their reset methods, so they take no delay here either.
Everything else **ignores** prefs: accordion, alert, alertdialog, breadcrumb, button, carousel, checkbox, checkbox-group, combobox, confirm, dialog-modal, disclosure, feed, field, grid, link, listbox, meter, panzoom, player, popover, radio, resizable-panels, slider, slider-multithumb, spinbutton, switch, table, tabs, timeline, toolbar, treegrid, treeview, windowsplitter — they expose no timing / motion / live-region / camera seam. `listbox` / `treeview` / `timeline` typeahead timeouts are host-driven via their reset methods, so they take no delay here either.

`motionDurationMs` is **not consumed**: canvas tweens are tick-driven, not millisecond-driven, and the look layer owns durations. It stays in `Prefs` only so a host's preference record fits the type.

## Canvas

`createCanvas` is a headless viewport: the host renders the DOM, the primitive owns the camera, the gesture machine, the focus contract and the state. Its behaviour is `packages/apg-specs/specs/canvas/{camera,pointer}.qnt`, and the DOM is checked against it by the differential walk.

**The handle.** `nodes` sets the initial geometry; everything after that is pushed in, because a node's position, size and paint order belong to the host:

- `setGeometry(patches)` — position and/or size of existing nodes, in any mode. Clamped into the world bound, and a running drag or marquee re-solves against the new geometry.
- `setOrder(ids)` — paint order, bottom first. This is the `z-index` and the hit priority.
- `addNodes(nodes)` / `removeNodes(ids)` — membership. Adding puts nodes on top; removing drops ids from the selection, clears the cursor / editing if they held one, and closes the z-order up. Survivors keep their DOM id, selection and focus.

Membership, sizes and z-order are **not modelled** in `pointer.qnt` (its node set is fixed at three): the spec owns the camera, the gesture machine and the selection, the host owns the geometry. Bad input to any of these throws before anything changes.

**Culling is the host's job.** `isCulled(id)` means a node is off screen and not selected / focused / editing. The host drops that node's **body** and keeps its **shell** — role, accessible name, tab stop — so culling never costs a tab stop. The shell's `content-visibility: auto` is a free extra, not the mechanism: its skip distance grows with zoom, so it skips almost nothing at 16x.

**Snapping** is `snapCandidates({ axis, value, id, width, height }) => readonly number[]`, whole world units, defaulting to the 50-unit grid. `value` is the dragged node's origin, so right-edge alignment is `target - width`. The 8 screen px threshold and "nearest candidate, ties to the larger" are the primitive's; the candidate policy is the host's.

**Editing is split.** The host renders its editor inside the node (`tabindex="-1"`, `user-select: text`) and focuses it when `state().editing` is that node. The primitive owns the rest: it ignores a composing keydown, ends editing when focus leaves the node (so native Tab continues in spatial order), sets `user-select: none` on the layer, and puts focus back on the node on Escape / F2.

**Nested canvases** are two instances the host composes: a `#canvas` node holds a second `createCanvas`, and the inner viewport stops propagation of its own pointer, wheel and key events. The innermost canvas under the pointer owns the event, so a press or zoom inside it never starts an outer gesture or moves the outer camera. A nested canvas is a single tab stop in its parent.

## Pan and zoom

`createPanZoom` is one image fitted to a viewport: the scale, the offset and the prop objects for the viewport, the image and a live value. **There is no APG pattern for pan-zoom**, so there is no Quint spec and no ported scenarios: the contract is this module's own and `test/panzoom.browser.test.tsx` is its oracle. The case it replaces (kocharin-art-3's `Zoomable`: ~110 lines of pointer maths) had no keyboard path and no ARIA at all.

**The accessible contract is three parts, and the pointer is a bonus:** a viewport that takes focus (`role=group`, `tabindex=0`, `aria-roledescription="zoomable image"`, `aria-describedby` the value), keyboard operations that stand in for every gesture (`+` / `=` / `-` zoom by `step`, arrows pan by 24 px, Shift ×4, `0` resets), and a polite live region (`role=status`, `aria-live=polite`, the current `"150%"`). `valueProps` deliberately carries no `hidden`: a `hidden` live region is not announced, so the host hides it visually.

**Not `createCanvas`.** The canvas is a camera over an infinite world with nodes, culling, snap and a z-order; a picture is one image in a box. There is no world, no node set and no reason to carry the camera machine.

```tsx
const panzoom = createPanZoom({ min: 1, max: 4, step: 0.25 });

<div {...panzoom.viewportProps} class="viewport">
  <img {...panzoom.imageProps} src={src} alt={alt} />
  <span {...panzoom.valueProps} class="visually-hidden">
    {panzoom.value()}
  </span>
</div>;
```

**Gestures.** A drag pans, a second pointer pinches about its midpoint, a double click resets. Pinch is two pointers and the distance between them, not a platform gesture, so it works where `PointerEvent` does. **Wheel is zoom only with `ctrl` / `meta`** — the browser's own pinch arrives as `ctrl+wheel` — and a bare wheel is never `preventDefault`ed, so the page keeps scrolling; a swallowed wheel is the one thing that is never acceptable on a trackpad.

**`bounds: "clamp"`** (the default) bounds the offset by half the viewport's scaled overflow, so the image is expected to fill the viewport at `min` (`width: 100%; height: 100%` / `object-fit: cover`). A letterboxed image smaller than its viewport cannot be held gap-free: give it a viewport of its own or `bounds: "free"`.

Left to the host: the box (the viewport's size and `overflow: hidden`, `touch-action: none` if a touch drag should pan), the look (a transition on the transform, `transform-origin: 50% 50%` — the default this maths assumes), and the image itself. Not modelled: inertia, rotation, and a keyboard pan at scale `min` (the clamp means there is nothing to pan, so the arrows are inert).

```tsx
const panzoom = createPanZoom({
  scale, // controlled: the host owns the scale
  onScaleChange: setScale,
  onPanChange: (offset) => save({ x: offset.x, y: offset.y }),
});
```

Controlled is `scale` + `onScaleChange`; the offset has no controlled prop, so a host that ignores a scale request also gets the offset resolved for the scale it refused.

## Resizable panels

`createResizablePanels` is a group of N panes and N-1 separators: react-resizable-panels' layout on the APG window splitter's keyboard. Its behaviour is `packages/apg-specs/specs/patterns/resizable-panels.qnt` — not an APG pattern, so it lives under `patterns/` — and the DOM is checked against it by the differential walk. The spec is the three-pane instance (10/80 bounds, 10% steps, pane 0 collapsible at 0); the primitive takes N panes and any bounds.

**The contract.** Sizes are percentages of the group and always sum to 100. Each pane has `min` / `max`; a `collapsible` pane sits at `collapsedSize` (0) while collapsed. A move — an arrow, Home/End, a drag — changes only the two panes around the separator, clamped by both bounds. Collapsing hands the pane's space to the nearest pane that can take it and cascades outward; restoring takes it back in the same order, so a restore always returns the remembered size.

**The separator is the widget**: `role=separator`, `tabindex=0`, `aria-orientation`, `aria-valuenow` = the size of the pane it resizes, `aria-valuemin` / `-max` that pane's bounds, `aria-controls` it. Arrows move by `step` (10%), Home/End jump the pair to its bounds, Enter collapses and restores. A separator next to a collapsed pane is inert (only Enter restores).

**The drag is snapshot + delta**: pointerdown remembers the layout, every move re-solves from it, so dragging back past a clamp recovers exactly. It uses pointer capture and ends on pointerup / pointercancel; a host write of `sizes` ends it too. Keyboard input is a no-op while a drag runs.

```tsx
const panels = createResizablePanels({
  panes: [{ label: "Sidebar", collapsible: true }, { label: "Content" }, { label: "Inspector" }],
  defaultSizes: [20, 40, 40],
  storageKey: "app-layout",
  onSizesChange: (sizes) => save(sizes), // ignored while uncontrolled
});

<div {...panels.groupProps} style={{ display: "flex" }}>
  {[0, 1, 2].map((index) => (
    <>
      <div {...panels.paneProps(index)} style={{ flex: `${panels.sizes()[index]}%` }}>
        …
      </div>
      {index < 2 && <div {...panels.separatorProps(index)} />}
    </>
  ))}
</div>;
```

Controlled is `sizes` + `onSizesChange` (the request), like every other primitive. `storageKey` persists the layout in localStorage — host storage, so the key belongs to the host's namespace.

Left to the host: pane bounds in pixels (percent only), nested groups, and F6 (with three panes a Tab is enough). Not modelled: react-resizable-panels' collapse-on-drag threshold (a pane collapses on Enter or a host write, never by dragging through MIN) and restoring a pane that was mounted already collapsed (it returns to its own `min`).

## Form field

`createField` is the ARIA contract of a form field: a label, a control, a hint and an error. **There is no APG pattern for it**, so there is no Quint spec and no ported scenarios: the contract is WAI-ARIA (`aria-describedby`, `aria-invalid`, `aria-required`) and HTML (`label[for]`, `required`), and where those are silent the majority of Base UI Field, react-aria TextField and ariakit FormControl. `test/field.browser.test.tsx` is its oracle (plain assertions on the attribute objects; no DOM is needed, the file name is only what `vite.config.ts` includes).

```tsx
const field = createField({
  required: true,
  hint: "At least 8 characters",
  get invalid() {
    return touched() && password().length < 8;
  },
  get error() {
    return "Too short";
  },
});

<label {...field.labelProps}>Password</label>
<input type="password" {...field.controlProps} />
<p {...field.hintProps}>{field.hint()}</p>
<p {...field.errorProps}>{field.error()}</p>;
```

- **Ids** are `<id>-control`, `-label`, `-hint`, `-error` from `id` (or a unique one); `labelProps.for` is the control's id.
- **Render the hint and the error elements always.** They carry `hidden` while absent, and `aria-describedby` lists only the ones that are shown, hint first: a reference never points at a hidden or missing id.
- **The error does not replace the hint.** Both are listed, hint then error, as Base UI, react-aria and ariakit do: the hint is what tells the user how to fix the error.
- **`aria-invalid` only when invalid.** An error message makes the field invalid; `invalid: "message"` is both the flag and the message (an `error` wins over it); `invalid: true` without a message marks the control and shows no error; `invalid: false` wins over everything, so a host can keep the message ready and pass `touched() && failed()`.
- **`required`** sets both `required` and `aria-required` (a native control needs the first, a custom widget the second); use `novalidate` on the form if the browser's own bubbles are not wanted.
- **The error announces itself.** `errorProps.role` is `"alert"` while the error is shown and `undefined` while it is hidden, so spreading `errorProps` is all the host does (no hand-written `role={field.error() === undefined ? undefined : "alert"}`); an element that is hidden announces nothing, and one that appears is announced. The hint stays a plain element: `hintProps` has no `role`.
- **One refusal that belongs to two controls.** `describedby` is an id, or a list of ids, of an element the host owns, appended to `aria-describedby` after the field's own hint and error ids (`password-hint password-error form-error`) and dropped when empty. Give a form-level error ("The passwords do not match") one element with its own id and `role`, and pass that id to both fields: each control then names the same message, and it is announced once, not once per field. The field cannot see whether that element is shown, so pass the id only while it is (a getter: `get describedby() { return mismatch() ? "form-error" : undefined; }`); `describedIds()` includes it.
- **Getters that return `undefined` typecheck.** `id`, `required`, `invalid`, `hint`, `error` and `describedby` are all `T | undefined`, so a getter over an optional prop (`get required() { return props.required; }`) compiles under `exactOptionalPropertyTypes`.

## Text input and textarea

`createTextInput` and `createTextArea` are `createField` plus the props a host forgets. **There is no APG pattern for text editing** — an `<input>` already is the pattern — so there is no Quint spec: `test/textbox.browser.test.tsx` asserts the attribute objects and the element behaviour.

```tsx
const email = createTextInput({ type: "email", autoComplete: "email", inputMode: "email", required: true });
<label {...email.labelProps}>Email</label>
<input {...email.controlProps} />
```

- Everything the field documents holds: ids, hint then error in `aria-describedby`, `aria-invalid` only when invalid, `role="alert"` on a shown error.
- The extra props: `type`, `autoComplete` (the HTML token list — the browser's autofill is the accessible path), `spellCheck`, `autoCapitalize`, `inputMode`, `maxLength`, `readOnly`, `disabled`, `required`, `name`, `dir`, `placeholder`, `onValueChange` (one callback for `input`).
- **`maxLength` is the browser's.** The primitive emits the attribute and reports the value it is given; it does not truncate in JS, because that breaks paste and IME.
- **`disabled` vs `readOnly`.** Disabled is out of the tab order and not submitted; readOnly is focusable, selectable and submitted. A field the user must read before signing is readOnly, not disabled.
- `createTextArea` adds `rows`, `wrap` and `resize` (`resize` is a style, since CSS has no attribute for it; `none` is what a layout that owns its own height wants).

## Drop zone

`createDropZone` is a file drop target on a **hidden native `<input type="file">`**: the picker, the `accept` filter and `multiple` are the platform's, and the primitive adds a drag target, the validation and a status line. **There is no APG pattern for a drop zone**, so there is no Quint spec: `test/dropzone.browser.test.tsx` is its oracle. The same primitive replaces the bare file inputs of cms-admin's image field and kocharin's dashboard upload.

```tsx
const upload = createDropZone({
  accept: "image/*",
  multiple: true,
  maxSize: 5 * 1024 * 1024,
  labels: { zone: "Images", browse: "Choose images" },
  onFiles: (files) => void add(files),
  onReject: ({ file, reason }) => toast(`${file.name}: ${reason}`),
});

<div {...upload.zoneProps}>
  <p>Drop images here{upload.dragging() ? " (release to add)" : ""}</p>
  <input {...upload.inputProps} />
  <button {...upload.browseProps}>{upload.message() ?? "Choose images"}</button>
  <p {...upload.statusProps}>{upload.message()}</p>
</div>;
```

- **The zone is never drag-only.** `browseProps` goes on a real `<button type="button">` that clicks the hidden input, so the picker is the keyboard path (Enter and Space are the platform's) and a pointer user can click as well as drag. The browse button's text is the host's; `labels.browse` is its accessible name when that text is an icon.
- **Render the hidden input and the status region always.** `inputProps` carries `hidden`, so it is out of the tab order and the accessibility tree but still the thing the button clicks; the `role="status"` region announces a change of text, which only happens if it was already mounted.
- **Validation happens once per file**, type then size: `accept` is the HTML grammar (`.png`, `image/png`, `image/*`), `maxSize` is bytes. A refused file reaches `onReject` with `reason: "type" | "size"`; the accepted ones reach `onFiles` in one batch, and a batch with nothing accepted calls neither.
- **`message()` is a default sentence**, "2 files, 1 rejected: too large", for the status region; the words are the host's, the primitive only tracks the counts of the last batch. It is `undefined` before the first file.
- **A folder or an empty `DataTransfer` is a no-op**: no callback, no rejection, and the previous announcement stays.
- **`dragleave` counts.** A child's `dragleave` bubbles to the zone, so the state is a depth counter: `dragging()` clears only when the drag leaves the zone itself, or on a drop. `dragging()` is the styling hook — the primitive writes no `data-*`.
- **`disabled`** marks the zone `aria-disabled`, disables the input natively and the browse button, and drops every drag before it becomes a batch. Options are read when an attribute is read, so a host may flip it on a mounted zone.

## Pagination

`createPagination` is a navigation landmark over a page list. **No APG pattern exists**; the requirements are TetraLogical's (accessible-components-library v1.0.0), and `test/pagination.browser.test.tsx` is the oracle.

```tsx
const pages = createPagination({ page: 3, pageCount: 12, hrefFor: (page) => `/issues?page=${page}` });
<nav {...pages.navProps}>
  <ul {...pages.listProps}>{/* items() with gaps, linkProps(page) */}</ul>
</nav>
<p {...pages.statusProps}>{pages.status()}</p>;
```

- **One current page**, marked `aria-current="page"` on the item and its link; the current page is not a link target.
- **The ends stay in place** and carry `aria-disabled` at the boundary instead of disappearing: a control that vanishes moves every other control under the pointer.
- **One gap per elided run**, `siblings` (default 1) either side of the current page and `boundaries` (default 1) at each end.
- **The count is announced once**, in a `role="status"` line ("Page 3 of 12"), not in every link. Pass `labels.status` to translate it.
- **`hrefFor` is what makes it work without JS**: with it every page is a real link; without it they are buttons and the host owns navigation.
- **Target size is the skin's job**: 24x24 CSS px at AA, 44x44 at AAA.

## Table

`createTable` is sortable column headers and row selection on a **native `<table>`**: a `<caption>`, `<thead>`, `<tbody>`, `<th scope="col">` and `<td>` carry the semantics, so the primitive adds no `role` and no `aria-rowindex`, only what the elements cannot say themselves (`aria-sort` on the sorted column, `aria-selected` on a row, the mixed select-all state, and the totals a windowed table hides). It is a grid with a header row but **without the grid's navigation**: the cells keep their own focus, and `createGrid` stays the widget for roving cell focus. There is no spec of its own — it composes the two state models the package already has, `grid-sort.qnt` and `grid-selection.qnt` — so `test/table.browser.test.tsx` is its oracle.

```tsx
const table = createTable({
  columns: [
    { key: "title", abbr: "Title" },
    { key: "status", sortable: false },
    { key: "count", numeric: true },
  ],
  rows, // the host's ids, in the host's order: it sorts its data from the descriptor
  selection: "multiple",
  defaultSort: { key: "title", direction: "ascending" },
  labels: { table: "Open issues", selectRow: (id) => `Select ${nameOf(id)}` },
  onSortChange: (sort) => setSort(sort), // the host re-sorts its data and passes `rows` again
});

<table {...table.tableProps}>
  <caption {...table.captionProps}>Open issues</caption>
  <thead>
    <tr>
      {table.selectAllProps && (
        <th>
          <span {...table.selectAllProps} />
        </th>
      )}
      {columns.map((column) => {
        const sortButton = table.headerButtonProps(column.key); // undefined when not sortable
        return (
          <th {...table.headerCellProps(column.key)}>
            {sortButton ? <button {...sortButton}>{column.key}</button> : column.key}
          </th>
        );
      })}
    </tr>
  </thead>
  <tbody>
    {rows.map((id) => (
      <tr {...table.rowProps(id)}>
        {table.selectAllProps && (
          <td>
            <span {...table.rowCheckboxProps(id)} />
          </td>
        )}
        {columns.map((column) => (
          <td {...table.cellProps(id, column.key)}>{cellOf(id, column.key)}</td>
        ))}
      </tr>
    ))}
  </tbody>
</table>;
```

- **Sorting is the host's data.** The primitive carries the descriptor (`sort()`) and announces it; it never reorders anything. The host maps the descriptor onto its own array and renders `rows` again.
- **`aria-sort` is on the sorted column only.** A sortable header that is not sorted carries nothing (ARIA's default is "not sorted"), and a `sortable: false` column is fully inert: no `aria-sort`, and `headerButtonProps` is `undefined`, so the host renders no button and it is not a tab stop.
- **The cycle is tri-state by default** (`ascending` -> `descending` -> unsorted), so a table can be put back in its own order; `sortCycle: "toggle"` gives `ascending` <-> `descending` and never returns to unsorted, which is what the APG grid example does. A new column always starts `ascending`, and only one column is ever sorted.
- **Rows are ids, not a count.** The host sorts its data, so an id keeps naming the same row across a re-sort while an index would not; the primitive never learns the row's content.
- **Selection** is `"none"` (the default), `"single"` or `"multiple"`, over ids: `selected()` is the list, `rowProps(id)` carries `aria-selected` and a click that selects, and `toggleRow` / `toggleAll` are the programmatic path. The row's checkbox stops its own click from reaching the row, so the two controls never toggle the same row twice.
- **Select-all exists only for `"multiple"`** (`selectAllProps` and `rowCheckboxProps` are `undefined` otherwise: one control over one selection is meaningless). It is a `role="checkbox"`, not a native `input`: the mixed state of a native checkbox is a DOM property (`indeterminate`), and what a screen reader must hear is `aria-checked="mixed"`. It toggles the rows the table renders — a windowed table therefore toggles its window and keeps the rest of the selection.
- **Windowed rows or columns** pass `rowCount` / `columnCount`: then `aria-rowcount` and `aria-colcount` are carried, and every cell gets its `aria-colindex`. A table that renders all of them carries neither (it would only repeat what the markup says).
- **`numeric` is a layout hint** for the host's skin (right alignment, tabular figures): HTML has no attribute for it, so the primitive carries nothing.
- Solid 2 arrives through delegated events; a host that reads the DOM right after a click waits a tick.

## Timeline

`createTimeline` has two modes over one axis. Without `rows` it renders the package's demo tree of five fixed spans (collapsing, a zoom window, the differential walk against `specs/apg/timeline.qnt`); with `rows` it takes real span data and lays it out as a trace waterfall.

```tsx
const timeline = createTimeline({
  rows: spans, // { id, label, start, end, depth?, status? }, in the host's display order
  axis: { unit: "ms" },
  selected: selected(), // controlled; omit it and the primitive keeps the value
  onSelect: (id) => setSelected(id),
});

<ul {...timeline.listProps}>
  {spans.map((span) => (
    <li {...timeline.rowProps(span.id)}>
      <span {...timeline.labelProps(span.id)}>{span.label}</span>
      <div class="track">
        <div {...timeline.barProps(span.id)} />
      </div>
    </li>
  ))}
</ul>
<div {...{ role: timeline.rulerProps.role }}>
  {timeline.rulerProps.ticks.map((tick) => (
    <span style={{ left: `${tick.left}%` }}>{tick.label}</span>
  ))}
</div>;
```

- **A waterfall is a list, not an APG widget.** There is no trace/waterfall pattern, and the rows are neither a tree (nothing collapses) nor a grid (nothing is edited). The rows mode is `role="list"` / `role="listitem"` (see `listProps` / `rowProps`) with `aria-level` = `depth + 1`, so the nesting a flat DOM cannot show is still announced; the selected row is `aria-current="true"`, which every element may carry — `aria-selected` is not allowed on a `listitem` and a waterfall is not a selection control. The demo tree keeps `role="tree"` / `treeitem`, because it does collapse.
- **The extent is the rows'.** `extent()` is the smallest `start` and the largest `end`, so a nested span is positioned and sized as a percentage of the whole trace, not of its parent. `barProps(id).style` is `left` / `width` in percent of that extent. A zero-length span (a marker, `start === end`) still paints: every bar has a **0.5% floor** (2 px on a 400 px track), the floor the o11y dashboard hand-rolled before this mode existed.
- **Depth is a custom property**, `--depth` on `barProps` and `labelProps`, so a narrow track keeps its indentation: `padding-inline-start: calc(var(--depth) * 0.75rem)`. Nesting the label's DOM would steal width from the bar.
- **The ruler is derived.** `rulerProps.ticks` is the extent stepped by 1, 2 or 5 times a power of ten (about five ticks), each `{ value, left, label }` with the label in the `axis.unit` (default `ms`). The ruler itself is decorative (`role="presentation"`, `aria-hidden="true"`); render the ticks as children.
- **Selection and keys.** A row click selects it and moves the tab stop; ArrowUp / ArrowDown / Home / End move a roving tab stop, and Enter or Space selects the row that has DOM focus — the host moves the real focus after an arrow key, as the demo fixture does. `selected` + `onSelect` make it controlled (`selected` is a request the host may ignore); `select(id)` is the programmatic request.
- `status` is carried as `data-status` on the row for the host's colour, and `label` never leaves the host's data: the primitive does not invent the row's text.

## Confirm

`createConfirm` is a promise-based confirmation over `createDialogModal({ role: "alertdialog" })`. Like the field it is not checked against a spec (the dialog is; `test/confirm.browser.test.tsx` covers the promise around it, in Chromium).

```tsx
const confirm = createConfirm();

const remove = async () => {
  if (await confirm.confirm({ title: "Delete post?", description: "This cannot be undone.", confirmLabel: "Delete", destructive: true })) {
    await deletePost();
  }
};

<button {...confirm.triggerProps} onClick={remove}>Delete</button>
<div {...confirm.backdropProps} />
<div {...confirm.dialogProps}>
  <h2 {...confirm.titleProps}>{confirm.request()?.title}</h2>
  <p {...confirm.descriptionProps}>{confirm.request()?.description}</p>
  <button {...confirm.cancelProps}>{confirm.request()?.cancelLabel}</button>
  <button {...confirm.confirmProps}>{confirm.request()?.confirmLabel}</button>
</div>;
```

- `confirm(request)` resolves `true` on the confirm button, `false` on cancel, Escape or a click on the backdrop. `onOpenChange` fires when it opens and when it settles.
- **One request at a time.** A second `confirm()` while one is pending **rejects** with `ConfirmPendingError` and leaves the first alone; it is not queued (a double click on "Delete" would ask twice, and a queued question can outlive the screen that asked it). A pending request is answered `false` when the owner is disposed.
- **Focus.** The cancel button takes focus on open (the least destructive action); on settle focus returns to the element that had it when `confirm()` was called, before the promise resolves, so the caller may move it on.
- **The dialog shell, while it is open.** Tab and Shift+Tab cycle among the dialog's tabbable elements (from the last to the first and back; a focus that escaped is pulled in on the next Tab; with nothing tabbable the dialog itself keeps it). `overflow: hidden` is set on `document.documentElement` and the inline value it had is restored on close, on dispose and on every way the request settles; add `scrollbar-gutter: stable` to the page if the vanished scrollbar must not shift the layout (the lock does not pad for it). Escape is read from the **document**, in the capture phase, so it answers `false` wherever the focus is, and it stops there: the elements around the dialog (a dialog the confirm sits in) do not see it. The backdrop click is `backdropProps`, as before; keep the backdrop and the dialog siblings, or a click inside the dialog reaches the backdrop. Making the rest of the page `inert` or `aria-hidden` is still the host's.
- **Nesting.** Confirms from different `createConfirm` calls may be open together (a "discard changes?" over a "delete?" that opened it): the one opened last gets Escape and Tab, the one under it waits, and the scroll lock is counted, so the first takes it and the last to close restores it. One `createConfirm` is still one request at a time. A `createDialogModal` that is open under a confirm knows nothing of this stack.
- **Labels are the host's.** The defaults, `"Confirm"` and `"Cancel"`, stay English. An app that translates passes `confirmLabel` and `cancelLabel` (and the `title`) with each request, `confirm({ title: t("unsaved"), confirmLabel: t("discard"), cancelLabel: t("keep") })`; a label left out, or `undefined`, falls back to the English default. Nothing in the options needed to change for this: `ConfirmRequest` already carried both labels.
- `aria-labelledby` is the title and `aria-describedby` **always** the description (an alertdialog needs one), so render `descriptionProps` always: it is `hidden` when the request has no description. `triggerProps` are dialog-modal's trigger attributes without the handlers; the click that calls `confirm()` is the host's. `request()` keeps the last request after it settles, so a closing animation does not flash empty.

## Toast and status

Two live regions for the two sizes of feedback: `createStatus` is one `role=status` message whose text the host replaces ("Link copied", "Saved"); `createToast` is a queue of toasts, each with its own live region, a timeout, a ceiling and a countdown that pauses. Neither touches the DOM: like every primitive here they return state and attribute objects. **There is no APG pattern for either** (APG's Alert, `createAlert`, is imperative and assertive), so there is no Quint spec and `test/toast.browser.test.tsx` is the oracle. The behaviour is copied from Base UI's Toast and React Aria's Toast (a landmark, F6 into it, at least 5 s, timers paused on hover or focus, the announced text handed in rather than read from the DOM).

```tsx
const toast = createToast();
const status = createStatus();

const copy = async () => {
  await navigator.clipboard.writeText(url);
  status.show("Link copied");
};

const upload = async () => {
  try {
    await send(file);
    toast.show({ title: "Uploaded", description: file.name, tone: "success" });
  } catch {
    toast.show({
      title: "Upload failed",
      description: "Try again from the file row",
      tone: "error",
    });
  }
};

<p {...status.statusProps}>{status.message()}</p>;

<div {...toast.regionProps} tabindex={-1}>
  <For each={toast.toasts()}>
    {(item) => (
      <div {...toast.toastProps(item.id)}>
        <p>{item.title}</p>
        <p>{item.description}</p>
        <button type="button" onClick={() => toast.dismiss(item.id)}>
          Dismiss
        </button>
      </div>
    )}
  </For>
</div>;
```

- **A status replaces, it does not stack.** `show(text)` writes the one region and `clear()` empties it; a second message before the first is read replaces it. A status is never for errors: an error is `createAlert` (`role=alert`, assertive), and a titled message with a timeout is a toast.
- **Toast roles.** `toastProps(id).role` is `"alert"` for `tone: "error"` and `"status"` otherwise, so an error interrupts and the rest wait. The container is `role="region"` with `aria-label` ("Notifications" unless `labels.region`), and each toast is `aria-atomic`, so its title and description are announced as one — the toast's own text is the announcement, a close button's label included, so keep a toast to its title and description. The role sits on the toast rather than on one container per tone: the container is the `region` landmark, so it cannot also be the live region, and a role per toast needs no second region from the host.
- **Timers.** `timeout` defaults to 5000 ms, the five seconds Base UI and React Aria call the minimum for reading a message; shorter values are for tests. One timer per toast, cleared by `dismiss`/`dismissAll` and all of them on dispose.
- **Pause.** Hovering a toast pauses its countdown and leaving resumes it with the time it had left (the deadline is kept, not restarted); focus always pauses, because a reader who tabbed into the toast must not lose it. `pauseOnHover: false` leaves focus as the only pause.
- **The ceiling.** `max` (default 3) keeps the newest: a `show` past it drops the oldest. `onDismiss(id)` fires for every toast that leaves, whichever way — a timeout, a dismiss, `dismissAll` or the ceiling.
- **F6.** Base UI and React Aria enter the toast region with F6 and return with F6: the region is the target, so give it `tabindex="-1"` and focus it from the host's F6 handler, remembering the element to restore. The primitive binds no keys: global hotkeys are a separate piece (bean cssints-h0d5).

## Popover

`createPopover` is the non-modal overlay: an anchored surface a trigger opens, dismissed by a click on the trigger, an outside `pointerdown` or Escape, with focus moving into it and back to the trigger. **There is no APG pattern for a popover** (APG has Dialog, which is modal), so there is no Quint spec and `test/popover.browser.test.tsx` is the oracle. It is copied from Base UI's Popover (the trigger click toggle, Enter / Space / ArrowDown, light dismiss on an outside `pointerdown` that does not steal focus) and React Aria's `usePopover` (focus in on open, back on close, `role="dialog"` without `aria-modal`, a placement that flips at the viewport edge).

```tsx
const popover = createPopover({ placement: "bottom-start" });
let trigger!: HTMLButtonElement;
let content!: HTMLDivElement;

onMount(() => {
  const teardown = popover.attach(trigger, content);
  onCleanup(teardown);
});

<button {...popover.triggerProps} ref={(element) => (trigger = element)}>Filters</button>
<div {...popover.contentProps} style={popover.contentStyle()} ref={(element) => (content = element)}>
  …
</div>;
```

- **`attach(trigger, content)`** is the whole DOM contract and returns its teardown: it measures and places on open (and on resize, scroll and a `ResizeObserver`), focuses the first focusable element in the content (else the content itself, which is `tabindex="-1"`), returns focus to the trigger on a close it caused, and closes on a `pointerdown` outside both elements. Call it from a `ref`; it creates an effect.
- **`position(triggerRect, contentRect, viewport)`** is pure: it returns `{ top, left, placement }` for the requested placement, flipped to the other side when the room is not there, and shifted (not flipped) into the viewport horizontally. The rects and the viewport must share a space; `attach` measures in client space and writes page space for `position: absolute`.
- **Non-modal, deliberately.** The page behind keeps its focus, its clicks and its scroll: no `inert`, no scroll lock, no Tab cycle, no `aria-modal`. That is `createDialogModal`, and `modal` is typed `false` for that reason.
- **Not a menu.** No roving focus, no arrow keys between items: it is the base for `createMenu` in a popover, and for the filterable menu, which own their own item focus.
- Absent on purpose: hover open (that is `createTooltipGroup`), submenus and item navigation (the menu), a scroll lock and `inert` (the modal dialog), and a vertical shift when neither side fits (the caller sees the requested placement).

## Drawer

`createDrawer` is the drawer / sheet shell: an edge-anchored panel over the Dialog (Modal) semantics, with the same focus, Escape, scroll-lock and backdrop behaviour as `createConfirm`. **No APG pattern exists for a drawer or a bottom sheet**, and [docs/bottom-sheet.md](docs/bottom-sheet.md) settled that the library composes rather than adding a sheet primitive: the semantics are Dialog (Modal), the position, the slide and the snap points are the host's native CSS, and this is the panel both were missing. `test/drawer.browser.test.tsx` is the oracle.

```tsx
const drawer = createDrawer({ side: "right", labelledby: "nav-title" });

<button {...drawer.triggerProps}>Menu</button>;
<div {...drawer.backdropProps} />;
<div {...drawer.contentProps}>
  <h2 id="nav-title">Site</h2>
  <nav>{/* links */}</nav>
</div>;
```

- **`side` is presentation only**, `"right"` (the default), `"left"` or `"bottom"`: a sheet is `{ side: "bottom" }`, a side rail is `{ side: "left" }`, and it is one API either way. The primitive lays out nothing; the host's CSS anchors the panel, and `handleProps` is the grab handle of a sheet.
- **`modal` is the breakpoint switch.** It is read on every attribute read, so a host may flip it while the drawer is open (crossing the breakpoint) and `aria-modal`, the backdrop and the lock follow. `breakpoint` is a px number the primitive **does not read**: it has no viewport, so the host watches `matchMedia` and passes `side` and `modal`. A sheet below a breakpoint is modal; a side rail above it may not be.
- **Modal** (the default): `aria-modal="true"`, a backdrop, focus into the panel's first focusable on open (else the panel, which is `tabindex="-1"`) and back to the trigger on close, Tab and Shift+Tab cycling inside, `overflow: hidden` on `document.documentElement` counted (as in `createConfirm`, and shared with it: a confirm over a drawer nests), and Escape read from the document in the capture phase, so it closes wherever the focus is. **Non-modal**: no `aria-modal`, no backdrop, no lock and no Tab trap, so the page keeps its scroll and its clicks; an outside `pointerdown` still dismisses it when `dismissable`, and Escape still closes it.
- **The trigger toggles** (a hamburger), and Enter / Space open it. `dismissable: false` keeps the backdrop and an outside `pointerdown` from closing the drawer; Escape still closes it, because there is no way out otherwise.
- **No drag-to-dismiss.** A drag is not a dialog interaction: it is a scroll snap the platform runs off the main thread, and it is the host's CSS (`scroll-snap-type: y mandatory`, snap markers, `scrollsnapchange`; see [docs/bottom-sheet.md](docs/bottom-sheet.md)). Re-implementing a native snap in pointer events would be the gesture duplication that research forbids, and the handle would drag on top of the snap that already moved the panel. So `handleProps` is decoration (`aria-hidden`, no pointer handlers) and the ways out are the backdrop, Escape, a close control the host puts in the panel, and the trigger. Swipe-to-dismiss, if it is ever wanted, is a separate decision with its own oracle.
- **No `attach`.** The panel is edge-anchored: nothing is measured and no placement is computed, so focus and the Tab cycle find the panel through `contentProps.id` and the host only spreads attributes onto its own elements. Give the panel a name: pass `labelledby`, or set `aria-labelledby` / `aria-label` after the spread.

## Hotkeys

`createHotkeys` is a **platform utility, not a widget**: one registry for the chords every app hand-rolls (the docs app's `/` and Cmd/Ctrl+K, the CMS's Cmd/Ctrl+S). **No APG pattern exists for a keyboard registry**, so there is no role, no element, no styling and no Quint spec; `test/hotkeys.browser.test.tsx` is the oracle.

```tsx
const hotkeys = createHotkeys();

onSettled(() => {
  hotkeys.bind({
    keys: "mod+k",
    onTrigger: () => searchEl.focus(),
  });
  hotkeys.bind({
    keys: "/",
    when: () => !dialog().open,
    onTrigger: () => searchEl.focus(),
  });
  hotkeys.bind({
    keys: "mod+s",
    scope: editorEl,
    onTrigger: () => save(),
  });
  return () => hotkeys.dispose();
});
```

- **One listener.** `bind` adds a chord to one `keydown` listener on the document in the capture phase (a `scope` only filters the event's target, it does not add a listener), and the last binding to go is the one that removes it; `dispose` unbinds everything and a later `bind` is a no-op. The unbind `bind` returns is idempotent.
- **Modifiers match exactly.** `mod` is Cmd on macOS and Ctrl elsewhere (`isApple` injects the answer, so a test does not read the runner's OS); `ctrl`, `alt`, `shift` and `meta` are as written. A chord that does not declare Shift does not fire with Shift held. A shifted character implies Shift: `"?"` fires from Shift+/ even without `"shift+?"`, and `"/"` does not fire from it.
- **A text field keeps its keys.** A binding does not fire while the focus is in an `input`, a `textarea` or a `contenteditable` (an inherited one included) unless it sets `allowInEditable`, which is what Escape wants: it closes a dialog wherever the focus is.
- **Last bound wins.** Only the most recently bound match fires, so a modal's `"/"` shadows the page's and unbinding it brings the page's back; a `when` that is false makes the next match fire instead, so the gate can close without unbinding.
- **`preventDefault` is on** for a binding that fires (Cmd/Ctrl+S and Cmd/Ctrl+K would otherwise reach the browser); pass `false` to let the platform act too.

Collisions with the browser's own chords: `preventDefault` reaches the page's default action, not the browser's. Cmd/Ctrl+S (Save Page), Cmd/Ctrl+K (the browser's search, in Chrome and Firefox), Cmd/Ctrl+P and `/` (Firefox's quick find) can be cancelled by a page, and a host that binds one is choosing to take it from the browser; Cmd/Ctrl+T, Cmd/Ctrl+W, Cmd/Ctrl+N, Cmd/Ctrl+L and F11 are reserved and cannot be intercepted, so a chord built on them never fires. `keys` takes any of them the same and says nothing.

## Scrollspy

`createScrollspy` is a table of contents whose current entry is the last heading to reach the top of the scrollport. **No APG pattern exists for a scrollspy** (the APG has no table-of-contents pattern), so there is no Quint spec and no ported scenarios: the contract is WAI-ARIA — `aria-current="location"` on the current link, exactly one link at a time, `role="list"` / `role="listitem"` for the list, and a named navigation landmark — plus HTML (`#id` targets). `test/scrollspy.browser.test.tsx` is its oracle.

```tsx
const toc = createScrollspy({
  entries, // { id, label } in document order: the ids are the headings'
  offset: 96, // a sticky header's height
  onChange: (id) => track(id),
});

onSettled(() => toc.attach()); // returns the teardown

<nav {...toc.navProps}>
  <ul {...toc.listProps}>
    <For each={entries}>
      {(entry) => (
        <li {...toc.itemProps(entry.id)}>
          <a {...toc.linkProps(entry.id)}>{entry.label}</a>
        </li>
      )}
    </For>
  </ul>
</nav>;
```

- **A scroll listener, not an `IntersectionObserver`.** "The last heading at or above the offset" is a total order over every heading, and an observer only reports what crossed its band: a band observer has to rebuild the order from its enter/leave state and misreports after a jump (an anchor click, a restored scroll position). The listener is passive, the measurements are reads only (no writes, so no layout thrash), and a docs page has a dozen headings — the same cost as the listener the page already keeps.
- **`attach()`** adds that one listener to `root()` (the document by default; read once, so attach again after swapping containers), calls it once to sync a page opened mid-scroll, and returns the teardown. Headings are looked up by id on every scroll, so they may render after `attach`; an id with no element is skipped.
- **`offset`** is px below the scrollport's top edge, not the viewport's, so an inner container plus a sticky header works: `offset` is the header's height inside that container.
- **Before any scroll the first entry is current**, and it stays current while nothing has passed the line. `active()` is `undefined` only when there are no entries.
- **Exactly one `aria-current="location"`**, on the link, never on the heading: the heading's own `id` is the target. Skin it with `a[aria-current="location"]`.
- **Smooth scrolling is the host's.** The links are plain `#id` targets, the primitive never moves the scrollport, so `scroll-behavior: smooth` (and any `prefers-reduced-motion` override) belongs to the page's CSS; there is no scroll helper to reduce.
- **"On this page" is English.** Spread `navProps` first and override it after: `<nav {...toc.navProps} aria-label={t("onThisPage")}>`.

## Commands

```sh
cd packages/headless
bun run test       # vp test run: vitest browser mode, real Chromium (playwright; needs the browser installed: bunx playwright install chromium)
bun run typecheck  # effect-tsrs
bun run build      # vp pack: dist/ (ESM and declarations; solid-js is a peer)
```

The browser runs at 1280x1024 (`vite.config.ts`): Vitest 5 defaults to a 414x896 viewport, and the canvas tests drag across a 1024 px viewport and measure how far `content-visibility: auto` looks ahead. The menu, treeview and listbox differential walks are slow, and can time out on a loaded machine; run them alone (`bun run test test/menu.browser.test.tsx`) before calling a failure real.

The specs, bridges and scenarios the tests replay are [`@cssints/apg-specs`](../apg-specs/README.md) (a workspace dev dependency, published as its own package).

## Status

Published with the Changesets `fixed` group (one version with the other packages, RELEASING.md). Its manifest follows the other packages (`development` condition on `src`, `dist` for consumers, `publishConfig.directory`).

Solid 2 reminders: setters apply on the microtask flush (the DOM driver waits a frame after each step); pass props objects/getters, never destructure options.

## Research

- [docs/apg-platform-features.md](docs/apg-platform-features.md): which APG patterns are native, polyfilled or a library primitive.
- [docs/bottom-sheet.md](docs/bottom-sheet.md): a bottom sheet is native `<dialog>` plus CSS scroll snap, not a primitive.
- [docs/player-aria-contract.md](docs/player-aria-contract.md): the media player as a composition of slider, toolbar and the media element.

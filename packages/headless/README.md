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

Everything else **ignores** prefs: accordion, alert, alertdialog, breadcrumb, button, carousel, checkbox, checkbox-group, combobox, confirm, dialog-modal, disclosure, feed, field, grid, link, listbox, meter, player, radio, resizable-panels, slider, slider-multithumb, spinbutton, switch, tabs, timeline, toolbar, treegrid, treeview, windowsplitter — they expose no timing / motion / live-region / camera seam. `listbox` / `treeview` / `timeline` typeahead timeouts are host-driven via their reset methods, so they take no delay here either.

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

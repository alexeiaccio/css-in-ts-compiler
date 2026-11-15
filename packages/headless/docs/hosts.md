# Hosts: the platform element, and what it owns

The primitives are state plus attribute objects; they never render an element. Where HTML has the element for a pattern,
a host should render it and let the platform own the behaviour — the primitive then carries only what the platform
lacks (a controlled value, a formatted announcement, a disabled state, the heading semantics an accordion's `summary`
cannot give). This file is the mapping: which element, the code, what the platform takes over, and the gaps that keep the
primitive. It is the "native" column of `apg-platform-features.md`, made concrete.

Every support claim below is the Baseline of 2026-11 (see that file and the Modern Web Guidance guides installed in
`.agents/skills/modern-web-guidance`). Solid 2 code is shown; the attributes are the same in any host.

## Disclosure: `<details>` / `<summary>`

```tsx
<details class={row} ref={el => (details = el)}>
  <summary class={trigger}>{summary}</summary>
  <div class={panel}>{children}</div>
</details>
```

The platform owns: the toggle (click, Enter and Space on the summary), `aria-expanded` (the summary's implicit state),
the panel's hiding, find-in-page in closed content, and the `toggle` event. The primitive is only needed for a controlled
`value`, a `disabled` summary (HTML cannot disable one; use `aria-disabled` and swallow the click) or an
`onValueChange` hook.

The open/close animation is CSS, not JS (Baseline newly 2025-09-16 for `::details-content`):

```css
:root { interpolate-size: allow-keywords; }
details::details-content {
  block-size: 0;
  overflow: clip;
  transition: block-size 0.3s, content-visibility 0.3s;
  transition-behavior: allow-discrete;
}
details[open]::details-content { block-size: auto; }
```

## Accordion: `<details name>`

Same element, grouped: a shared `name` makes the group exclusive (Baseline newly 2024-09-03; Chrome 120, Firefox 130,
Safari 17.2), so one panel closes when another opens — no JS.

```tsx
<For each={items}>
  {(item) => (
    <details name="faq" open={item.open}>
      <summary>{item.title}</summary>
      <div>{item.body}</div>
    </details>
  )}
</For>
```

`multiple` is "no `name`" (or a name per section); `collapsible` is the group's default (a `details` can always be
closed — make it non-collapsible only by re-opening it in the `toggle` handler). **Gap:** `summary` is not heading
content, so APG's "each header is a heading" cannot be satisfied by `<details>` alone; keep the primitive when that
matters (or put the heading around the details and accept that a screen reader's heading list does not reach the
trigger).

## Dialog and alertdialog: `<dialog>` + `showModal()`

```tsx
<button commandfor="confirm" command="show-modal">Delete</button>
<dialog id="confirm" {...({ closedby: "any" } as Record<string, string>)} onClose={closed}>
  <h2>Delete this file?</h2>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="delete">Delete</button>
  </form>
</dialog>
```

The platform owns: the top layer, the backdrop (`::backdrop`), focus into the dialog, focus return to the invoker,
Escape (the `cancel` event, then `close`), the rest of the page being inert, and the scroll lock. `commandfor` with
`command="show-modal"` opens it declaratively (Invoker commands, Baseline newly 2025-12-12); `showModal()` from script
is the same thing. `closedby` (`any` / `closerequest` / `none`) adds light dismiss and a guard for unsaved changes —
Chrome 134 and Firefox 141, **not Safari**; treat it as progressive enhancement, since Esc and the back gesture already
close a modal. `requestClose()` (or `command="request-close"`) is the Cancel path that fires `cancel` first.

The primitive (`createDialogModal`) still gives the controlled open state, the trigger's `aria-haspopup`/`aria-expanded`
pair and the `role=alertdialog` + `aria-describedby` wiring. A host that renders `<dialog>` usually needs only the state.

Entry and exit animation, no JS:

```css
dialog { opacity: 0; translate: 0 8px; transition: opacity 0.2s, translate 0.2s, display 0.2s allow-discrete, overlay 0.2s allow-discrete; }
dialog[open] { opacity: 1; translate: 0 0; }
@starting-style { dialog[open] { opacity: 0; translate: 0 8px; } }
```

## Meter: `<meter>`

```tsx
<label for="quota">Storage</label>
<meter id="quota" value={used} min={0} max={total} low={0.25 * total} high={0.75 * total} optimum={0}>…</meter>
```

The element is the `role=meter` (implicit), with `aria-valuemin`/`max`/`now`, the low/high/optimum thresholds and the
engine's own appearance. `accent-color` is the one knob for the colour; `::-webkit-meter-bar`/`::-webkit-meter-optimum-value`
and `::-moz-meter-bar` are non-standard and partial. The primitive stays for a host without DOM, for a fully styled
gauge (its fill is a div read off `aria-valuenow`), or for `aria-valuetext` formatting the native element does not produce.

## Switch: a checkbox with the `switch` attribute

```tsx
<input type="checkbox" role="switch" {...({ switch: "" } as Record<string, string>)} checked={on} onChange={…} />
```

The `switch` attribute makes the control *look* like a switch in Safari 17.4+; Chrome, Edge and Firefox ignore it and
render a checkbox (WHATWG PR open). The safe baseline is exactly this markup: `type=checkbox` + `role=switch`, which is
what the primitive emits. Style it with `appearance: none` and your own track/thumb, or with `accent-color` when the
native look is enough. No polyfill is needed for behaviour — only for the visual, and only if the design depends on it.

## Checkbox and radio: `<input>`

```tsx
<input type="checkbox" checked={on} onChange={…} />
<input type="checkbox" ref={el => (el.indeterminate = mixed)} />   {/* tri-state: a JS property, not an attribute */}
<input type="radio" name="plan" value="pro" checked={…} />
```

Native inputs give the keyboard, the group semantics of `name`, form submission, `:checked`, `:indeterminate` and the
accessibility tree. The primitives are for the `role=checkbox`/`role=radio` contract when the design cannot use the native
control (and for hosts without DOM); the focusgroup adapter covers the roving tab stop of custom radios.

## Slider: `<input type="range">`

```tsx
<label for="volume">Volume</label>
<input id="volume" type="range" min={0} max={100} step={1} value={volume} aria-valuetext={`${volume}%`} onInput={…} />
```

Native gives the keyboard (arrows, Home/End, PageUp/PageDown), the value mapping, the vertical form (`writing-mode:
vertical-lr`, Chrome 124 / Firefox 120 / Safari 16.5) and the accessibility tree; `accent-color` colours the track and the
thumb. **Gap:** there is no `::thumb`/`::track` in CSS (csswg #4410), so a design that needs its own rail and thumb keeps
the primitive's custom slider (its keyboard and rail-pointer code is the price of that look).

## Text fields: `field-sizing`, `:user-invalid`, `autocomplete`

```tsx
<textarea class={grow} placeholder="Notes" />
<input class={invalid} required minlength={3} autocomplete="email" inputmode="email" enterkeyhint="send" />
```

```css
.grow { field-sizing: content; min-block-size: 2lh; max-block-size: 10lh; }
.invalid:user-invalid { border-color: var(--color-error); }
```

`field-sizing: content` (Baseline newly 2026-06-16) removes the auto-grow script. `:user-invalid` (widely) is the
validation state after the user has interacted — the browser decides, not a `touched` flag. `autocomplete`, `inputmode`,
`enterkeyhint` and `type` are the keyboard and autofill contract; `textbox.ts` already emits them. For a date or time
value, `input.showPicker()` opens the platform picker; a range or a multi-month calendar still needs the library.

## Focus-driven composites: `focusgroup`

Toolbar, tabs, radio, listbox, menu and menubar get the single tab stop, the arrows, Home/End and the wrap from the
`focusgroup` attribute (Chrome/Edge 150; Firefox and Safari not yet), with `@microsoft/focusgroup-polyfill` elsewhere.
`packages/headless/src/focusgroup.ts` is the adapter that sets the attribute where it exists and drives the polyfill's
`FocusGroup` otherwise; the primitives keep selection, activation, typeahead and the ARIA state. The V2 grid runtime
(`focusgrid.ts`) is our own because the platform's `grid` is unpublished upstream.

## Static patterns: native markup

`link` → `<a href>`; `breadcrumb` → `<nav aria-label><ol><li><a aria-current=page>`; `table` → `<table>` with
`<caption>`, `<th scope>` and `aria-sort` as data; `landmarks` → the sectioning elements, including `<search>`. The
primitives exist only for the state a host without DOM needs (a native renderer's accessibility tree) — a DOM host
should render the element and skip them.

## What stays JavaScript, and why

- **Composites without an element**: tabs, tree, treegrid, grid, menu/menubar, listbox, combobox (editable),
  command palette, date picker's calendar, carousel's rotation, resizable panels, splitter, pan/zoom, knob, diagram,
  timeline, virtual windows. The platform supplies pieces (focusgroup, popover, anchor positioning, `content-visibility`),
  never the whole contract.
- **Overlays**: `popover` gives the top layer, light dismiss, Esc and focus return; the menu's keys and typeahead stay.
  `confirm` and `drawer` move to `<dialog>` (the shell's tab cycle and scroll lock are the platform's there).
- **State**: which tab is selected, which rows are checked, the open set of a tree, the value a slider holds — the
  platform has no element to hold it, so the primitives do.

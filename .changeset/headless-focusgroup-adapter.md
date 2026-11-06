---
"@cssints/headless": minor
---

The platform's `focusgroup` contract is now one adapter: `focusGroup(owner, { definition, items })` sets the
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

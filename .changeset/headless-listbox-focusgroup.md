---
"@cssints/headless": minor
---

`createListbox` is the second widget on the `focusgroup` adapter: the platform (Chromium 150+) or
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

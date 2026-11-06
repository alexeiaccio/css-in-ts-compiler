---
"@cssints/headless": minor
---

`createMenu` and `createMenubar` now take the item `tabindex` and the movement along every level's axis from the
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

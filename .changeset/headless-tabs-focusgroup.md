---
"@cssints/apg-specs": minor
"@cssints/headless": minor
---

`createTabs` is now on the `focusgroup` adapter: the platform (Chromium 150+, or `@microsoft/focusgroup-polyfill`)
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

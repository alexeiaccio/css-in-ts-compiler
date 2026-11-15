---
"@cssints/headless": minor
---

`createMenu` gains `overlay: "popover"` (the default stays `"inline"`): the list is a `popover` in the top layer, placed
by the host's CSS anchor positioning (`position-anchor`, `top: anchor(bottom)`), and the platform's light dismiss and
Escape arrive as a `toggle` — the primitive treats that as the same close a pointer outside the widget asks for, so a
controlled host still holds or refuses it. `menuProps` gains `popover`, and its `hidden` is `undefined` under the API.
The kit's `Menu` uses it where `CSS.supports("anchor-name", "--a")` and keeps the inline absolute list elsewhere; the
menubar's submenu levels are not converted yet.

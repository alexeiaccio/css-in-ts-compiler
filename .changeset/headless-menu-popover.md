---
"@cssints/headless": minor
---

`createMenu` gains `overlay: "popover"` (the default stays `"inline"`): the list is a `popover` in the top layer, placed
by the host's CSS anchor positioning (`position-anchor`, `top: anchor(bottom)`), and the platform's light dismiss and
Escape arrive as a `toggle` — the primitive treats that as the same close a pointer outside the widget asks for, so a
controlled host still holds or refuses it. `menuProps` gains `popover`, and its `hidden` is `undefined` under the API.
`createMenubar` takes the same `overlay: "popover"` for every level, with `popover="manual"`: the menubar moves the focus
between the bar, a menu and a submenu itself, and a UA close's focus restore would fight it, so the platform keeps the top
layer there and the primitive keeps Escape and the host's outside press. The lists are synced with the state at the moment
it changes (`bump`), not in an effect: the kit focuses a row from the same change, and a focus into a popover that is
still closed does nothing. The kit's `Menu` and `Menubar` use the mode where `CSS.supports("anchor-name", "--a")` and
keep the inline absolute lists elsewhere.

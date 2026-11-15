---
"@cssints/headless": minor
---

`createDrawer` gains the native `<dialog>` host path: `nativeProps` (`role`, `aria-modal`, `aria-labelledby`, and
`closedby` — `any` or `closerequest` from `dismissable`, `none` for a non-modal rail) and `attachDialog`, which is
`showModal()` for a modal drawer and `show()` for a non-modal one. A modal drawer hands the top layer, the focus
containment and return, Escape, the outside press and the scroll lock to the platform; a non-modal one keeps the shell's
Escape and outside press (a non-modal `dialog` has neither) and takes only the top layer.

On the native path the primitive keeps two contracts the platform does not give: the focus `showModal()` misses when the
panel's controls are not laid out yet (a microtask after the flush, with `autofocus` on the least destructive control in
the kit), and the APG's Tab wrap at the panel's ends — a native modal makes the rest of the page inert but lets Tab leave
to the browser's chrome. `attachDialog` sets `tabIndex = -1` on the panel for the focus fallback (Solid's JSX forbids `tabindex` on a dialog), and no `aria-modal` (`showModal()`
is the modal state).

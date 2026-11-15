---
"@cssints/headless": minor
---

`createDrawer` gains the native `<dialog>` host path: `nativeProps` (`role`, `aria-modal`, `aria-labelledby`, and
`closedby` — `any` or `closerequest` from `dismissable`, `none` for a non-modal rail) and `attachDialog`, which is
`showModal()` for a modal drawer and `show()` for a non-modal one. A modal drawer hands the top layer, the focus
containment and return, Escape, the outside press and the scroll lock to the platform; a non-modal one keeps the shell's
Escape and outside press (a non-modal `dialog` has neither) and takes only the top layer.

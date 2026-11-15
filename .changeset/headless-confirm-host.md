---
"@cssints/headless": minor
---

`createConfirm` can host its alert dialog on a native `<dialog>`: it exposes the dialog modal's `nativeProps` (the
`alertdialog` role, the title/description ids, `closedby="any"`) and `attachDialog`. The platform then owns the modal
layer, the focus containment and return, Escape, the light dismiss and the scroll lock; the promise, the Cancel-first
focus and the request/answer split stay the primitive's, and a platform close answers `false`. `dialogProps` and
`backdropProps` remain the element-free shell.

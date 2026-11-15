---
"@cssints/headless": minor
---

`createDialogModal` gains the native `<dialog>` host path: `nativeProps` (`role`, `aria-labelledby`/`aria-describedby`,
`closedby` from `dismissable` / `keyboardDismissDisabled`, `onCancel` and `onClose`) and `attachDialog(element)`, which
follows the open state with `showModal()`, `show()` (`modal: false`) and `close()`. The platform then owns the top layer,
the backdrop, focus containment and return, Escape and the scroll lock; `dialogProps` remains the element-agnostic
fallback for hosts without `<dialog>`.

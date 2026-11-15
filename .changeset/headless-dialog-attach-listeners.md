---
"@cssints/headless": patch
---

`attachDialog` listens for `close` and `cancel` on the element it is given, instead of relying on the host spreading
`nativeProps.onClose`/`onCancel`. A host whose `<dialog>` is created by a component (a `<Show>`, a render prop) still gets
a platform Escape or `close()` back into the open state; the props stay for hosts that prefer them, and the two requests
are idempotent.

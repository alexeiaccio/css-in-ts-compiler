---
"@cssints/headless": minor
---

`createToast`: the countdown asks before it removes. `onDismissRequest(handler)` is the expiry's channel, so a renderer
can animate a row's departure and call `dismiss(id)` when it is gone; `requestDismiss(id)` is the same ask for a host's
own imperative call, and it removes at once when no handler is subscribed, as `dismiss`, `dismissAll` and the ceiling
always do.

---
"@cssints/headless": patch
---

`createControllable`: a controlled host that commits without a flush — one whose value reads other controls, as a
"select all" checkbox reads its children — now takes the same request again once the value has moved. The
duplicate-intent guard only holds while the value the request was made from still stands, so two gestures in one task
(the native frame loop, which runs a whole click without yielding to a microtask) are two intents, not one. A DOM host
is unaffected: a microtask clears the guard between events anyway.

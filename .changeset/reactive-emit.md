---
"@cssints/reactive": minor
---

`emit()` and `listen()`: the one hand-off to JavaScript. `on({ submit: emit("save") })` writes no state and dispatches a bubbling `reactive:save` `CustomEvent` from the element the native event fired on, its `detail` `{ event, owner }` (the native event and the nearest reactive owner); `listen(target, name, handler)` from `@cssints/reactive/runtime` hears it and returns a disposer.

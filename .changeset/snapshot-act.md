---
"@cssints/headless": minor
---

`createRadioGroup` takes intents and answers with a snapshot: `act({ type: "next" | "previous" | "first" | "last" })`,
`act({ type: "focus" | "check", index })` drive the same paths the keys and the pointer drive (request/commit, callbacks and
ARIA included), and `snapshot()` is the group's observable state as JSON — the checked and focused radios by index, the
disabled ones, the flavor and `aria-orientation`. A test, a demo script or an agent can move the widget without dispatching
DOM events; read the snapshot after a flush.

`createListbox` carries the same pair: `act({ type: "next" | "previous" | "first" | "last" | "activate" })`,
`act({ type: "type", text })`, `act({ type: "focus" | "click", index })` and `snapshot()` with the selection, the active
option, focus, the count, the disabled options and the selection mode. A list moves by DOM focus, so its `act` focuses the
option's element. Its two controlled props are memos now, not signals written by effects (the same relay a controlled value
is not allowed to be).

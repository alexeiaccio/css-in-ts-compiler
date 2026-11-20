---
"@cssints/headless": minor
---

`createRadioGroup` takes intents and answers with a snapshot: `act({ type: "next" | "previous" | "first" | "last" })`,
`act({ type: "focus" | "check", index })` drive the same paths the keys and the pointer drive (request/commit, callbacks and
ARIA included), and `snapshot()` is the group's observable state as JSON — the checked and focused radios by index, the
disabled ones, the flavor and `aria-orientation`. A test, a demo script or an agent can move the widget without dispatching
DOM events; read the snapshot after a flush.

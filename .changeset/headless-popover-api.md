---
"@cssints/headless": minor
---

`createPopover` hosts its panel on the Popover API where the engine has it: the panel becomes a `popover` in the top
layer, so no ancestor's `overflow` or `transform` clips it and no z-index decides its stack. `contentProps` gains
`popover: "auto"` and its `hidden` is `undefined` under the API (the UA hides a closed popover); the fallback keeps
`hidden`. The placement is written in client coordinates with `position: fixed` there, and cancels the UA's
`inset: 0; margin: auto`, which otherwise re-centres the panel. `PopoverStyle.position` is `"absolute" | "fixed"`; a
host that styled the closed panel through `[hidden]` should use `:not(:popover-open)` where the API exists.

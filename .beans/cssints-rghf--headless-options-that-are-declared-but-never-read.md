---
# cssints-rghf
title: 'headless: options that are declared but never read'
status: todo
type: task
priority: low
created_at: 2026-11-02T11:36:39Z
updated_at: 2026-11-02T11:36:39Z
---

Found while documenting the primitives for `docs/API.md` (2026-11-02). Each of these is in a public options type and reads as a feature that does nothing:

- `SwitchOptions.id` — never read; no id appears in `switchProps`.
- `TooltipTriggerInput.label` — never read; the trigger name comes from elsewhere.
- `PaginationLabels.gap` ("More pages") — never read; the gap button uses another label.
- `packages/headless/src/textbox.ts` — the `onValueChange` JSDoc says "Change and input both land here", but only `onInput` is wired.

Either implement the option or remove it from the type (removal is a breaking change for a published package, so a minor with a note, or a patch if the type was never used anywhere). The wayfinder entry of the docs round records the same list.

---
"@cssints/headless": minor
---

`createTreegrid`: the Right arrow decides before the expansion is written, so a collapsed parent always expands and keeps the row focused instead of depending on read-after-write timing. Removed the options that were never read — `SwitchOptions.id`, `TooltipTriggerInput.label` and `PaginationLabels.gap` — and corrected the textbox's `onValueChange` note (it is the `input` event).

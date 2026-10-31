---
"@cssints/headless": minor
---

`createDatePicker` hands the host the popup's placement: `contentStyle()` is the same page-space `position: absolute` box `createPopover` gives. Without it the picker measured and flipped the popup but exposed nothing to put on the element, so a host that portalled the panel had to re-implement the placement or leave the panel at the page's top-left. `date-picker.browser.test.tsx` now asserts the panel starts one gap under the trigger's bottom edge.

`createPopover.attach` and `createDatePicker.attach` no longer create a computation. A host calls `attach` from a `ref`,
Solid 2 runs refs in the effect phase, and a primitive created there belongs to nobody: the dev build throws
`PRIMITIVE_IN_EFFECT_CALLBACK` while the production one stays silent — so the packaged tanstack of this repo's tests passed
and the starter smoke (a real `vite dev` build) failed on every popover and date-picker case. The measurement, the focus
handover and the roving-day focus now live in effects created at setup, and `attach` only records the elements and adds
listeners.

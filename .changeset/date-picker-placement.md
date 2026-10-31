---
"@cssints/headless": minor
---

`createDatePicker` hands the host the popup's placement: `contentStyle()` is the same page-space `position: absolute` box `createPopover` gives. Without it the picker measured and flipped the popup but exposed nothing to put on the element, so a host that portalled the panel had to re-implement the placement or leave the panel at the page's top-left. `date-picker.browser.test.tsx` now asserts the panel starts one gap under the trigger's bottom edge.

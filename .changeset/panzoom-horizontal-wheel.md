---
"@cssints/headless": patch
---

`createPanZoom` leaves a wheel with no vertical delta to the page: a horizontal swipe with `ctrl` / `meta` held (a Magic
Mouse pan, a `deltaX`-only event) used to read as "zoom out" and be `preventDefault`ed. `createKnob` already guarded
`deltaY === 0`; the primitive now does too, and so does every wheel handler in the starters.

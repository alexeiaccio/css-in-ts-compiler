---
"@cssints/headless": minor
"@cssints/apg-specs": minor
---

`createSliderMultiThumb` takes a press on the rail and drags. `trackProps` reads the
pointer's position on the rail in all four orientation/direction combinations,
names the nearer thumb (a tie goes to the lower) and moves it there; a press that
starts on a thumb drags it from the value it already has, without a jump. Every
`pointermove` asks for that thumb's value again, rounded to `step` and clamped at
the neighbour, until `pointerup`, `pointercancel` or a lost capture. The rail owns
the gesture with pointer capture, so the moves sit on `trackProps` and the thumb
only marks its own press. `focused()` now reads synchronously, so a host can move
the DOM focus to the thumb a press named. `disabled` announces `aria-disabled` on
both thumbs, keeps their tab stops, and drops every key, rail press and drag.
`pointerDown(index, 0..1)` stays for a programmatic press and the differential
walk. `slider-multithumb.qnt` records the nearest-thumb press and the drag as
deliberate extensions and names the invariants the model does not carry
(`NearestThumbTakesPress`, `DragFollowsPointer`), with
`slider-multithumb.browser.test.tsx` as their oracle. The kit's two-thumb slider
drops its own press arithmetic and focuses the thumb the primitive announces.

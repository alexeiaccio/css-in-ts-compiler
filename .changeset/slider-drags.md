---
"@cssints/headless": minor
"@cssints/apg-specs": minor
---

`createSlider` drags: a `pointerdown` on the rail jumps to the pointer and starts a
drag, a press on the thumb starts it where the value is, and `pointermove` follows the
pointer's position on the rail (rounded to `step`, clamped to `min`/`max`, in all four
orientation/direction combinations) until `pointerup`, `pointercancel` or a lost capture.
The rail owns the gesture with pointer capture, so `trackProps` carries the moves and the
release and the thumb only marks its own press; a drag is still one request per distinct
value, so a controlled host that ignores it keeps its value, and `disabled` captures
nothing and changes nothing. `slider.qnt` records the drag as a deliberate extension and
names the invariant the model does not carry (`DragFollowsPointer`), with
`slider.browser.test.tsx` as its oracle.

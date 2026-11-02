---
"@cssints/headless": minor
---

`createPanZoom` gains `panBy(dx, dy)`: a relative pan through the same bounded `move` as a drag, for a host that moves the picture without a pointer (an inertial glide after a flick). The clamp and `onPanChange` apply exactly as they do to a pointer.

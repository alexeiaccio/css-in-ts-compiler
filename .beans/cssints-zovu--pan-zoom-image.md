---
# cssints-zovu
title: Pan-zoom image
status: todo
type: feature
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-10-30T10:51:11Z
parent: cssints-65eb
---

kocharin zoomable.tsx is ~110 lines of pointer math with no keyboard path and no ARIA; createCanvas is an infinite canvas and too heavy.

- [ ] pointer drag, wheel, pinch, double-click reset
- [ ] keyboard: +/- zoom, arrows pan, 0 reset, with a focusable viewport and a live value
- [ ] bounds: min/max scale, clamp to the image or allow rubber band (decide)
- [ ] adopt in kocharin-art-3 (another session owns that repo: coordinate)

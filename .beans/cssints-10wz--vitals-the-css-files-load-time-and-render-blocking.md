---
# cssints-10wz
title: 'vitals: the CSS files'' load time and render blocking'
status: todo
type: task
priority: low
created_at: 2026-11-07T11:08:55Z
updated_at: 2026-11-07T11:08:55Z
parent: cssints-7rmb
---

The sheet's bytes are one cost; when they arrive is another, and FCP is the number they delay. `PerformanceResourceTiming` for `.css` entries has `startTime`, `responseEnd`, `renderBlockingStatus` (and `blockedBy`), so the report can say which stylesheet held the paint.

Build:
- One row: `load     3 stylesheets · 2 render-blocking · 41 ms to last · main.css 12 ms (31 kB)`; a bar per sheet of `responseEnd - startTime`, and the sum of the render-blocking window before FCP.
- Count `<link rel="stylesheet">` and inline `<style>` separately; a cross-origin sheet without Timing-Allow-Origin has zeroed timings — mark it `timing hidden`, not 0 ms.
- Nothing is fetched: the entry is already in the timeline.

Check: the Chromium test's fixture page links a local slow stylesheet (a tiny server delay) and asserts the row's blocking count and a non-zero duration; a page with no sheets prints no row.

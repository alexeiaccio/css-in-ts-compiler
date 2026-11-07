---
# cssints-10wz
title: 'vitals: the CSS files'' load time and render blocking'
status: completed
type: task
priority: low
created_at: 2026-11-07T11:08:55Z
updated_at: 2026-11-07T12:30:27Z
parent: cssints-7rmb
---

The sheet's bytes are one cost; when they arrive is another, and FCP is the number they delay. `PerformanceResourceTiming` for `.css` entries has `startTime`, `responseEnd`, `renderBlockingStatus` (and `blockedBy`), so the report can say which stylesheet held the paint.

Build:
- One row: `load     3 stylesheets · 2 render-blocking · 41 ms to last · main.css 12 ms (31 kB)`; a bar per sheet of `responseEnd - startTime`, and the sum of the render-blocking window before FCP.
- Count `<link rel="stylesheet">` and inline `<style>` separately; a cross-origin sheet without Timing-Allow-Origin has zeroed timings — mark it `timing hidden`, not 0 ms.
- Nothing is fetched: the entry is already in the timeline.

Check: the Chromium test's fixture page links a local slow stylesheet (a tiny server delay) and asserts the row's blocking count and a non-zero duration; a page with no sheets prints no row.

## Outcome (2026-11-07)

`src/vitals/load.ts`: the resource timeline's `.css` entries, with their duration, `transferSize` (0 = timing hidden, shown
as no bytes) and Chrome's `renderBlockingStatus` (`null`, not `false`, where the browser has no such field). Row:
`load 2 sheets · 1 render-blocking · 66 ms to last · slow.css 65 ms (327 B)`.
Check: the Chromium test's fixture links a stylesheet the test server delays by 60 ms, and asserts it is the first load,
blocking, and at least 50 ms; the kit site's own run shows its two sheets.

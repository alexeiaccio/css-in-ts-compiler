---
# cssints-t42q
title: Turn on the devtools overlay in apps/sky
status: in-progress
type: task
priority: low
created_at: 2026-10-09T12:00:54Z
updated_at: 2026-10-09T12:48:58Z
---

From cssints-cncb: apps/sky does not turn on the devtools overlay. Its test/dev.mjs assumes every HMR message is a file update and crashes on the custom event cssints:devtools:stale. The overlay itself works on sky by hand.

## Todo
- [x] dev.mjs skips custom HMR events
- [x] cssints({ devtools: true }) in apps/sky, test:dev and test:browser green

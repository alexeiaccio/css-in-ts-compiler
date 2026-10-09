---
# cssints-t42q
title: Turn on the devtools overlay in apps/sky
status: completed
type: task
priority: low
created_at: 2026-10-09T12:00:54Z
updated_at: 2026-10-09T12:54:58Z
---

From cssints-cncb: apps/sky does not turn on the devtools overlay. Its test/dev.mjs assumes every HMR message is a file update and crashes on the custom event cssints:devtools:stale. The overlay itself works on sky by hand.

## Todo
- [x] dev.mjs skips custom HMR events
- [x] cssints({ devtools: true }) in apps/sky, test:dev and test:browser green

## Summary of Changes

- apps/sky/vite.config.ts: `cssints({ devtools: true })`; `@cssints/devtools` in sky's devDependencies (bun.lock).
- apps/sky/test/dev.mjs: custom HMR events (a string payload from `hot.send(event)`, or `type: "custom"`) are not counted as updates.
- `bun run test`, `test:dev` and `test:browser` green with the overlay built; checked by hand on /dev/posts: a picked post card lists its classes by Post.tsx:56, no console error or warning.

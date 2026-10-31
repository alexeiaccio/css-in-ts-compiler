---
"@cssints/apg-specs": minor
---

A Quint machine for the drop zone (`specs/patterns/dropzone.qnt`) and its bridge, scenarios and spec-only test: the drag depth (0 none, 1 the zone, 2 a child), `disabled` and the last delivery, with the five invariants `DraggingIffDepth`, `DepthClearsOnDrop`, `DepthClearsOnExit`, `DisabledNeverDelivers`, `OneDropOneBatch` and `DepthNeverNegative`. There is no APG pattern for file dropping, so it lives in `specs/patterns/` beside `resizable-panels`, and `@cssints/headless`'s `dropzone-spec.browser.test.tsx` replays it in Chromium.

`Probe` gained `value`, off by default: a pattern whose observable state has no attribute of its own (the drop zone's `dragging()` and `message()`) can now have it compared by the differential walk.

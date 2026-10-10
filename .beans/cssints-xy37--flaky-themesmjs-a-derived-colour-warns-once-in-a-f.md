---
# cssints-xy37
title: 'Flaky: themes.mjs ''a derived colour warns once'' in a full run'
status: completed
type: bug
priority: low
created_at: 2026-10-10T16:36:30Z
updated_at: 2026-10-10T20:20:44Z
---

packages/cssints test/themes.mjs:397 'build: a derived colour warns once' failed once inside a full `bun run test` of packages/cssints (integ/tui worktree, busy machine) and passed alone and on the next full run. Probably the per-file-per-build warning de-duplication (cssints-p3d2) racing with another build in the same process, or timing. Reproduce with repeated full runs.

## Todo

- [x] Read themes.mjs and the warning path (registry.warn, flushWarnings, hotUpdate forgetWarnings, buildEnd)
- [x] Reproduce: 20 serial runs, 30 under 14 busy loops, 18 in parallel, 2 full chains under 10 busy loops
- [x] Harden themes.mjs
- [x] depends-on.mjs: wait on events, not fixed sleeps
- [x] Runs after the fix

## Summary of Changes

Not reproduced in the original form. Tried: themes.mjs 20 runs alone, 30 under 14 busy loops (8 cores), 18 in parallel, and 2 full `bun run test` chains under 10 busy loops; all green. No engine bug found in the warning path: `warn()` de-duplicates on `file \0 key` in the process-wide `registry.warned`, which only `buildStart` (build) and `hotUpdate` (dev, client env) clear; only the outer plugin flushes `registry.warnings`, the inner evaluation server never does.

Hardened against what the code shows can break the assertions (test-only):
- Every server of themes.mjs shared one `warnings` array through one customLogger. The first server is never closed, and Vite logs on its own (port in use, the dep scan). The derived-colour checks now use their own logger per server, and they count only the lines that contain `cssints:`.
- The dev twin waited for the first watcher `change`. A probe showed that FSEvents reports the write made just before the watcher started (10 of 15 fresh servers got a stray `change`), so that wait could end early. Then a fixed 500 ms sleep followed. The test now waits for hotUpdate to invalidate tokens.ts (with a 10 s cap). The server uses `ws: false` in place of the fixed HMR port 24999, which collides between parallel worktrees.
- depends-on.mjs: the `vite build --watch` part slept 500 ms and wrote once. A write made before rollup watches the file is lost. It now waits for the built sheet (30 s cap) and writes again until a build sees the edit. Note: two runs at the same time share `test/out/swatch.txt`, so a parallel run of depends-on.mjs fails by design.

After the fix: themes.mjs 30/30 under 10 busy loops, depends-on.mjs 6/6 under 10 busy loops, the full `bun run test` 2/2, typecheck clean.

## Summary of Changes
Not an engine bug: both tests raced the file watcher and shared state, on a busy macOS machine.
- themes.mjs: each server logs into its own collector that keeps only the warnings of cssints (a late log of another server in the same process, or one of Vite's, used to reach the assertion); a pause after the dev server starts lets the FSEvents event of the earlier write pass; the edit check waits on hotUpdate's invalidation instead of a fixed sleep; no HMR port (ws: false).
- depends-on.mjs: the dev part waits on the sheet itself and writes the edit again each second until the module has read it (a late FSEvents event could invalidate the module first, and the watch dependsOn() adds is not live at once, so a write right after the first transform was missed); the build --watch part waits on each build's result and rewrites until a build sees the edit.
- Runs after the fix: themes.mjs 15/15, depends-on.mjs 40/40, the full packages/cssints test 2/2.

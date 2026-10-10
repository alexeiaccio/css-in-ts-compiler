---
# cssints-xy37
title: 'Flaky: themes.mjs ''a derived colour warns once'' in a full run'
status: in-progress
type: bug
priority: low
created_at: 2026-10-10T16:36:30Z
updated_at: 2026-10-10T19:45:38Z
---

packages/cssints test/themes.mjs:397 'build: a derived colour warns once' failed once inside a full `bun run test` of packages/cssints (integ/tui worktree, busy machine) and passed alone and on the next full run. Probably the per-file-per-build warning de-duplication (cssints-p3d2) racing with another build in the same process, or timing. Reproduce with repeated full runs.

## Todo

- [x] Read themes.mjs and the warning path (registry.warn, flushWarnings, hotUpdate forgetWarnings, buildEnd)
- [x] Reproduce: 20 serial runs, 30 under 14 busy loops, 18 in parallel, 2 full chains under 10 busy loops
- [x] Harden themes.mjs
- [x] depends-on.mjs: wait on events, not fixed sleeps
- [x] Runs after the fix

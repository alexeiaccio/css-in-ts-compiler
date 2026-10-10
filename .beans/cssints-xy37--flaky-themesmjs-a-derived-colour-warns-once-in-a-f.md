---
# cssints-xy37
title: 'Flaky: themes.mjs ''a derived colour warns once'' in a full run'
status: in-progress
type: bug
priority: low
created_at: 2026-10-10T16:36:30Z
updated_at: 2026-10-10T18:57:17Z
---

packages/cssints test/themes.mjs:397 'build: a derived colour warns once' failed once inside a full `bun run test` of packages/cssints (integ/tui worktree, busy machine) and passed alone and on the next full run. Probably the per-file-per-build warning de-duplication (cssints-p3d2) racing with another build in the same process, or timing. Reproduce with repeated full runs.

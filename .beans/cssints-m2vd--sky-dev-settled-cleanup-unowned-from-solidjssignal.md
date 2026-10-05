---
# cssints-m2vd
title: 'sky dev: SETTLED_CLEANUP_UNOWNED from @solidjs/signals rc.13'
status: in-progress
type: bug
created_at: 2026-10-05T11:27:20Z
updated_at: 2026-10-05T11:27:20Z
---

Found in cssints-lfoi: every apps/sky dev run logs [SETTLED_CLEANUP_UNOWNED] onSettled returned a cleanup in an unowned scope (@solidjs/signals 2.0.0-rc.13). Find the call site in sky (or the router/plugin), fix it in sky if it is ours, else document upstream with a minimal repro and an issue link draft; a dev check that fails on that warning.

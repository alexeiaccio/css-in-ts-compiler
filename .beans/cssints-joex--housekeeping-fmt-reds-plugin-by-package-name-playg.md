---
# cssints-joex
title: 'Housekeeping: fmt reds, plugin by package name, playground test flakes; npmx.dev links'
status: completed
type: task
priority: normal
created_at: 2026-10-12T18:45:28Z
updated_at: 2026-10-12T19:30:46Z
---

User (2026-10-12): do the three leftovers after 0.3.0, and use https://npmx.dev/package/cssints instead of npmjs.com.

- [x] vp fmt --check green except apps/csssky-tui/test/screens.mjs (the user's other session)
- [x] OpenCode loads the devtools plugin by package name (plugins: ["@cssints/devtools"]) from the published 0.3.0: test in a temp project, document what works
- [x] playground.mjs flakes: a 30 s eval timeout under load (> 30) and 504 Outdated Optimize Dep on a stale .vite cache after a merge that adds a dependency
- [x] links to package pages: npmx.dev (docs/API.md, docs/research, RELEASING.md); npmjs.com stays only for the trusted publisher settings

## Summary of Changes

- `vp fmt` on the root JSON files and `scripts/release.mjs`; `vp fmt --check` is red only on apps/csssky-tui/test/screens.mjs (the other session's).
- `@cssints/devtools` has a `.` export (the OpenCode plugin): OpenCode 2.0.27 loads it by package name (checked on a copy of the installed 0.3.0; it works from the next release).
- playground.mjs flakes: a timed-out evaluation closes the Module Runner (no leak into the next case), `CSSINTS_EVAL_TIMEOUT` for the test, the playground's worker dependencies in `optimizeDeps.include`.
- Package page links go to npmx.dev; npmjs.com stays for the trusted publisher settings.

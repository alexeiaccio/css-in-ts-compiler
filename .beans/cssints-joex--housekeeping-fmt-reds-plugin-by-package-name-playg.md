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

- [ ] vp fmt --check green except apps/csssky-tui/test/screens.mjs (the user's other session)
- [ ] OpenCode loads the devtools plugin by package name (plugins: ["@cssints/devtools"]) from the published 0.3.0: test in a temp project, document what works
- [ ] playground.mjs flakes: a 30 s eval timeout under load (> 30) and 504 Outdated Optimize Dep on a stale .vite cache after a merge that adds a dependency
- [ ] links to package pages: npmx.dev (docs/API.md, docs/research, RELEASING.md); npmjs.com stays only for the trusted publisher settings

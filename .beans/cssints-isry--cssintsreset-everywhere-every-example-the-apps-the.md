---
# cssints-isry
title: '@cssints/reset everywhere: every example, the apps, the setup in the README'
status: in-progress
type: task
created_at: 2026-10-11T19:49:58Z
updated_at: 2026-10-11T19:49:58Z
---

User (2026-10-11): the reset is needed everywhere and in the examples.

- [ ] every project in apps/docs/examples calls reset() from @cssints/reset in its entry (the code says it); the preview's implicit reset layer and its checkbox go (one source: the code), the Result frames render what the code says
- [ ] the README setup shows reset() in the entry (and examples/install, the playground's README example, stays equal to it)
- [ ] apps/demo, apps/csssky and apps/docs use @cssints/reset instead of their hand-written base rules where they overlap (keep what is app-specific); screenshots before/after, no visual regression beyond the reset's intent
- [ ] tests green (docs, playground, csssky, demo build)

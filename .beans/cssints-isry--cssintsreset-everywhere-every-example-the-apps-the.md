---
# cssints-isry
title: '@cssints/reset everywhere: every example, the apps, the setup in the README'
status: in-progress
type: task
priority: normal
created_at: 2026-10-11T19:49:58Z
updated_at: 2026-10-11T19:51:37Z
---

User (2026-10-11): the reset is needed everywhere and in the examples.

- [ ] every project in apps/docs/examples calls reset() from @cssints/reset in its entry (the code says it); the preview's implicit reset layer and its checkbox go (one source: the code), the Result frames render what the code says
- [ ] the README setup shows reset() in the entry (and examples/install, the playground's README example, stays equal to it)
- [ ] apps/demo, apps/csssky and apps/docs use @cssints/reset instead of their hand-written base rules where they overlap (keep what is app-specific); screenshots before/after, no visual regression beyond the reset's intent
- [ ] tests green (docs, playground, csssky, demo build)

- [ ] (user, 2026-10-11) the examples' theme matches the site's: the Result frames and the playground preview take the site's mode (light/dim/dark) AND palette: the frame's canvas (background, text colour, font) from the site's current tokens, passed in and updated on a settings change; examples that set a background without a text colour (the reason the frame was kept white) set both, so nothing is unreadable in any mode

---
# cssints-isry
title: '@cssints/reset everywhere: every example, the apps, the setup in the README'
status: in-progress
type: task
created_at: 2026-10-11T19:49:58Z
updated_at: 2026-10-11T19:49:58Z
---

User (2026-10-11): the reset is needed everywhere and in the examples.

- [x] every project in apps/docs/examples calls reset() from @cssints/reset in its entry (the code says it); the preview's implicit reset layer and its checkbox go (one source: the code), the Result frames render what the code says
- [x] the README setup shows reset() in the entry (and examples/install, the playground's README example, stays equal to it)
- [x] apps/demo, apps/csssky and apps/docs use @cssints/reset instead of their hand-written base rules where they overlap (keep what is app-specific); screenshots before/after, no visual regression beyond the reset's intent
- [x] tests green (docs, playground, csssky, demo build)

## Summary of Changes

- Examples: all 33 entries of apps/docs/examples that lacked it call `reset()` (import from `@cssints/reset`, csssky and cssints-reset already did). The playground preview's implicit reset layer, its "Apply @cssints/reset" checkbox (and its style) and the same layer in the Result frames (plugin/examples.ts) are gone: the code is the one source, a project without `reset()` has none and draws on the frame's 16 px margin. Tests: playground.mjs checks the sheet of the Install example, no switch, and a margin of 16 px for a project without the call; build.mjs still checks the reset in every frame (now from the code).
- README: the setup's entry shows `reset()` next to `import "virtual:cssints.css"`; the README example and examples/install stay equal (both start with the reset import and the call). docs.mjs maps `@cssints/reset` to its source.
- Apps: apps/demo (new src/base.ts: it had no base rules; the entry cannot hold the call, the plugin would run it), apps/csssky and apps/docs call `reset()` in their base.ts and drop `box-sizing` and `margin: 0` on body and the controls' font rule. Kept: page colour, colour scheme, fonts, scroll padding. `@cssints/reset` is a `workspace:*` dependency of the three; `packages/reset/dist` is un-ignored in .gitignore, as the apps need it built (CI builds the docs without building packages): the coordinator builds it on master and commits it.
- Visual comparison (before/after screenshots): csssky differs only by `text-wrap: pretty/balance` on text and the controls' inherited line height, size and weight (a probe that undid exactly those two made 31 of 32 screenshots identical, the 32nd is the skeleton animation); the demo loses the body margin, the default heading and paragraph margins and gets a line height of 1.5, and no longer overflows at 390 px (408 px wide before); the docs get a line height of 1.5 on text without its own, so pages are 4 to 47 px taller, and the playground bar is a few px taller.
- Sizes of the CSS (bytes, gzip): demo 9,536 (3,117) to 9,983 (3,313); csssky 31,049 (7,541) to 31,416 (7,697); docs 71,843 (11,822) to 72,186 (11,950).

- [ ] (user, 2026-10-11) the examples' theme matches the site's: the Result frames and the playground preview take the site's mode AND palette (canvas background, text colour, font from the site's current tokens, updated on a settings change); examples that set a background without a text colour set both
- [ ] (user, 2026-10-11) every example panel on a docs page has tabs Result and Code (read-only, each file highlighted at build time with Shiki, a file switcher, works without JS)

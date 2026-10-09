---
# cssints-sin2
title: Devtools overlay on a production build (static table) for the docs site
status: in-progress
type: feature
created_at: 2026-10-09T12:50:59Z
updated_at: 2026-10-09T12:50:59Z
---

Asked by the user (2026-10-09): the @cssints/devtools overlay on the published docs site, so a reader can pick an element and see the css.* calls, the cascade and the winners. Today devtools is dev-only (apply: serve, the table over HMR).
- [ ] An opt-in build mode, e.g. cssints({ devtools: "build" }) or { devtools: { build: true } }: the plugin writes the table (sheet, classes, sites with file:line and the call text, plugins, tokens) as a static asset and the overlay loads it lazily on first open (button / Alt+Shift+C); nothing loads until then.
- [ ] Session/core read the table from the asset instead of HMR events; stale/updates do not apply in a build. Source locations point at repo paths (no links into the private repo: show file:line and the call text).
- [ ] Size: the table and overlay sizes reported; the entry bundle grows only by the loader.
- [ ] apps/docs enables it; test: the built docs site in Chrome opens the overlay, picks an element, shows its calls; test/build.mjs of devtools updated (a build without the option still has none of it).

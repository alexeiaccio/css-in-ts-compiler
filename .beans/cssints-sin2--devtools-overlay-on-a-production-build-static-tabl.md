---
# cssints-sin2
title: Devtools overlay on a production build (static table) for the docs site
status: in-progress
type: feature
created_at: 2026-10-09T12:50:59Z
updated_at: 2026-10-09T12:50:59Z
---

Asked by the user (2026-10-09): the @cssints/devtools overlay on the published docs site, so a reader can pick an element and see the css.* calls, the cascade and the winners. Today devtools is dev-only (apply: serve, the table over HMR).
- [x] An opt-in build mode, e.g. cssints({ devtools: "build" }) or { devtools: { build: true } }: the plugin writes the table (sheet, classes, sites with file:line and the call text, plugins, tokens) as a static asset and the overlay loads it lazily on first open (button / Alt+Shift+C); nothing loads until then.
- [x] Session/core read the table from the asset instead of HMR events; stale/updates do not apply in a build. Source locations point at repo paths (no links into the private repo: show file:line and the call text).
- [x] Size: the table and overlay sizes reported; the entry bundle grows only by the loader.
- [x] apps/docs enables it; test: the built docs site in Chrome opens the overlay, picks an element, shows its calls; test/build.mjs of devtools updated (a build without the option still has none of it).

## Summary of Changes

- `cssints({ devtools: "build" })` (`true` stays dev only). In a build, the plugin `cssints:devtools-build` (packages/cssints/src/devtools-server.ts) puts a loader module in every HTML page: a `cssints` button and Alt+Shift+C, nothing else. After every module is transformed, `generateBundle` writes the table as `assets/cssints-devtools-<hash>.json` and names it in the loader. The overlay (`@cssints/devtools/overlay`) is a dynamic chunk; the first open loads it and the table.
- The table's sites carry `text`, the call's source (also in dev); in a build their files are relative to the project and `root` is empty, so no path of the build machine is in it. The overlay's `mount({ build: true })` opens at once, takes the table through a transport that never says "stale", and shows a site as `file:line` text with the call's source under it, with no editor link (dev keeps the link and shows the source too). No link to the repository.
- Sizes on the docs site: table 69.9 kB (11.9 kB gzip), overlay 190.6 kB (64.4 kB gzip), the entry +846 bytes (+406 gzip). The build logs the first two.
- apps/docs uses `"build"`. Tests: packages/devtools/test/build.mjs (the demo with `true`: nothing in the output; fixtures/app with `"build"`: the table, the lazy chunk, the loader's size), apps/docs/test/build.mjs (the chunk, the asset, no machine path), apps/docs/test/browser.mjs (the built site in Chrome: nothing loads before the first open; Alt+Shift+C loads the overlay and the table; a pick shows `src/Shell.tsx:68`, the call's source and the cascade).
- `packages/devtools/dist/overlay.js` is now tracked (.gitignore): CI deploys the docs without building packages.

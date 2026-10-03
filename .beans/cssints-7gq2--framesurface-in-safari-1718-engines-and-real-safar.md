---
# cssints-7gq2
title: frame()/surface() in Safari 17/18 engines and real Safari
status: completed
type: task
priority: normal
created_at: 2026-10-03T12:48:57Z
updated_at: 2026-10-03T13:18:34Z
---

Asked by the user (2026-10-03); open since 0.2: a real Safari 17/18 hand check of cssints/frame and cssints/surface (and now the derived-token runtime). This Mac has Safari 26.3.1 on macOS 15.7.4; Safari 17/18 cannot be installed beside it. Run: real Safari 26 through safaridriver (WebDriver) if remote automation can be enabled; WebKit builds of the 17.x and 18.x lines through older playwright-core releases (as plugins.md §3.6 did for old Firefox/WebKit); report which ran. Check the runtime decisions (needed(), lacking() exact), computed styles of frame() embeds and surface() layers in apps/sky and the test:browsers fixtures, and screenshots. State precisely what still needs a human with a real device (iOS Safari 17/18).

## Summary of Changes

- Installed outside package.json under node_modules/.old-browsers: playwright-core 1.36.2 (WebKit 17.0, build 1869), 1.40.1 (17.4, 1944), 1.45.3 (17.4, 2035), 1.46.1 (18.0, 2051), 1.49.1 (18.2, 2104), 1.53.2 (18.5, 2182). All download and run on macOS 15.7 arm64 (the installer picks a build; PLAYWRIGHT_SKIP_BROWSER_GC=1 keeps the others).
- packages/cssints/test/browsers.mjs finds by itself whether a browser has style queries (replaces the OLD=1 switch), so the 17.x/18.x builds, some with and some without them, run with PW= and PLAYWRIGHT_BROWSERS_PATH=. frame, surface and both pass in all six builds.
- apps/sky/test/safari.mjs (bun run test:safari): the built app with default targets in Chrome (reference), the six builds, this repo's WebKit 26.6 and real Safari through a dependency-free W3C WebDriver client. Decisions (frame/surface runtime on where there are no style queries, derived runtime writing where a probe literal fails), settings page colours at 3 modes x 2 hues, post-card radii/surface lightness/embed sizes, screenshots compared in Chrome's canvas. Equal to Chrome in every build except 17.0 (cssints-z7lt, follow-up bug: first-paint rem as px in a registered length, no transition event).
- Real Safari 26.3.1: not run, Allow remote automation is off; the user must enable it (Safari > Settings > Advanced > Show features for web developers, then Developer > Allow Remote Automation, or: sudo safaridriver --enable).
- docs/research/plugins.md section 3.7 holds the table and the findings; AGENTS.md lists test:safari.

---
# cssints-y9w0
title: 'Docs: the rendered result of each page''s example beside Open in playground'
status: completed
type: feature
priority: normal
created_at: 2026-10-11T19:00:04Z
updated_at: 2026-10-11T19:39:55Z
---

User (2026-10-11): on every docs page with an example (apps/docs/examples/<slug>), show the rendered result together with the Open in playground link.

- [x] render at build time (the example compiled by the Node plugin, rendered to static html with its css), shown in a sandboxed frame on the page, readable without JS
- [x] follows the site's light/dim/dark; the reset applied as in the playground
- [x] tests: every example page has a render, no console error

## Summary of Changes

- Build time: plugin/examples.ts runs in a worker of its own (the engine's registry is process-global and is cleared between projects) and puts every project of apps/docs/examples/ through the cssints plugin on one private Vite server, as plugin/landing.ts does for the button. Each project's modules are written to a temporary directory with their imports linked, run in Node, and the default export is rendered to a string by plugin/h.ts, a string `h` that shares `attrs` (class, style, flags) and `main` (which component to show) with the playground's preview through src/playground/hyper.ts. The reset of @cssints/reset is added as in the preview when the project does not call reset(). The sheet and the reset go through LightningCSS (minified, the site's targets).
- On the page: plugin/markdown.ts writes a Result panel (the title, "Open in playground") and plugin/docs.ts puts a `<iframe sandbox="allow-scripts" srcdoc>` under it, in the document and in the page's chunk, so it reads without JS. The frame has a fixed height of 18rem, scrolls and can be resized. The frame's one script asks the page for the display mode and puts it on `<html>` as the class the project's themes read (light, dim, dark, as the preview does); the code that answers, and tells every frame when the settings change, is inlined in the page's chunk, not a shared module (a shared chunk would be listed in the entry's preload map).
- Sizes: the entry chunk is 58,943 bytes before and after (gzip 17,989 and 17,988). The html of all pages: 4,678,268 bytes before, 4,797,484 after (+119 KB, +2.5%; gzip of the html 316,978 to 352,472); 34 frames of 1.6 to 4.3 KB, tokens' 35 KB (open-props).
- Tests: build.mjs checks that every example page has the frame under the link, in the document and in the page's chunk, with the project rendered, the reset, and every class of the markup in the frame's own sheet, and that the entry has none. browser.mjs checks, on the dev server, a frame that renders with no console error, cannot read the page, and gets light, dim and dark; the themes example turns light under a dark system; in the built site the frame is in the static copy and follows the class too.
- Not done: a frame cannot be sized to its content without a layout (a script in the frame would have to report its height); the project's `prefers-color-scheme` media queries follow the system, not the site's mode (only classes follow).

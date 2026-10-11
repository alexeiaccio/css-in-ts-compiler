---
# cssints-1fq0
title: 'Playground: reset in the preview, csssky as the default project, an Open in playground example on every docs page'
status: completed
type: feature
priority: normal
created_at: 2026-10-11T17:52:26Z
updated_at: 2026-10-11T18:47:28Z
---

User (2026-10-11): (1) the playground preview applies @cssints/reset too; (2) every docs page has a realistic example that opens in the playground; (3) the playground opens the csssky app by default.

- [x] preview: @cssints/reset applied (as a real project would: reset() in the entry), visible and switchable
- [x] default project: a csssky slice (shell, post card, feed of posts from csssky's recorded fixtures, its tokens/theme) that runs in the preview's runtime; the README example stays reachable
- [x] per-page examples: a realistic multi-file example per docs page (README sections, API.md pages, package READMEs), each with an Open in playground link (share URL / project id), checked by a test (each example compiles in the browser engine and the Node plugin with no error)
- [x] tests, docs

## Summary of Changes

- Reset: a project that calls `reset()` (csssky's entry does) has the layer in the sheet and the CSS tab; a project that does not gets the reset of `@cssints/reset` in a layer below the sheet in the preview, made by compiling `reset()` once in the worker (no copy of the rules), with a switch under the preview, shown only then. The frame's own margin and font moved into the lowest layer. `h` sets a style object with `setProperty` (custom properties); the frame gets the display settings' `light`/`dim`/`dark` class.
- Default: `examples/csssky` (8 files: theme, breakpoints, shell, feed, post card with link card, model, six posts of `discover.json`), styles as in apps/csssky, Solid parts as plain functions, icons as characters. A picker lists every example; the README example is the Install page's.
- Per page: 34 examples (`apps/docs/examples/<slug>/`, entry `index.ts(x)`) + csssky; `plugin/markdown.ts` writes "Open in playground" (`#example=<slug>`, `share.ts`) on each; 24 pages are skipped, each with a reason in `test/playground.mjs`. The test runs 266 cases (every example included) through the Node plugin and the worker: 0 differ, no error in an example; then the page in Chrome (csssky, reset switch, picker, dim mode, docs link).
- Engine finding: the registry kept a token's `@property` after its file was gone, so a second project failed with "already declared"; `compile.ts` clears the tokens per compile (the Node reference does per case). A helper module with parameters cannot be a file of the playground (every file is evaluated).
- Entry chunk 58.94 kB before and after (gzip 18.06 kB); CSS 71.28 to 71.31 kB; 54 small chunks for the example files; Playground chunk 1.89 MB.
- diff:check warns once, `vite.config.ts` key file: `apps/docs/examples/**` joins the lint `inputs` (the editor type-checks those files with its own JSX).

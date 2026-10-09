---
# cssints-4v2z
title: 'Playground: the cssints engine in the browser'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T12:50:59Z
updated_at: 2026-10-09T15:28:30Z
---

Asked by the user (2026-10-09): a playground on the docs site with the real engine running in the browser (no server). The engine runs today in Node: Vite Module Runner evaluates sites, oxc parses, lightningcss transforms, happy-dom backs the DOM evaluator, node:fs/path/worker in places.
- [x] Research first (docs/research/playground.md): what of packages/cssints/src and css-grammar depends on Node or Vite (list by file), what wasm builds exist (oxc-parser/oxc-transform wasm, lightningcss-wasm), how a module of user code with `import * as css from "cssints" with { type: "cssints" }` can be evaluated in the browser (a minimal module runner over blob/data URLs or a Function-based evaluator over the instrumented code), and which engine pieces must be abstracted (file reads, BCD data size, browserslist targets). Size of the engine bundle for the browser. A go/no-go with a plan.
- [x] If go: a playground page in apps/docs: an editor (start with a plain textarea or CodeMirror; Monaco + TS types if the cost is acceptable), the compiled JS, the CSS sheet, and a live preview iframe; errors located like the build's; share by URL hash. Lazy-loaded (the docs entry does not grow).
- [x] Tests: the playground compiles the README example to the same CSS as the Node engine (a parity test), and in Chrome renders the preview without console errors.

## Summary of Changes

Research (docs/research/playground.md, measured with a spike and the real build): go. The engine runs in a browser worker unchanged; a Vite plugin (apps/docs/plugin/playground.ts) answers what the engine files import from Node: SHA-1 for node:crypto, a POSIX relative, a createRequire over a table (mdn-data selectors, the CSS part of @mdn/browser-compat-data cut to 2.6 MB, the resolved browserslist), a Buffer that is a Uint8Array, stubs for happy-dom and vite/module-runner, wasm builds of oxc-parser (browser-bundle.js), oxc-transform and lightningcss. One engine edit: moduleEntries() (src/entries.ts) moved out of plugin.ts, behaviour-preserving.

/playground (lazy chunk + worker): CodeMirror 6, the sheet, the sheet after LightningCSS, the module as the plugin returns it, the JS the preview runs, a sandboxed live preview, located errors (marks, message, code frame), code in the URL hash, a 15 s cut-off of build-time loops. No cross-origin isolation needed (Chrome, Firefox, WebKit checked). Docs entry +2.3 KB gzip (route, link, 1.7 KB of rules); the playground loads ~3.45 MB brotli on first visit, 1.98 MB of it LightningCSS.

Tests: apps/docs/test/playground.mjs, the README example and 153 fixtures through the Node plugin and the worker in Chrome: 156 cases, 65 same sheet/classes/warnings, 90 same located error, 0 differ; then the page. build.mjs checks the lazy chunks.

## Engine gaps

- plugin.ts: a module that loses its last cssints import keeps its old rules in the sheet on a dev server (usedBy is not cleared in the early return); repro: edit a module with sites into one with none, the sheet still has its classes. Workaround in the parity test: empty the module first.
- @oxc-parser/binding-wasm32-wasi 0.149 own browser loader pairs emnapi 2 with a runtime that wants emnapi 1; use browser-bundle.js.
- Left: multi-file, plugin packages in the module table, LightningCSS on demand, a picker of targets, a DOM stub for the evaluator.

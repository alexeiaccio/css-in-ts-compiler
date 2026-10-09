---
# cssints-4v2z
title: 'Playground: the cssints engine in the browser'
status: in-progress
type: feature
created_at: 2026-10-09T12:50:59Z
updated_at: 2026-10-09T12:50:59Z
---

Asked by the user (2026-10-09): a playground on the docs site with the real engine running in the browser (no server). The engine runs today in Node: Vite Module Runner evaluates sites, oxc parses, lightningcss transforms, happy-dom backs the DOM evaluator, node:fs/path/worker in places.
- [ ] Research first (docs/research/playground.md): what of packages/cssints/src and css-grammar depends on Node or Vite (list by file), what wasm builds exist (oxc-parser/oxc-transform wasm, lightningcss-wasm), how a module of user code with `import * as css from "cssints" with { type: "cssints" }` can be evaluated in the browser (a minimal module runner over blob/data URLs or a Function-based evaluator over the instrumented code), and which engine pieces must be abstracted (file reads, BCD data size, browserslist targets). Size of the engine bundle for the browser. A go/no-go with a plan.
- [ ] If go: a playground page in apps/docs: an editor (start with a plain textarea or CodeMirror; Monaco + TS types if the cost is acceptable), the compiled JS, the CSS sheet, and a live preview iframe; errors located like the build's; share by URL hash. Lazy-loaded (the docs entry does not grow).
- [ ] Tests: the playground compiles the README example to the same CSS as the Node engine (a parity test), and in Chrome renders the preview without console errors.

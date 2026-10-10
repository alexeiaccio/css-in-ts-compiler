---
# cssints-avlz
title: 'Playground: Monaco with TypeScript types, several files, the plugin packages'
status: completed
type: feature
created_at: 2026-10-10T11:29:02Z
updated_at: 2026-10-10T11:29:02Z
---

Follow-up of cssints-4v2z (asked 2026-10-10).
- [x] Monaco editor with the TypeScript language service in a worker and the cssints types loaded (the types of "cssints", cssints/frame, cssints/surface and the plugin packages as extra libs, from their built .d.mts or src, decided at build time): hovers, completions, the type errors of css.* calls as in the editor. Measure the cost: download size, time to first diagnostics on the README example, and whether the type-level grammar is usable in the browser worker (if a full check takes seconds, say so and how it is mitigated: diagnostics debounced, only the open file).
- [x] Several files: a file list (add, rename, delete), relative imports between them with the attribute (`import { t } from "./tokens.ts" with { type: "cssints" }`), one entry, the module runner resolving them; the URL hash carries all files (compressed).
- [x] Plugin packages in the module table: @cssints/icons (an iconify collection small enough, or a stub set), mise-en-mode, fluid, layout, motion, tokens and the others that run without Node; say which do not and why. Types for them in Monaco.
- [x] Parity test extended (a multi-file case, a plugin case), the Chrome check (Monaco loads, a hover shows a type, a type error appears, files switch), sizes before/after; the docs entry does not grow.

## Summary of Changes

Built (apps/docs, no engine edit): `/playground` has Monaco with the TypeScript worker and the types of cssints (replacing CodeMirror), several files, and the plugin packages that run without Node. Details and measures: docs/research/playground.md ("Editor", "Plugin packages", "Sizes").

- **Monaco** (`monaco-editor` 0.57, the one new dependency; CodeMirror's eight packages are gone). Only the core, hover, suggest, parameter hints, brackets, clipboard and the TypeScript contribution are imported. The types are extra libs made at build time (`virtual:playground/types`): the built `dist/*.d.mts` of cssints and css-grammar (844 KB, followed from the entries) and the sources of the plugin packages (no declarations of theirs are tracked); `paths` maps the names. Monaco's own validation is off: the page asks the worker for the diagnostics of the open file, 400 ms after an edit, shows `Types: ok · 430 ms`, and drops a stale answer.
- **Type-level grammar in the browser** (built site, Chrome, localhost): first diagnostics of the README example 0.9-1.1 s of check (4.6 s after the navigation on a cold cache, 2.7 s warm); after an edit 430-510 ms; a module of 40 styles (280 checks) 700-780 ms. Usable: the service is in its own worker, typing never waits for it, only the open file is checked. A module of thousands of declarations would pass a second.
- **Several files**: a file list (add, rename by double-click, delete), relative imports with the attribute (`./tokens.ts`, `../x.ts`, a barrel, `index.ts`), the first file is the entry; each file is evaluated as the plugin transforms it, the sheet is the union; errors are located in the file that has them; all files in the URL hash (`#files=`, deflate of JSON; `#code=` links still open).
- **Plugin packages** run as files of the playground (lazy text, instrumented like Node's runner does): balance, fluid, gradient, layout, masonry, mise-en-mode, motion, ramp, reset, reveal, skeleton, squircle, stuck and the four token sets, with their types in Monaco. Do not run: icons (iconify collections and svg files from disk), fonts (font files from disk, downloads), placeholder (image files, Node codecs).
- **Sizes**: docs entry 154.3 KB raw / 50.0 gzip / 44.6 brotli, +0.1 KB raw and +0.0 gzip against the same tree without the change (the lazy chunks are all of the cost). The playground page: 5.25 MB brotli on a first visit (was 3.45): Monaco's core 538 KB, the TypeScript worker 1018 KB, tsMode 134 KB, editor worker 72 KB, font and CSS 90 KB, the page chunk with the types +70 KB, CodeMirror -140 KB.
- **Tests**: playground.mjs: 224 cases, 0 differ (the README example, 153 cssints fixtures, 63 fixtures of the plugin packages and tokens, five projects of several files, a syntax error); Chrome: Monaco loads, a hover shows `cv<{ wide }>`, a type error and the build error are marked, a type error across two files and in a plugin call, files are added, renamed, deleted and switched, the hash holds all files and opens them, a `#code=` link opens, the 15 s cut-off. build.mjs: the lazy chunks, no Monaco in the entry, no other CSS than the site's sheet and Monaco's.

## Engine gaps

- The cssints Vite plugin transforms every module outside node_modules that mentions `cssints`, so a plugin package's source bundled into another Vite project (the worker) is instrumented: a plain `import { CSSStyleValue } from "cssints"` is an ImportError in the client environment, and a `scope()` member that names a runtime script makes Vite pre-transform `virtual:cssints/runtime/...`, which cannot resolve `@cssints/<pkg>/runtime`. Workaround: the playground loads package sources as `?raw` text and runs them itself. An option of the plugin to leave files alone (`exclude`) would let a docs site bundle them.
- Plugin packages other than icons and mise-en-mode have no tracked `dist/`, so their types in Monaco are their sources (typed code, fine, but heavier than declarations).
- Carried over from cssints-4v2z (still open): a module that loses its last cssints import keeps its old rules in the dev sheet (`usedBy` is not cleared in the early return).
- Left: Monaco after the first paint (2 MB brotli), LightningCSS on demand, a target picker, a DOM stub, icons over the playground's svg files.

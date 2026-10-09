# The engine in the browser: a playground (cssints-4v2z)

Question (the user, 2026-10-09): can the docs site run the real engine in the browser, with no server, so a reader edits a
module and sees its CSS and the page? Answer: **go**. It was built (apps/docs `/playground`) and the Node engine and the
browser engine give the same result for the README example and 153 fixtures (155 cases): 65 compile to the same sheet, classes and
warnings, and 90 fail with the same message, line and column (the fixtures that must fail, and a syntax error). Everything below was measured with a spike and then with the real build, not guessed.

## What in the engine is Node or Vite

By file (`packages/cssints/src`, `packages/css-grammar/src`). "Host" means code that only the Vite plugin runs; the browser has its
own host (`apps/docs/src/playground/compile.ts`), so those files are not part of the browser engine at all.

| File | What it needs | In the browser |
|---|---|---|
| `plugin.ts` | `vite` (server, Module Runner, `transformWithOxc`), `node:fs`, `node:path`, `node:module`, `node:crypto`, `lightningcss` targets, `process.cwd()`, `magic-string` | host: replaced by `compile.ts` (a function of a source text) |
| `devtools-server.ts`, `trace.ts`, `trace-otlp.ts` | `vite` types, OTLP over HTTP | host: not used |
| `evaluate.ts` | `vite/module-runner` (a base class of the evaluator), `happy-dom` (a DOM for the evaluator), `node:url` | reused as is. `evaluate()` takes a runner; a runner of one module is 10 lines. The three imports are stubs; the DOM is not given (see Limits) |
| `instrument.ts` | `oxc-parser` (native, napi), `magic-string` | `oxc-parser` as wasm; `magic-string` is plain JS |
| `macro.ts` | `node:crypto` (`createHash("sha1")` for the class name) | SHA-1 in plain code (the class hash is sync; Web Crypto is async) |
| `token.ts` | `node:crypto`, `node:path` (`relative`), `process.cwd()` (a private token is named after its file) | the same SHA-1; a POSIX `relative`; cwd is `/`, the file `/playground.tsx` |
| `lib.ts` | `createRequire(import.meta.url)("mdn-data/css/selectors.json")` | a `createRequire` that answers from a table |
| `lowered.ts` | `lightningcss` `transform` (what a target gets for a value), `Buffer` | `lightningcss-wasm` and a `Buffer` that is a `Uint8Array` |
| `entries.ts` (new, see below) | nothing | as is |
| everything else (`registry`, `sheet`, `kernel`, `delivery`, `derived*`, `theme`, `scope*`, `contrast`, `runtime`, `frame`, `surface` ...) | `effect`, `culori`; no Node | as is |
| css-grammar `browsers.ts` | `browserslist` through `process.getBuiltinModule("node:module").createRequire`, reads `.browserslistrc`/`package.json` of the cwd | the query is resolved at build time into a list; `createRequire("browserslist")` returns a function that gives it |
| css-grammar `support.ts` | `@mdn/browser-compat-data` (20 MB JSON) the same way | the `css` part, cut to what `support.ts` reads (`__compat.support` of the 12 browsers it maps): 2.6 MB raw, 120 KB gzip, 67 KB brotli |
| css-grammar `twin-core.ts`, `mdn.ts`, `keywords.ts`, `check.ts` ... | `effect` only | as is |

One engine edit was needed, and it moves code without changing it: the part of `plugin.ts`'s `clientTransform` that turns the
sites of a module into its sheet entries (classes, @property rules, themes, kernels, globals, layers, fallbacks, runtimes) is now
`moduleEntries()` in `src/entries.ts`, and `plugin.ts` calls it. Without it the browser host would copy 30 lines that must change
whenever the plugin's do. `packages/cssints` tests pass unchanged.

The engine files are not forked. `apps/docs/plugin/playground.ts` (a Vite plugin) answers what they import, only for importers in
the engine's directories: `node:crypto|path|module|url`, `happy-dom`, `vite/module-runner`, `lightningcss` and `oxc-parser` go to
the shims in `apps/docs/src/playground/shims/`; `@cssints/css-grammar/*` and `cssints/plugin|frame|surface` go to the sources.
A worker bundle has its own plugin list in Vite, so the plugin lists itself in `worker.plugins` too.

## Wasm options

| Piece | Option | Size (raw / gzip / brotli) | Verdict |
|---|---|---|---|
| parser | `@oxc-parser/binding-wasm32-wasi` 0.149 (the same parser, napi-rs wasi build with threads) through its `browser-bundle.js` | 1.49 MB / 485 KB / 344 KB | **used**. The package's own `parser.wasi-browser.js` pairs `@emnapi/runtime` 2 with a `@napi-rs/wasm-runtime` that brings emnapi 1, and fails with `this.bridge.setLastError is not a function`; `browser-bundle.js` is one file with the right pair |
| parser | `@oxc-parser/wasm` 0.60 (wasm-bindgen, no threads) | 0.74 MB / 257 KB / 195 KB | not used: its last version is 0.60 (the engine runs 0.149), so another AST |
| TS and JSX removal | `@oxc-transform/binding-wasm32-wasi` 0.149 | 3.25 MB / 1.09 MB / 723 KB | **used**. With bun's install layout its loader gets the right emnapi; with npm's flat layout it needs aliases |
| lowering and the shipped CSS | `lightningcss-wasm` 1.33 | 15.8 MB / 3.75 MB / **1.98 MB** | **used**, and the biggest piece. Needed because `lowered.ts` asks LightningCSS what a target gets for a value (token fallbacks, a warning that is not one). Option if the size matters: load it only when a module has a support warning, which needs `lowered.ts` to be async |
| TS removal without oxc | sucrase (~150 KB) | | not needed; the wasm transform is the same one Vite uses in Node |

No cross-origin isolation is needed. The wasi builds create shared memory and nested workers, which one would expect to need
`COOP`/`COEP` headers; they run without them in Chrome, Firefox and WebKit (measured: `crossOriginIsolated` is false, `SharedArrayBuffer`
is undefined, parse and transform work). So the site needs no `_headers` file and a link to `/playground` is an ordinary link.

## Evaluating a module in the browser

Node: the plugin instruments the module (`instrument(code, id, false)`), Vite's ssr transform turns its ESM into a function body,
the Module Runner runs it with `"cssints"` resolved to the eval-time library, and `evaluate()` collects what `__site` recorded.

Browser: the same `instrument()` and `evaluate()`; between them, a runner of one module:

1. `oxc-transform` removes TypeScript and turns JSX into `__jsx(...)` (a no-op at build time, as `DomEvaluator` does in Node).
2. `asBody()` (60 lines, on the same wasm parser and `magic-string`) turns the ESM into the body of an `AsyncFunction`: an `import`
   is `const { a: b } = __imp("cssints")`, an `export` is a getter on `__exports`. `__imp` is a table: `cssints` is the namespace of
   `src/index.ts`, and `cssints/plugin|frame|surface` are the plugin modules of the package. Another specifier is a located error.
   This is a Function evaluator; blob URLs and an import map were not needed, and would not give `"cssints"` the live module the
   engine's registry belongs to (an import map is also fixed per document).
3. A fake `ModuleRunner` (`evaluatedModules` three empty maps, `import()` runs the function) is what `evaluate()` is given.

Then the plugin's client step: replace each site by its class string (`MagicString`, `keptImport`, the `__cv` import), and the sheet is
`renderSheet(moduleEntries(...))`. The result is what the plugin returns for the module and the sheet it records.

The compile runs in a **dedicated worker**: the wasm threads, the engine's 3.5 MB and a build-time `while (true)` cost a worker, not
the page; the page ends the worker after 15 s and starts another. The preview is a sandboxed iframe (no same-origin access) that gets
the sheet, a 25-line hyperscript `h` for the JSX that remains, `cx` and `cv`'s `_cv`, and runs the module's default export, `App`, or
first function.

Order matters in one place: the parser's wasm loader has a top-level `await`, `macro.ts` imports the parser (through
`instrument.ts`), and `frame.ts` does not import `macro.ts` but calls the engine when it loads. A bundler-less module graph runs
`frame.ts` while `macro.ts` waits. The plugin modules are therefore imported (dynamically) after the library has run. A message
sent to a module worker before its imports finish is lost, so the page waits for the worker's `ready`.

## What had to be abstracted (and what did not)

- **fs**: nothing reads the project in the browser. `dependsOn()` (`registry.files`) has nothing to read, and reports its path.
- **targets and BCD**: one resolved list (the docs' own browserslist: last 2 versions of Chrome, Firefox, Safari) and the slimmed BCD, both
  virtual modules made at build time. No picker of targets yet.
- **DOM**: Node gives the evaluator a happy-dom window. A worker has none, and happy-dom needs Node. A module that touches `document` at
  build time gets a located error (`window` / `document` is not defined). Modules that do that are rare, and they run in Node because
  the plugin made a DOM for them; the test skips the three fixtures that do.
- **`Buffer`**: LightningCSS's glue (`napi-wasm`) checks `globalThis.Buffer` and hands out views of wasm memory that the next call
  reuses: the shim's `Buffer` is a `Uint8Array`, and the output is decoded at once from a copy.
- **files**: one module, `playground.tsx`. A relative import is a located error. Multi-file means a map of files in the same function
  runner; not built.
- **Effect**: nothing to abstract; `effect` runs in a worker as it does in Node. The `Registry` is process-global, which in a worker
  means worker-global: each compile is an edit of the same module (`forget(id)`, `warned.clear()`), as the plugin's `hotUpdate` does.

## Sizes (the real build, `vp build`)

| Asset | Raw | gzip | brotli | Loaded |
|---|---|---|---|---|
| docs entry (JS + CSS) before | 145.6 KB | 47.2 KB | 42.0 KB | always |
| docs entry (JS + CSS) after | 149.7 KB | 49.5 KB | 44.3 KB | always; +4.1 KB raw, +2.3 KB gzip: the lazy route, the header link and its icon, 1.7 KB of the playground's rules in the one sheet |
| `Playground` chunk (CodeMirror 6, the page) | 513.7 KB | 170.4 KB | 144.4 KB | at `/playground` |
| `worker` (the engine, `effect`, css-grammar data, slimmed BCD) | 3.49 MB | 331 KB | 209 KB | at `/playground` |
| `wasi-worker-browser` (the worker of the wasm threads) | 226 KB | 51 KB | 44 KB | at `/playground` |
| parser wasm | 1.49 MB | 485 KB | 344 KB | at `/playground` |
| transform wasm | 3.25 MB | 1.09 MB | 723 KB | at `/playground` |
| LightningCSS wasm | 15.8 MB | 3.75 MB | 1.98 MB | at `/playground` |
| **Playground, all** | **~25 MB** | **~5.9 MB** | **~3.45 MB** | first visit only; the host caches the hashed files |

Time, on localhost with the built site (`vite preview`): first compile 1.2 s (WebKit), 1.5 s (Firefox), 2.1 s (Chrome) after the
navigation, that is the load, the worker, three wasm compiles and the first build; the first build alone is 0.45-0.7 s. A later compile
of the README example is 6-14 ms in Chrome, 9-28 ms in Firefox and WebKit. On a network the 3.45 MB brotli decides.

## Findings on the way

- **A module that loses its last cssints import keeps its old rules in the sheet** on a dev server. `plugin.ts` returns early for
  a module with no site import and does not clear `usedBy` for it. The parity test works around it (it empties the module first).
  Not fixed here; a one-line `usedBy.delete(id)` plus `reloadSheet()` in that branch, with a test in `test/hmr`.
- `@oxc-parser/binding-wasm32-wasi` 0.149's own browser loader is broken in a flat install (above). Worth a report upstream.
- The error of a located site is the same in both engines to the character, including the line and column.
- **Share links run code.** A link carries a module, and opening it compiles and runs it in a worker of the docs origin (and its
  preview in a sandboxed iframe without same-origin). The worker has no DOM, cookies or storage, and the site has no session. If the
  origin ever has one, run the worker from a sandboxed iframe.

## Editor

CodeMirror 6 (JavaScript with JSX and TypeScript, 140 KB brotli with the page), coloured with the site's own variables, with the
engine's errors as marks at the position. **Monaco with TypeScript types is not acceptable here**: the TypeScript compiler in a
worker is several MB more (not measured), and the types of `cssints` are the type-level grammar, which is the slowest thing the project has (the docs
already type-check its code blocks at build time, in 15 s, for hovers). The errors that matter here are the build's own, which the
playground gives with their positions, in 10 ms.

## Decision and plan

**Go.** Done in this ticket:

1. `entries.ts` out of `plugin.ts` (engine, behaviour-preserving).
2. `apps/docs/plugin/playground.ts`, the shims, `compile.ts` (the host), `worker.ts`/`client.ts` (the page's side), `preview.ts`.
3. `/playground`: CodeMirror, the CSS, the CSS as LightningCSS ships it, the module as the plugin returns it, the JS the preview runs, a
   live preview, located errors (marks, a message and a code frame), the code in the URL hash (`#code=`, deflate and base64url).
4. `test/playground.mjs`: parity with Node for the README example and every fixture of `packages/cssints/test/fixtures` that imports only
   `cssints` (153; 2 skipped for the DOM, plus the README example and a syntax error: 155 cases), then the page in Chrome.

Left, in order of value:

- Multi-file (a file list; relative imports in the function runner), and the plugin packages (`@cssints/fluid`, `layout`, ...) in the module table.
- LightningCSS on demand (2 MB brotli): `lowered.ts` async, or load the wasm after the first compile and rerun.
- A picker of targets (the BCD is already whole for the 12 browsers).
- A real DOM for the evaluator in the worker (a small stub of `document`/`window`), if a module needs it.
- Run the three engine builds (`dist/`) in the playground instead of `src/` when the docs consume the package over git.

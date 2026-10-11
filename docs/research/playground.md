# The engine in the browser: a playground (cssints-4v2z)

Question (the user, 2026-10-09): can the docs site run the real engine in the browser, with no server, so a reader edits a
module and sees its CSS and the page? Answer: **go**. It was built (apps/docs `/playground`) and the Node engine and the
browser engine give the same result for the README example and 153 fixtures (155 cases): 65 compile to the same sheet, classes and
warnings, and 90 fail with the same message, line and column (the fixtures that must fail, and a syntax error). Everything below was measured with a spike and then with the real build, not guessed.

Follow-up (cssints-avlz, 2026-10-10): the editor is Monaco with the TypeScript worker and the types of cssints, the playground has several files,
and the plugin packages that run without Node are in its module table. 224 cases now (the 63 fixtures of those packages, five projects of
several files), 0 differ. See "Editor" and "Plugin packages".

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
the sheet, a 25-line hyperscript `h` for the JSX that remains, `_cx` and `_cv`, and runs the module's default export, `App`, or
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
- **files**: several (cssints-avlz). A file is a name and a text; a relative import (`./tokens.ts`, `../tokens.ts`, with or without the
  extension, `index.ts`) is the id of another file, and the runner gives each file as the body of a function, once per evaluation, as the
  Module Runner does. Each file with a cssints import is evaluated as the plugin would transform it (its own sites, its own entries); the
  sheet is the entries of all of them. An error is located in the file that has it, also when another file imported that one.
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

Since cssints-avlz (Monaco instead of CodeMirror; the entry is measured against the same tree without the change):

| Asset | Raw | gzip | brotli | Loaded |
|---|---|---|---|---|
| docs entry (JS + CSS) | 154.3 KB (+0.1) | 50.0 KB (+0.0) | 44.6 KB (+0.0) | always |
| `Playground` chunk (the page, the types of cssints and the sources of the packages as text) | 1.37 MB | 307 KB | 211 KB (was 141 with CodeMirror) | at `/playground` |
| `editor.api` (Monaco's core) | 2.61 MB | 682 KB | 538 KB | at `/playground` |
| `tsMode` (the TypeScript features of Monaco) | 658 KB | 165 KB | 134 KB | at `/playground` |
| `ts.worker` (the TypeScript compiler, the `lib.*.d.ts` files) | 6.61 MB | 1.42 MB | 1018 KB | at `/playground` |
| `editor.worker` | 297 KB | 91 KB | 72 KB | at `/playground` |
| codicon font and the CSS of Monaco (3 files) | 321 KB | 101 KB | 90 KB | at `/playground` |
| `worker` (the engine) | 3.34 MB | 331 KB | 206 KB | at `/playground` |
| **Playground, all** | **~35 MB** | **~8.2 MB** | **~5.25 MB** | first visit only (was ~3.45 MB brotli: +1.9 MB, Monaco and TypeScript) |

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

Monaco 0.57 (cssints-avlz) with the TypeScript language service in a worker, replacing CodeMirror 6. Only what a playground uses is
imported (the editor core, hover, suggest, parameter hints, brackets, copy and paste, the TypeScript contribution), not `editor.main` with its
80 languages. The types are extra libs of a virtual project, made at build time (`virtual:playground/types`): the **built declarations**
(`dist/*.d.mts`) of `cssints` and `@cssints/css-grammar`, followed from the entries (`cssints`, `cssints/plugin`, `cssints/frame`,
`cssints/surface`) through their relative imports (844 KB raw), and the **sources** of the plugin packages (`src/index.ts` and what it imports,
which is typed code; no declarations are tracked for them). `paths` maps the module names to those files. An import of `effect`, `vite` or
`oxc-parser` inside a declaration has no types and is `any`, which no user line sees. A user file is a model at `file:///<name>`, so
`./tokens.ts` resolves between them, and the files that are not open are part of the program (eager model sync).

**The type-level grammar in the browser.** Measured on the built site (`vite preview`, Chrome, localhost, one core of a laptop):

| | time |
|---|---|
| first diagnostics of the README example (TypeScript worker starts, builds the program, checks the file) | 0.9-1.1 s of check; the status shows `Types: ok · 1100 ms`. 4.6 s after the navigation on a cold cache (the engine's first compile 1.5 s of it), 2.7 s warm |
| the same file after an edit (the program is warm) | 430-510 ms |
| a module of 40 styles, 7 declarations each (280 type-level checks) | 700-780 ms |

So a full check of the open file is under a second, and the grammar is usable. It is kept so by what the page does, not by the types: the
language service is in its own worker (typing never waits for it); Monaco's own validation is off and the page asks for the diagnostics of
**the open file only**, 400 ms after the last edit, and drops an answer that an edit made old; the time is shown (`Types: ok · 430 ms`,
`Types: checking…` while it waits). The engine's errors (build errors, with their position) come in 10-50 ms and do not wait for the
types; where both fail at the same place, both are shown (they say the same words, the types use the twin's messages). A type error in a file
that is not open shows when that file is opened. What is not solved: a module of thousands of declarations would pass the second, and the
check is of the whole file, not of the line that changed.

**What it costs to download** (brotli, first visit, on top of the engine): `ts.worker` (the TypeScript compiler and the `lib.*.d.ts` files)
1018 KB, the editor core 538 KB, `tsMode` (the language features) 134 KB, Monaco's own worker 72 KB, the codicon font 66 KB, its
CSS 24 KB, the types and sources of the packages ~100 KB in the page's chunk. CodeMirror's 140 KB are gone. The page in all: 5.25 MB brotli
(3.45 MB before), 1.9 MB of it Monaco and TypeScript. Nothing of it is in the docs entry.

**Setup notes.** Monaco 0.57's package exports map `monaco-editor/<path>` to `esm/vs/<path>.js`, so imports have no `esm/vs`; its two
workers are modules of their own (`ts.worker.ts`, `editor.worker.ts`, one import each) built like the compile worker. The language service asks
for its worker before it is set up on the first model: the first check tries again after a pause. `moduleResolution: bundler` is a number
(100): Monaco's enum names only node and classic. JSX is `preserve` with a global `JSX` namespace of `any` (the preview has its own `h`), so
only the types of cssints are checked in a tag.

## Plugin packages

They are files of the playground, not part of its bundle. Each package of the list in `plugin/playground.ts` has its `src/*.ts` (and the
relative files it imports) in a virtual module as lazy text; the worker loads the text when a file imports the package, instruments it as
Node's runner does (its sites are recorded and never rendered, as in Node, where only the user's modules are transformed for the client),
removes the types and runs it with the others. Bundling them with the docs would have run the docs' own cssints plugin over them (it
transforms every module that mentions `cssints`, and rendered their rules into the docs' sheet). What they import from outside, `culori`
(gradient, ramp) and `rybitten` (rybitten), is bundled with the worker.

| Runs in the browser | Why |
|---|---|
| `balance`, `fluid`, `gradient`, `layout`, `masonry`, `mise-en-mode`, `motion`, `ramp`, `reset`, `reveal`, `rybitten`, `skeleton`, `squircle`, `stuck`, and the four sets of `tokens` | pure at build time: arithmetic, colour maths (culori, rybitten), `scope()` members |
| `@cssints/icons` | reads `@iconify-json/<collection>/icons.json` (megabytes: ph is 4.5 MB) through `createRequire` and `fs`, and `.svg` files from a directory |
| `@cssints/fonts` | reads font files from disk (fontkitten) and downloads them |
| `@cssints/placeholder` | reads image files, SHA-1 of their bytes, PNG and JPEG codecs for Node |

The three that do not run need files, which a browser has not. `icons` with the `fs` provider could read the `.svg` files of the playground,
and a small collection could be a stub table; not built. Importing one is a located error that lists the modules there are. The runtime
scripts that a package delivers to the page (`reveal`'s observer, `stuck`'s) are named in the module (`import "virtual:cssints/runtime/..."`)
and not run by the preview.

The parity test runs the fixtures of the fourteen packages and of `tokens` that import only modules of the playground (64 cases, 0 differ,
the failures of the engine included: the same message, file, line and column), and projects of several files (a module of tokens, a plain
module, a barrel, a directory and `..`, an error in the imported file, a package in a second file).

## Decision and plan

**Go.** Done in this ticket:

1. `entries.ts` out of `plugin.ts` (engine, behaviour-preserving).
2. `apps/docs/plugin/playground.ts`, the shims, `compile.ts` (the host), `worker.ts`/`client.ts` (the page's side), `preview.ts`.
3. `/playground`: CodeMirror (Monaco since cssints-avlz, below), the CSS, the CSS as LightningCSS ships it, the module as the plugin returns it, the JS the preview runs, a
   live preview, located errors (marks, a message and a code frame), the code in the URL hash (`#code=`, deflate and base64url; since
   cssints-avlz `#files=`, the JSON of all the files, and `#code=` still opens).
4. `test/playground.mjs`: parity with Node for the README example and every fixture of `packages/cssints/test/fixtures` that imports only
   `cssints` (153; 2 skipped for the DOM, plus the README example and a syntax error: 155 cases), then the page in Chrome.

Left, in order of value:

- LightningCSS on demand (2 MB brotli): `lowered.ts` async, or load the wasm after the first compile and rerun.
- Monaco after the first paint: the page could show the code in a plain element and mount Monaco (2 MB brotli) when it has arrived.
- A picker of targets (the BCD is already whole for the 12 browsers).
- A real DOM for the evaluator in the worker (a small stub of `document`/`window`), if a module needs it.
- `@cssints/icons` over the playground's `.svg` files and a small collection; the declarations of the packages (`dist`) for the types, when they are tracked.
- Run the three engine builds (`dist/`) in the playground instead of `src/` when the docs consume the package over git.

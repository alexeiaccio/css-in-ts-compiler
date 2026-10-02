# Wayfinder: restarting CSS-in-TS macros

Date: 2026-09-11. Snapshot of every approach we tried, plus dx-styles and wyw-in-js, and where to restart from.

## The target (unchanged)

From `research/references.md` (Haz): composable utility functions `md(size(2))`, plugins are just functions, compiled to static CSS by default, dynamic only when needed, class order matters. Our additions: atomic content-hashed classes, `@layer` priority, typed CSS values, tokens via `@property`, LightningCSS at the end.

Every macro engine we built fails on the same thing: **arguments are passed to the macro as source text**, not evaluated values. `p(4)` works, `p(space.md)` does not. wyw-in-js exists to solve exactly that problem.

## Our approaches

| # | Where | Parse | Eval | Bundler | LOC | State | Killer problem |
|---|---|---|---|---|---|---|---|
| 1 | this repo, `cssints` + postprocessor (Mar 2026) | none, Parcel `with {type:"cssints"}` | Parcel macros (never wired) | Parcel only | ~2k + Effect | postprocessor works on placeholder at-rules; no bundler integration ever landed | Parcel-only; `@atomic` placeholder CSS is a second language |
| 2 | `../oxc-macro` (Apr 2026) | Rust NAPI (oxc visitor) | Node worker pool, loads macro module, calls export with `argsText` | Vite via unplugin | ~2.5k + Rust 850 | works for literals; detoured into Edge.js/WASIX sandbox; last commit "poop" | args are source text; sandbox rabbit hole; NAPI build per platform |
| 3 | `../tsdown-macro` (Apr 2026) | `rolldown/utils` parseSync (no NAPI) | same worker pool | rolldown/tsdown | ~1.2k | smallest working one; demo was `apps/tsdown-demo` (deleted) | args are source text; rolldown only; no HMR story |
| 4 | `../macros` (27 Apr 2026) | Rust `macro-core` (oxc) | QuickJS via rquickjs, Node VM "later" | unplugin + VFS | Rust 630 + TS ~400 | parser + evaluator + VFS + one integration test; spec is 2k lines (polyfills, csskit typegen, VFS, 3 plugins) | QuickJS cannot import npm packages, so `cssints` itself cannot run in it; spec is 10x the code |
| 5 | this repo, `lightningcss-napi` + `css-syntax` | own Rust bindings to LightningCSS, AST schema gen | n/a | n/a | large | builds; typed AST | duplicating what `lightningcss` npm already exposes; maintenance sink |

What is worth keeping from all of this:

- `cssints` API surface in `docs/API.md` (utility functions, `cn`/`cx`, `media()`, layers, tokens). This is the product.
- `cssints-variants` runtime (`cv`, `_cv`): tiny, fine.
- The content-hash atomic class + `@layer _.a.._.e` model.
- Nothing from the evaluator side. Parsing, worker pools, VFS, NAPI, QuickJS, Edge.js: all of it is replaceable by wyw-in-js.

## wyw-in-js (v2.5.1, Sep 2026)

Toolkit extracted from Linaria. You write a **processor**; it does evaluation and bundler plumbing.

Pipeline (per file, `packages/transform`):

1. Parse with `oxc-parser` (babel is gone from `transform` deps; `babel-preset` package is a separate adapter).
2. Find tagged call sites. Tags are discovered from the library's `package.json`:
   ```json
   "wyw-in-js": { "tags": { "css": "./processors/css.manifest.json", "recipe": "./processors/recipe.js" } }
   ```
   A tag matches `css(...)`, `css.p(...)` (callee can be a `MemberExpression`, like `styled.div`), and tagged templates.
3. Processor constructor declares `dependencies` (the expressions it needs evaluated).
4. **Shaker** (`oxcShaker`) strips the module down to what those expressions need, including imports.
5. **Eval broker** runs the shaken module in a child process with a `node:vm` context and its own module cache (`module.ts`), resolves imports with `oxc-resolver`, `happy-dom` for DOM globals. Values come back over IPC, serializable only.
6. `processor.build(values)` pushes `artifacts` (`["css", [rules, replacements]]`); `doRuntimeReplacement()` swaps the call for a string literal (or any expression).
7. CSS goes to a virtual `*.wyw-in-js.css` import; `stylis` handles nesting and (optional) prefixing. Vite plugin does HMR, SSR dev CSS, `preserveModules` paths, `import.meta.env` injection.

Processor API (`@wyw-in-js/processor-utils` `BaseProcessor`): `dependencies`, `artifacts`, `className` (slug from file + index), `asSelector`, `value`, `build(values)`, `doEvaltimeReplacement()`, `doRuntimeReplacement()`, `addDiagnostic()`. Tags compose through variables (dx-styles `css(focusRing, {...})`). Inline nested tags are buggy, see the spike results.

Bundlers: vite, webpack, esbuild, rollup, next, turbopack, parcel, bun, cli. Node >= 22, ESM only.

Cost: the engine is heavy (eval broker, telemetry, caches, barrel analysis). You do not own it, and the changelog shows it is still fixing eval-cache races monthly. In exchange you never write another evaluator.

Gaps versus our target:

- Class naming is per-call-site slug, not content hash. Atomic dedupe across files is on us: `doRuntimeReplacement` may emit any string and artifacts may contain any selectors, so it is doable inside the processor (dx-styles already emits a `runtimeClassName` that differs from `className`).
- CSS post-processing is stylis. For LightningCSS, set `prefixer: false` and let Vite's `css.transformer: "lightningcss"` handle the emitted file. `@layer` ordering across files needs one global `@layer` declaration we inject once.
- Processor discovery is by import name. `import { css }` with member calls is one tag, `css`. With `import * as css`, wyw asks for a tag per member (`p`, `flex`, ...); one processor can serve them all, but every member needs a tag entry, so prefer the single `css` export.

## dx-styles (v1.4.1, by the Linaria maintainer)

A library built on wyw-in-js, not an engine. Public API: `css({})`, `keyframes`, `recipe`, `slotRecipe`, `createTokenContract`/`createTheme`/`assignVars`, `cx`. Processors live in `processors/*.ts` (~2.5k LOC) plus a `preeval-runtime` for static semantics.

| | dx-styles | our target |
|---|---|---|
| Authoring | object literal, `csstype` keys | composable functions `css.flex(css.items("center"))` |
| Class model | one semantic class per `css()` call, `{displayName}_{slug}` | atomic, content hash, shared across files |
| Specificity | source order, nested selectors literal-only | `@layer _.a.._.e` by condition depth |
| Dynamic | `assignVars()` only (custom properties) | same idea (`token.set`) plus `hover(prop)` |
| Tokens | typed contract + themes, `@property` no | `@property` per token |
| Post-CSS | stylis, recommends Vite lightningcss | LightningCSS |
| Engine | wyw-in-js | none yet |

Reuse from dx-styles: its processor structure (`processors/shared.ts`, manifests, explain artifact) is the best available worked example of a non-trivial wyw processor. Its `recipe()` overlaps `cv()`; ours already exists, keep ours. Do not build on dx-styles itself: its class model is the opposite of atomic and the API is object-shaped.

## Decision

Restart as **`cssints` = wyw-in-js processor**. Delete evaluator work.

Why this and not "finish tsdown-macro":

- Real evaluation of imported values is the feature; wyw already has it, oxc-based, with resolvers and caching we will not out-build.
- Bundler plugins, HMR, SSR, Next, Turbopack come free. Every one of our engines was single-bundler.
- Our differentiators (atomic hash, layers, typed value fns, `@property` tokens, LightningCSS) all live in the processor and the type layer, which is where our time should go.

What we do not build: Rust NAPI, QuickJS, worker pools, VFS, sandboxing, polyfill plugin system, own LightningCSS bindings, CSSWG type generation. Add any of these only after the processor ships and a user asks.

All five spike risks are checked. Results are below.

## Spike results

The code used wyw-in-js 2.5.1 with Vite 8.3. `spikes/wyw` was deleted once the Module Runner engine replaced it; it is in git history before commit `8202dbb`.

- `cssints/` is a real package. Its `package.json` declares the `css` tag, so wyw finds the processor without extra config.
- `fixtures/` run through `run.mjs`, which calls `transform()` directly.
- `app/` is a Vite app with LightningCSS. `hmr.mjs` edits `tokens.ts` on a live dev server.

Historical, needs `git checkout 8202dbb -- spikes/wyw` first:

```bash
cd spikes/wyw && npm i
node run.mjs fixtures/risk1-vars.ts
cd app && npx vite build && node hmr.mjs
```

| Risk | Case | Result |
|---|---|---|
| 1 | `css.p(4)` | works |
| 1 | Composition via variables, `css.flex(center, pad)` | works with `eval.strategy: "execute"` |
| 1 | One inline nested call, `css.flex(css.items("center"))` | works if the `cssints` runtime computes values at eval time |
| 1 | Two inline nested calls, or chains `css.flex().items(..)` | broken in wyw, see problem 1 |
| 1 | Namespace import `import * as css` | needs a tag per member in `package.json` |
| 2 | Imported tokens, `css.p(space.md)`, `css.m(space.lg * 2)` | works |
| 3 | Same atomic rule emitted from two files | works, appears once in the built CSS |
| 3 | Every rule in `@layer _.a`, `cssints/layers.css` imported first | works, layer order holds after LightningCSS |
| 4 | Edit `tokens.ts` in dev, one dependent file | works |
| 4 | Edit `tokens.ts` in dev, two dependent files | broken in wyw, see problem 3 |
| 5 | `css.cn(pad, gap)` | folds to `"_lwugp7 _g2iyum"` |
| 5 | `cx(css.p(4), on && css.m(2))` | becomes `cx("_lwugp7", on && "_1worulw")` |

### How the processor works

The processor in `cssints/processor.cjs` has about 70 lines. It reads the call as steps, for example `flex(center, pad)`.

- **Evaltime replacement** is `preeval(["flex", [args]])`. It returns `{__cssints: [[prop, value]]}`, so an outer call receives structured declarations. This is the same pattern as `preevalCss` in dx-styles.
- **`build()`** turns declarations into atomic rules. The class is a content hash of `prop:value`, and the rule text is `@layer _.a{prop:value;}`. Stylis 4.4 hoists the layer out of the selector.
- **Runtime replacement** is the joined class string.
- **The `cssints` runtime export** returns the same preeval structure when it runs at build time. wyw hoists arguments into thunks like `_exp = () => css.items("center")` and runs them against the real module.

### Problems found in wyw-in-js 2.5.1

1. **Nested usages share one argument queue.** `buildParams` takes arguments with `shift()` from one flat list for all usages in a file, in `transform/src/utils/applyOxcProcessors/expressionValues.ts`. A call whose arguments contain two or more tagged calls takes its neighbours' arguments. Chains fail the same way because every sub-chain is its own usage. Repro: `fixtures/risk1.ts` and `fixtures/risk1-chain.ts`.
2. **Hybrid strategy passes class names instead of values.** The Vite plugin defaults to `hybrid`, which resolves a processor-bound local like `center` to an empty string or its class name. Manifest `preeval-call` semantics pass only the call arguments, not the member name, so they cannot describe `css.flex(...)`. Our fix is `eval: { strategy: "execute" }` in `app/vite.config.ts`. The wyw migration guide calls that mode evaluator-only compatibility. Build time was not measured.
3. **A token edit reaches only the first importer.** When the first importer is re-transformed, `transform/src/cache.ts` records the shared dependency's new hash. The second importer then compares against that hash, sees no change, and reuses its cached result. (The first version of this note blamed `consumeInvalidation`; the re-check of the drafts corrected it.) Upstream commit `180bccb7` in open PR #427 already fixes this, but it is unreleased and targets a branch, not `main`. Vite itself invalidates both modules correctly. Repro: `node hmr.mjs` and `ORDER=button-first node hmr.mjs`, which each leave the other file stale. Production builds are unaffected, and restarting the dev server clears it.

A search of wyw-in-js issues found nothing matching any of the three.

`toDecls` in the spike throws when `flex` or `cn` receive a string instead of a `css.*` value. Problems 1 and 2 therefore fail the build instead of emitting wrong CSS.

### Side findings

- `prefixer: false` works through the Vite plugin. Passed to `transform()` directly it has no effect.
- Unused intermediate consts and token imports are removed from the output code.
- The eval broker keeps Node alive after `transform()`, so the harness calls `process.exit`.
- In headless dev the card's CSS module sometimes kept its old URL for a moment after the edit. Class names were not affected. Check in a real browser.

## Prototype B: own engine on Vite Module Runner

Code lives in `packages/cssints` (was `spikes/runner`). No wyw-in-js. Sizes: `src/plugin.mjs` about 180 lines, `src/macro.mjs` about 100 (58 of them generated member exports), `src/lib.mjs` 45, `src/runtime.mjs` 15. Dependencies: `vite`, `oxc-parser`, `magic-string`, `effect`.

```bash
bun install
cd packages/cssints/test && node run.mjs fixtures/risk1.ts fixtures/risk1-chain.ts fixtures/risk2.ts fixtures/risk5.ts
cd hmr && node hmr.mjs && ORDER=button-first node hmr.mjs
```

How it works, per file that imports `cssints`:

1. **Instrument** (ssr environment). `oxc-parser` finds every maximal `css.*` call and wraps it in `__site(file, n, ...)`. Calls inside function bodies are hoisted to the end of the module, since they never run at load time. Nested calls and chains need nothing special: the outer call receives the inner value.
2. **Evaluate** (client environment). `server.environments.ssr.runner.import(file)` runs the instrumented module in-process. The `cssints` runtime builds declaration nodes and `__site` records the class string per call site in a process-global registry. This step is an `Effect.fn` with a 30 second timeout and a tagged error.
3. **Replace.** Each site span becomes its class string literal. Rules go to a virtual `cssints.css` module keyed by content hash. Dependencies from the runner module graph are remembered, and `hotUpdate` returns the importing modules when one of them changes.
4. **Build.** The plugin starts a private middleware-mode dev server for the runner. Same as vanilla-extract with vite-node.

| Case | wyw 2.5.1 | Module Runner |
|---|---|---|
| `css.p(4)`, variables, imported tokens | works | works |
| Two inline nested calls, chains `css.flex().items()`, `css.flex.items()` | broken | works |
| Namespace import | tag per member | works |
| Same rule from two files, `@layer` order | works | works |
| HMR, two files depend on one token file | one stays stale | both fresh, both orders |
| `cn` folds, `cx` stays at runtime | works | works |
| Dependency touching `document` at top level (`fixtures/risk6.ts`) | shaker removes it | fails, `document is not defined` |
| 7 fixtures in one process, rough | 1.9 s for 5 files in separate processes | 0.3 s |

The timing is not a fair comparison. wyw spawns an eval child process per harness run, and both numbers are for tiny files.

### React demo on the prototype

`apps/demo` (was `spikes/runner/app-react`) is the old `apps/demo` with the `with { type: "macro" }` attributes removed and nothing else changed. It uses named imports (`display`, `p`, `bg`, ...), `cv()` with CSS strings, `_cv` and `cx` at runtime, React 18 and JSX.

```bash
cd apps/demo && bun run build && bun run preview
```

- Build passes. All three files (`App.tsx`, `Button.tsx`, `Card.tsx`) compile, including `cv()` whose config becomes a plain object of class strings for `_cv`.
- The page renders correctly in the browser, no console errors. Button variants and card sizes from `cv()` apply.
- The bundle holds no eval-time code: no `Proxy`, no `__site`, no `toDecls`. Only `cx` and `_cv` ship. That needed `cssints` split into `macro.mjs` (eval) and `runtime.mjs` (ships) with `sideEffects: false` and `/* @__PURE__ */` on member definitions.
- No side-effect failure appeared. React itself imports cleanly under the runner. `main.tsx` touches `document` but imports nothing from `cssints`, so it is never evaluated.

Named imports and `cv()` were added to the plugin and runtime for this, about 40 lines.

What the prototype does not have and wyw does:

- **No shaker.** The whole module runs, with all its imports. A component file that imports a DOM-touching library breaks the build. Fixes, in order of cost: run the runner with `happy-dom` globals like wyw does, or strip everything except the `css.*` sites and their bindings before evaluation, which is the shaker wyw took years to stabilize.
- **Vite only.** Rolldown-based tooling inherits it. webpack, esbuild, Next with Turbopack do not.
- No processor API, no per-site diagnostics with code frames. Source maps come from `magic-string` (`packages/cssints/test/map-check.mjs` maps a replaced class back to its `css.*` call).

Effect is used in one place, the evaluate step. It earned nothing measurable in this prototype. It becomes useful with worker isolation, cancellation on rebuild, and structured diagnostics, none of which exist yet.

## Next

Both paths are now real. The choice is between fixing wyw and owning a small engine:

- **wyw**: three upstream fixes with ready repros. In return: shaker, every bundler, source maps, an existing processor ecosystem. Risk: how fast upstream moves, and `execute` mode is the compatibility path, not the default.
- **Module Runner**: 230 lines, all seven fixtures pass, HMR correct by construction. Risk: side effects in evaluated modules, and Vite only.

The React demo did not hit the side-effect problem, because component files import React and nothing that touches the DOM at load time. That is the common case for a design-system codebase. The remaining question is a real app tree with heavier module-level side effects, and `happy-dom` in the runner is the first thing to try when one appears.

Recommendation: continue on the Module Runner. Port the real API from `docs/API.md` into this plugin, keep the three wyw repros as an upstream contribution, not a dependency.

## Types: generator from mdn-data

Code lived in `spikes/typegen` (deleted, in git history). `gen.mjs` is about 200 lines: a parser for CSS value-definition syntax, a shape classifier, and an emitter. Output is `out/properties.ts` and `out/values.ts`, checked with `tsc --strict` in `out/check.ts`.

```bash
# historical: spikes/typegen was deleted in the repo restructure (cssints-vq75); it is in git history
cd spikes/typegen && node gen.mjs && (cd out && ../../../node_modules/.bin/tsc -p tsconfig.json)
```

Policy. Each property becomes an **argument tuple type**, not a single value type. `padding` is `[L] | [L, L] | [L, L, L] | [L, L, L, L]`, so the function API is `p("1rem", "2rem")` and shorthands never need template concatenation. Atoms are keywords as literals, primitive value types as template types (`LengthValue`, `Percent`, `TimeValue`, `AngleValue`, `${number}fr`), and brands for everything that only a constructor can produce: `ColorValue`, `ImageValue`, `UrlValue`, `PositionValue`, `Fn<"calc-size">`. Comma lists become rest parameters. `||` and `&&` become 1 to n slots drawn from the union of their parts, which loses "each at most once" and nothing else.

Coverage, mdn-data 2.27.1, 635 non-obsolete standard properties:

| | Count | Share |
|---|---|---|
| Typed as bounded argument tuples | 557 | 87.7% |
| of which a plain single-value union | 353 | |
| of which contain a `string` or `CustomIdent` escape | 9 | |
| Not typed | 78 | 12.3% |
| Current `cssints` members typed (of 42) | 35 | |

What is not typed and why. Lists of multi-slot items (`transition`, `box-shadow`, `font-family`, `mask-*`, `animation-range`): 21. `||` or `&&` over multi-slot parts (`flex`, `text-decoration`, `column-rule`, `aspect-ratio`): 16. `grid-*` line and track lists: 12. `background`, `mask`, `animation`, `cursor`, `content`, `place-*` (too many shapes): the rest. Every one of these is a shorthand or a list whose natural API is a constructor: `shadow(...)`, `transition(...)`, `fontFamily(...)`. That is the hand-written part, about 20 functions, and it matches the plan from before.

Generated file: 130 KB, 557 types, `tsc --strict` passes in 0.6 s. `check.ts` confirms `p("1rem", "2%")`, `ai("safe", "center")`, `b("1px", "solid", red)` compile and `p("one rem")`, five padding values, `c("red")` with a raw string, `w("fit")` do not.

One TS limit found: `${number}rem` accepts `"1 rem"`, since TS tolerates trailing whitespace in the number part. The build-time parse through LightningCSS rejects it, so the two layers are needed together.

Remaining work for real use: JSDoc from `@mdn/browser-compat-data`, camelCase name collisions between vendor-prefixed and standard properties, and a decision whether `CustomIdent` (9 properties) stays a string escape or becomes a brand.

## Types, take two: a type-level recognizer

Code lives in `packages/css-grammar` (was `spikes/typelevel`). `css.ts` is 202 lines of types: a lexer and parser for the mdn value-definition syntax, and a recognizer that checks a string literal against the parsed grammar. `mdn.ts` holds grammar strings verbatim from mdn-data (`extract.mjs` copies a property set plus the closure of `<refs>` it uses). No generated types.

```bash
cd packages/css-grammar && node scripts/extract.mjs padding width border color display && bunx tsc -p tsconfig.json
```

The API this gives:

```ts
declare const padding: PropertyFn<"padding">;
padding("1rem 2rem");       // ok
padding("1rem 2rem 3rem 4rem 5rem");
// Argument of type '"1rem 2rem 3rem 4rem 5rem"' is not assignable to parameter of type
// '"padding: \"1rem 2rem 3rem 4rem 5rem\" does not match <'padding-top'>{1,4}"'
```

`Matches<Syntax, S>` computes the set of remainders after the grammar consumes a prefix of `S`, and succeeds when the empty string is among them. Alternation is a union, sequence is composition, `?` `*` `+` `#` `{m,n}` `||` `&&` are all implemented, `<type>` and `<'prop'>` references are looked up in the tables. Function arguments such as `fit-content(50%)` are accepted as an opaque chunk for now, and a few recursive syntaxes (`calc-sum`, `color-function`) are marked opaque.

Probe results, `probe.ts`, 24 expected matches and 10 expected rejections, all correct: shorthands (`0 1px 2px 3px`, `1rem 2rem / 3rem`), any-order combinators (`1px solid #fff`, `red 2px`, `inline flex`), optional prefixes (`safe center`, `first baseline`), comma lists, named colors, and rejections for wrong order, too many values, unknown keywords and non-integer `z-index`.

Cost, tsc 5.9, `--extendedDiagnostics`:

| Check | Instantiations | Check time |
|---|---|---|
| one `padding()` call | 10 k | 0.14 s |
| one `color()` call, the largest grammar (148 named colors) | 98 k | 0.27 s |
| 100 calls over 10 properties | 183 k | 0.5 s |
| 200 calls over 10 properties | 197 k | 0.5 s |

Grammar parsing is paid once per property per tsc run and cached. The marginal cost is about 140 instantiations per call. For comparison, the whole generated-types approach checks 557 types in 0.6 s, so this is the same order.

What it took to make TypeScript accept it, in order of discovery:

1. `D["length"] extends 8` as a recursion guard resolves eagerly to the recursive arm, because the constraint of `D["length"]` is `number`. Compare the tuple by pattern instead: `D extends [0, 0, 0, 0, 0, 0, 0, 0, ...0[]]`.
2. Mapped types over `Node[]` such as `{ [K in keyof Xs]: Consume<Xs[K], S> }` expand `Consume` against the whole recursive `Node` union at declaration time. Walk tuples recursively instead.
3. Any recursive helper that calls back into the recognizer lives behind the indexed-object trick, `{ done: ...; next: ... }[cond]`, so the arm is not expanded until the index is known.
4. Long alternative lists are quadratic when accumulated with `[...Acc, x]`. `named-color` alone cost 1.1 M instantiations. The parser now reads the grammar string token by token with no token array, and alternatives are a cons list walked tail-recursively. That took `color()` from 1.19 M to 98 k.

Open items before this becomes the real API:

- Function arguments: `rgb(1 2 3)` and `calc(100% - 2rem)` are accepted without checking their inside. The grammar for them is in the same table, the recognizer needs a bracket-aware token split.
- Brands inside strings: a `ColorValue` from `token()` cannot be interpolated into a literal. Either `border("1px solid", accent)` with a second typed parameter, or `css.border\`1px solid ${accent}\`` with a tagged template, where the recognizer treats an interpolation as one token of the brand's type.
- `${number}` tolerates `"1 rem"`, as before. The build-time decoder through the same grammar catches it.
- Keyword case, escapes, and the `<custom-ident>` escape hatch are untouched.

This is the approach to continue with. The value stays CSS, the grammar stays mdn-data verbatim, the type layer is 200 lines with no generation step, and the same grammar string can drive the build-time check.

### tsc 5.9 vs tsgo 7 on the recognizer

Both are in the repo: `typescript@5.9.3` and `@typescript/native-preview@7.0.0-dev.20260316`. Same files, `--extendedDiagnostics`, wall time from `time`:

| Check | tsc instantiations | tsc check | tsc wall | tsgo instantiations | tsgo check | tsgo wall |
|---|---|---|---|---|---|---|
| one `padding()` | 10 k | 0.15 s | 0.60 s | 12 k | 0.012 s | 0.11 s |
| one `color()` | 98 k | 0.27 s | 0.65 s | 99 k | 0.074 s | 0.15 s |
| 100 calls | 183 k | 0.36 s | 0.75 s | 185 k | 0.118 s | 0.20 s |
| 200 calls | 198 k | 0.36 s | 0.76 s | 199 k | 0.116 s | 0.28 s |

tsgo checks the same types 3 to 4 times faster with identical results and identical error text. The probe passes on both. Instantiation counts match, so the type-level design is not tsgo-specific; tsgo just makes the fixed cost negligible. Note `tsgo` needs `--ignoreConfig` when files are passed on the command line next to a `tsconfig.json`.

### arktype research

arktype 2.2.3, `ark/type/parser`, about 850 lines for the string parser. What transfers to us:

**The dual API is one parser written twice, line for line.** Every step exists as a runtime function and as a type with the same name and shape: `parseOperator(s: RuntimeState)` next to `parseOperator<s extends StaticState, $, args>`, `parseUntilFinalizer` next to `parseUntilFinalizer<s, $, args>`, `Scanner.shiftUntil` next to `scanner.shiftUntil`. Both operate on the same state record: `{ root, branches, groups, finalizer, scanned, unscanned }`. The type version is `StaticState`, the runtime version is `RuntimeState`, and the transitions are the same transitions. That is the discipline that keeps the two from drifting: you do not port the runtime to types, you write each transition twice in adjacent lines.

For us this means the grammar parser and the recognizer in `packages/css-grammar/src/css.ts` get a runtime twin with the same node shapes, and the build-time check through the runner is the twin, not LightningCSS or Effect Schema. One grammar table, one parser design, two executions.

**Parsing is a shift-reduce machine over the raw string, no token array.** `Scanner.shift<lookahead, unscanned>` is the one-character `${infer L}${infer R}` pattern; `shiftUntil` accumulates into a string, not a tuple; state advances by rewriting `unscanned`. This is exactly the change that took our `color()` from 1.19 M to 98 k instantiations, arrived at independently. Operators are dispatched on a single lookahead character with a chain of conditionals, which is cheap.

**Errors and completions travel as string types through the state.** `ErrorMessage<msg>` is the message literal plus a zero-width space brand, `Completion<text>` likewise. When the parser fails it sets `finalizer` to the message and the whole result becomes that string, so `type("strin")` reports `"'strin' is unresolvable"` as the parameter type and offers completions. We already return a message literal from `Valid<P, S>`; the arktype version threads it from the exact failure point, which would let `border("1px solud")` say `'solud' is not allowed here` instead of dumping the grammar.

**Measured instantiations are a test.** `attest` asserts instantiation counts per expression in the test suite, with a baseline expression subtracted. Our bench numbers should live in a test the same way, so a grammar edit that regresses `color()` back to a million fails CI.

What does not transfer: arktype's language is small and designed for the parser, with a fixed operator set and definitions that fit in a few tokens. CSS grammars are bigger, ours are data we do not control, and mdn-data has quirks we saw already (`<x>` unknown in `cursor`, recursive `calc-sum`). Their `$` scope and generic-instantiation machinery are irrelevant here.

Decision for the spike direction: keep the recognizer, add the runtime twin in the arktype style, and measure with tsgo as the primary target while keeping tsc 5.9 green.

### Reference: css-typed-om polyfill (bramus)

`css-typed-om` 1.0.0 implements CSS Typed OM Level 1 in 7.5 k lines of TypeScript, tested against WPT (12476 of 13134 passing, August 2026). The README says it is mostly generated with Antigravity from the spec and the tests.

What it has: a spec CSS tokenizer (`src/parser/tokenizer.ts`), a numeric parser with `calc()`, `min()`, `max()`, `clamp()` and calculation simplification, the value classes (`CSSUnitValue`, `CSSMathSum`, `CSSKeywordValue`, `CSSColorValue` family, `CSSTransformValue` family, `CSSUnparsedValue` for `var()`), and `toString()` serialization back to CSS text.

What it does not have: property grammars. `CSSStyleValue.parse(property, text)` validates by setting the value on a dummy element's style and checking whether the browser kept it. In Node the dummy is a stub and every value passes. So it is not a recognizer.

Where it fits. It answers the open question about brands inside strings. Typed OM is the standard object model for CSS values: a length is `CSSUnitValue(4, "px")`, `calc()` is `CSSMathSum`, a color is `CSSRGB`, and every value serializes to CSS text. So the constructors in our API become standard objects, `CSS.px(4)`, `CSS.rem(1)`, `new CSSMathSum(...)`, instead of invented brands, and `ColorValue` is `CSSColorValue`. The runtime twin of the recognizer gets the standard signature `CSSStyleValue.parse(property, text)` and does the part the polyfill delegates to the browser: check `text` against the mdn-data grammar and return typed values instead of keyword stubs. Since browsers ship the same API natively, the test suite can compare our parser with Chrome's `CSSStyleValue.parse` on the same strings.

The layering this produces:

| Layer | Standard | Ours |
|---|---|---|
| Grammar | mdn-data value definition syntax, verbatim | type-level recognizer, runtime twin |
| Values | CSS Typed OM | constructors and `toString()` |
| Build | Vite Module Runner | instrument, evaluate, replace |

Only the recognizer is invented.

## Runtime twin of the recognizer

`packages/css-grammar/src/twin.ts`, about 290 lines. It is the same lexer, parser, and recognizer as `css.ts`, written as functions with the same names in lower case (`Next`/`next`, `Parse`/`parse`, `Consume`/`consume`, `Valid`/`valid`) and the same node shapes. Two differences: alternatives are a flat list, because the cons list only exists for tsc, and `type` nodes keep their numeric range. `consume` returns the set of possible remainders, like the union in the types.

**Where the twin is stricter than the types.** It checks ranges such as `<length-percentage [0,∞]>` on the consumed number, uses a real CSS number pattern (so `"1 rem"` is rejected for the right reason), checks hex digits, rejects empty idents, and repeats `*`, `#`, and `{m,∞}` to a fixpoint instead of stopping after 8.

**Errors come from the failure point, in both twins.**

- Runtime: the furthest failing leaf wins. Its position is where the value went wrong. Its labels are what the grammar expected there, named by the outermost `<type>` so the message says `<color>` and not 148 color names. A remainder left over when the grammar ends counts as expecting `end of value`.
- Types: the shortest remainder is the furthest point reached. Every remainder is a suffix of the value, so the shortest is the one that every other remainder ends with. This check is a one-line distributive conditional.

| Value | Types say | Twin says |
|---|---|---|
| `border("1px solud")` | `unexpected "solud" in "1px solud", grammar <line-width> \|\| <line-style> \|\| <color>` | `unexpected "solud" ..., expected <line-style> \| <color> \| end of value` |
| `padding("1rem 2rem 3rem 4rem 5rem")` | `unexpected "5rem" ...` | `unexpected "5rem" ..., expected end of value` |
| `padding(-space.md)` | not visible to types | `unexpected "-1rem" ..., expected <length-percentage [0,∞]>` |

**Cost of the better type message.** A plain false branch made tsc run `Consume` over the generic `S` once per property, which added 21 k instantiations for each property. `NoInfer` and the indexed-object trick did not help, and the indexed-object trick also broke inference (`S` widened to `string`). Wrapping the message in `S extends string ? ... : never` keeps it deferred. The result is +5 k per property and nothing per call. 200 calls went from 198 k to 209 k instantiations (tsc 0.39 s, tsgo 0.13 s).

**One case table.** `cases.ts` holds `[property, value, expected]` rows. `probe.ts` checks them with the types through a mapped type over the table. On a mismatch, the compile error names the disagreeing `[property, value]` pairs. `check.ts` (`node check.ts`, Node 24 strips types) checks the same rows with the twin, plus the rows that only the runtime rejects and the error texts. Both pass on tsc 5.9 and tsgo.

**Wired into the runner.** `packages/cssints/src/macro.mjs` calls `valid(prop, value)` for every declaration in `classesOf`. That covers both `css.*` calls and `cv()` configs. `mdn.ts` is regenerated for all 48 properties the runner emits (57 properties and 143 syntaxes with references). All 7 fixtures pass. The new `fixtures/invalid.ts` fails at build time with the two messages above. `app-react` builds, and every declaration in it passed, including `box-shadow`, `transition`, `font-family` lists, and `border` shorthands. The twin does not reach the client bundle.

**Found on the way.**

- The type lexer read `{3} , <x>? )` as one range, because `{${Lo},${Hi}}` matches across the `}`. It is now fixed in both twins by reading `{...}` first and splitting on the comma. This also lowered the 200-call count slightly.
- The runtime parser cannot parse `calc-sum` and `calc-product`, because of quoted literals like `'+'`. The type lexer silently stops at the same point. Both syntaxes are opaque today, so this only matters for step 3.
- The TS `fn` rule and the opaque rule stop at the first `)`. The twin mirrors this, so `calc(1px + (2px))` behaves the same way in both. The fix belongs with function arguments.

### Next

1. Function arguments: a bracket-aware split in both twins, quoted literals in the lexer, and then `rgb()`, `color-mix()`, and `calc()` checked inside. `calc` stays opaque at type level if the cost is too high; the twin checks it at build time either way.
2. Brands inside strings through Typed OM objects: a second typed parameter versus a tagged template.
3. An instantiation-count test in the style of attest over `bench/`, run with tsc and tsgo.
4. File the three wyw-in-js issues.
5. Commit.

### Instantiation budgets

The type-level cost of the recognizer now has a regression test in the style of arktype's `attest`. `node packages/css-grammar/bench/budget.mjs` compiles every `bench/*.ts` file with tsc 5.9 and tsgo in parallel and reads the `Instantiations` count. It subtracts the `bench/empty.ts` baseline (about 13 k) and compares the result with `budget.json`. The test fails if a file goes over 110% of its budget or has the wrong number of type errors (3 in `err.ts`, 0 in every other file). The counts are the same on every run. The current net budgets for tsc and tsgo:

- one `padding` call: 1.5 k and 2.8 k
- one `color` call: 91 k and 93 k
- 200 calls: 195 k and 197 k

As a check, the `S extends string` guard in `Valid` was removed, and the test failed as it should: one `padding` call went to 4.2 k, and 200 calls went to 277 k. After a deliberate change, run `node bench/budget.mjs --update`.

### Top-level DOM access in the runner

Modules evaluated for CSS extraction can now touch the DOM at load time, for example `document.title = …`. This is the same guarantee wyw-in-js gives with happy-dom, but without a vm context.

The plugin runs its own Module Runner (`createServerModuleRunner(ssr, { evaluator })`), and the `DomEvaluator` passes every happy-dom window property that Node lacks (`document`, `window`, `HTMLElement`, …) into the module body as a local binding. They never go on the real `globalThis`, so Vite, React and the app's own SSR runner still run in plain Node. `server.environments.ssr.runner` is not changed.

Two alternatives were rejected:
- Setting globals only while `runner.import` runs. Code that checks for a browser once at load time, such as react-dom's `canUseDOM`, could run inside that window and keep the wrong answer. Concurrent imports would also race.
- Prepending bindings when instrumenting. That changes real SSR modules too.

Known limit: dependencies in `node_modules` load through Node's own `import()` and do not get the DOM. The workaround is `ssr.noExternal` for such a package. A shaker is still not needed.

## Grammar-driven generator and three judges

`packages/css-grammar/test/gen.ts` is a third interpretation of the same parse tree. Instead of recognizing values, it generates them. Each node becomes a fast-check Arbitrary:

- `||` becomes a shuffled non-empty subset, and `&&` a full permutation.
- `{m,n}`, `#`, `*` and `+` become bounded arrays.
- Ranges bound the generated numbers.
- Function calls use one known-valid sample each until function arguments are modelled.

`node diff.ts` (about 3 s) puts the generated values, and simple mutants of them (a token dropped, duplicated, or rotated), in front of three judges:

1. **The twin**: it must accept every generated value. fast-check runs 200 values per property and shrinks any counterexample. All 57 properties pass.
2. **Chrome 154**, through `CSS.supports` in the installed browser (playwright-core, no download). It agrees with the twin on 1863 of 1950 values. Disagreements are reported but do not fail the run.
3. **The types**, on a sample. Each case becomes `const cN: Matches<...> = <twin verdict>` checked by tsgo, so every compile error is a disagreement. 456 of 456 agree. The one disagreement on the first run was a real bug: `<custom-ident>` matched an empty token at type level, so a trailing comma passed. That is now fixed, and the budgets did not change.

What Chrome found, sorted by cause:

| Cause | Examples | Where it goes |
|---|---|---|
| Comma omission rule (CSS Values 4 §2.6) missing everywhere | `background: red` rejected, `", red"` accepted | bug, before function arguments |
| `<custom-ident>` too loose | `font-family: "a" "b"` accepted | bug |
| mdn-data lacks spec ranges | negative `flex-grow`, `gap`, `line-height`, `border-width` accepted | compare with `@webref/css` |
| Opaque functions stop at the first `)` | `light-dark(red, light-dark(red, blue) currentColor` accepted | function arguments |
| Browser support, not grammar | `fit-content()` on width, `anchor-center`, `match-parent`, `run-in` | draft: warnings from browser-compat-data |
| Prose rules outside the grammar | `transition` with `none` in a list, generic family as an unquoted family name | same draft |

The comma bug shows the limit of the self-check. The generator and both recognizers read the grammar the same wrong way, so they agreed with each other. Only an outside judge could see it.

### wyw-in-js issue drafts

Dropped. cssints does not use wyw-in-js, so the drafts and repros were deleted with `spikes/wyw` without being filed. Bug 3 is already fixed upstream in open PR #427.

### Grammar source: mdn-data, with ranges from @webref/css

`@webref/css` 8.7.5 holds the grammars that W3C tooling extracts from the specs. Of our 200 grammars:

- 116 are identical to mdn-data.
- 2 differ only in ranges.
- 9 exist in webref under other names.
- 73 differ in other ways: cosmetic changes, restructured types, and spec-draft syntax that Chrome does not ship (`grid-lanes`, `contrast-color()`, `device-cmyk()`).

A full switch would only move the Chrome disagreements. The twin parses 1384 of webref's 1396 grammars; all 12 failures are quoted delimiters, the same gap as `calc-sum` under mdn-data.

Decision: keep mdn-data verbatim, and copy a range only when webref's grammar with the same name uses that type with that one range. A range on a union type such as `<length-percentage>` also applies to its members. This adds `[0,∞]` to `flex-grow`, `flex-shrink`, `row-gap`, `column-gap`, `line-height` and `<line-width>`. Both packages are pinned and named in the `mdn.ts` header. Agreement with Chrome went from 1863 to 1892 of 1950. The one negative value left is `transition: linear -100s`: both sources put the range only on the `transition-duration` longhand. The budgets did not change. `node scripts/extract.mjs` with no arguments regenerates for every property in the runner's `PROPS`.

## Typed OM values inside CSS strings

A property function takes several parts, each a plain string or a Typed OM style value, joined by a space: `border("1px solid", accent)`, `padding(CSS.rem(1), CSS.rem(2))`, and still `padding("1rem 2rem")`.

Tagged templates were checked and rejected. With tsc 5.9 and tsgo alike, the `strings` of a tagged template are plain `TemplateStringsArray`, and a plain template argument widens an object value to `${string}`.

The values (`packages/css-grammar/src/values.ts`) are small classes in the Typed OM style: `CSSUnitValue`, `CSSColorValue`, and `CSS.px`/`rem`/`em`/`percent`/`number`. They serialize with `toString()`, and their static type records the CSS type.

- **Types:** each value is one sentinel token, `⟨length⟩` or `⟨color⟩`. The token matches that type's primitive, the primitives that include it, or a named syntax of the same name. This needed two small edits in `css.ts`, and `api-typed.ts` joins the parts.
- **Build time:** the real text is joined and checked by the twin.

Unused, the cost is under 1% on the existing budgets. `typed.ts`, with 20 calls, is budgeted at 137 k for tsc and 139 k for tsgo.

A bad part names its token, as in `border: unexpected "⟨length⟩" in "1px solid ⟨length⟩"`, but the error is reported on the first argument. A top-level `CSS.rem(1)` in a module that imports `CSS` from `cssints` still fails in the plugin, which treats every call on a `cssints` import as a style site.

## Grammar fixes found by the Chrome judge

- **Comma omission (CSS Values 4 §2.6).** A grammar comma is skipped when nothing was written since the start of the sequence or since the previous comma. A comma that has nothing after it is rejected. This is fixed in both twins and the generator. `background: red` now passes, and `, red` and `none,` fail. It is tracked over all parse paths at once, not per path, which is an approximation.
- **`<custom-ident>`.** The twin uses a real identifier pattern and rejects the CSS-wide keywords and `default`. The types reject tokens that start with a quote, a digit, `#`, `.`, `+` or `(`, and the same keywords. Keywords that one property forbids are the prose-rules layer's job.
- **Function arguments.** `name( args )` is now parsed with its argument grammar and consumed recursively. Quoted operators (`'+'`) are supported, and `X#{3}` is counted correctly. The opaque list is gone: `calc-size()`, `anchor-size()`, `light-dark()` and the color functions are checked at both levels. A `<name()>` type first tests for `name(`, so `<color>` stays cheap for `red`. The generator builds calls from the grammar instead of using samples.
- **Cost.** A generic `Consume` reference costs about 1.3 k instantiations per helper even when unused, so helpers keep one. Function arguments added 4–6%. Merged with typed values, 200 calls now cost 205 k (tsc) and 207 k (tsgo).
- **Still open:** units inside calc are not checked, the `!` multiplier is ignored, `<url>` is missing from `mdn.ts`, and quoted strings with spaces break the value tokenizer. Chrome accepts an unclosed `(` at end of input, and we reject it on purpose.

## Beyond grammar: browser support and prose rules

Some values that Chrome rejects are valid by the grammar, for two reasons.

**Browser support: warnings.** `packages/css-grammar/src/support.ts` looks up the property, then each keyword and function name of the value, in `@mdn/browser-compat-data` 8.1.3:

- the property itself as `css.properties.<p>`;
- a keyword as `css.properties.<p>.<k>`, then `css.types.<T>.<k>`;
- a function as `<f>_function`, then `css.types.<f>`, then `css.types.<T>.<f>`.

`T` is limited to types the property's grammar can reach; otherwise `overflow: scroll` would hit an unrelated timeline type. Targets come from browserslist `defaults`, or the `BROWSERSLIST` env var. Only the plain form counts (no prefix, alternative name or flag), and missing data never warns. The plugin prints these with `this.warn` and never fails the build.

**Prose rules: errors.** `packages/css-grammar/src/rules.ts` holds validity rules written in spec text, not in the grammar, and throws like the twin:

- `transition`: `none` is valid only in a one-item list (css-transitions-1 §2.5).
- `font-family`: no generic or CSS-wide keyword inside an unquoted family name (css-fonts-4 §2.1.1). This is stricter than Chrome, which checks only the first word.

After merging with the grammar fixes, 66 generated values are accepted by the twin and rejected by Chrome 154:

| Explained by | Values |
|---|---|
| a support warning | 27 |
| a prose rule | 14 |
| nothing yet | 25 |

The 25 include:
- BCD gaps (`run-in`).
- A BCD–Chrome disagreement (`align-items: anchor-center`).
- Ranges missing inside newly generated function arguments (`steps(-94)`, a negative `box-shadow` blur).

The demo builds with one noisy warning: `cursor: pointer` on iOS Safari, where BCD marks every `cursor` value unsupported.

### Chrome triage: nothing unexplained

`diff-support.ts` now gives a reason for every value that the twin accepts and Chrome 154 rejects. The same holds on seeds 1–8, 99, 123, 555 and 1000.

| Reason | Values |
|---|---|
| support warning | 27 |
| prose rule | 24 |
| known, not ours | 11 |
| unexplained | 0 |

New prose rules:
- `calc-size()` arguments must be lengths or percentages, checked by a small calc type checker.
- `steps()` needs at least 1 step, or 2 with `jump-none`.
- `anchor-size()` is allowed only in sizing, inset and margin properties.
- `transition` cannot have two negative times, and cannot put an easing keyword before `steps()`.

The known list (`KNOWN` in `diff-support.ts`):
- BCD has no `display: run-in` or `inline-list-item`.
- mdn-data and BCD keep `align-items: anchor-center`, which the spec allows only on `justify-self` and `align-self`.
- The mdn-data `box-shadow` grammar cannot carry webref's non-negative blur range.
- The spec allows `linear()` with one stop, but Chrome and WPT require two.

Both parsers now enforce `!` (the group must not be empty), so `image()` fails. That check costs about 1.1 k in the fixed baseline and nothing per call.

Support warnings are quieter:
- A target that lacks the whole property gets one property warning.
- Values are also looked up under longhands reached through `<'q'>`.
- Each warning prints once per build.

`cursor: pointer` still warns for iOS Safari, because BCD marks 34 `cursor` values unsupported there while the property itself is supported.

## Quint: the runner's HMR, checked

We had claimed the engine's HMR was correct by construction. It was not.

**The model.** `packages/cssints/test/spec/runner.qnt` (~200 lines) models the plugin in a dev server. Its state holds:
- file versions and the ssr module graph;
- runner fetches in flight and the runner cache;
- the process-global registry and `depsOf`;
- Vite's client cache with both kinds of invalidation.

Each step is one stretch of JS between awaits, so concurrent requests interleave. The main invariant `servedFresh` says that once nothing is in flight, every client module serves classes from the current sources. `readsOwnSites` and `depsOfKnown` guard the registry and the wyw failure mode.

**Two real races in the old plugin**, both reproduced against a real dev server in `spec/race.mjs`:
1. A token edit during a module's first transform was lost, because `depsOf` did not know the module yet.
2. After two quick saves, transforms joined the runner's own HMR fetch of the older source.

The wyw bug (only the first importer updates) cannot happen here: `depsOfKnown` holds in both versions.

**The fix:**
- Evaluations are serialized with a semaphore and start from a cleared runner.
- The runner's HMR is off.
- `hotUpdate` also invalidates transforms in flight.

The cost is that every transform re-evaluates the cssints library. After the fix there was no violation in one million traces of 60 steps (Rust backend, 2.5 min). Apalache found the old counterexample at depth 12, but took 14 min, so it was not used further.

**Model-based test.** `spec/mbt.mjs` replays model traces against a real dev server, holding every ssr transform until the trace releases it, and compares what each module serves after every step. It passes on the fixed plugin (10×8 in 6 s) and fails on the old one. It first used `@firfi/quint-connect`, but after the move to one bun workspace its Effect 3 peer got linked to Effect 4 depending on install order, so `mbt.mjs` now runs `quint run --mbt --out-itf` itself and replays the ITF traces directly (no quint-connect, no Zod; `QUINT_SEED` reproduces a run).

### Value constructors are sites

`new CSSColorValue(...)` and a top-level `CSS.rem(1)` are now instrumented like `css.*` calls. At build time they evaluate to objects, as before, so the twin checks real values. In the client the call is replaced by its CSS text: `export const accent = "#3b82f6"`, `const gap = "1rem"`. This closed two gaps:
- A top-level `CSS.rem(1)` used to fail with "site did not produce a css.* value".
- A token module that only did `new CSSColorValue(...)` had no sites, so it passed through untouched. Its `import { CSSColorValue } from "cssints"` then pulled `macro.mjs`, with the twin and BCD, into the client.

Values used at runtime are strings in the client. `toString()` gives the same text, but `.value` and `.unit` are gone there.

## Repo layout (2026-09-29, cssints-vq75)

The spikes became workspace packages in one bun workspace. The old approaches were deleted; they are in git history before this change.

| Now | Was |
|---|---|
| `packages/cssints` (`src/`: plugin and library, `test/`: fixtures, spec, hmr app) | `spikes/runner` |
| `packages/css-grammar` (`src/`, `test/`, `bench/`, `scripts/extract.mjs`) | `spikes/typelevel` |
| `apps/demo` | `spikes/runner/app-react` |
| `packages/variants` | `packages/cssints-variants` |
| `docs/research/`, `docs/archive/` | `docs/*.md`, `docs/superpowers/` |
| deleted | `packages/lightningcss-napi`, old `packages/cssints` (Parcel), `apps/demo` (oxc-macro), `apps/tsdown-demo`, `spikes/typegen` |

`@cssints/css-grammar` exports its sources directly (`@cssints/css-grammar/twin` → `src/twin.ts`); `macro.mjs` imports it by name instead of `../../typelevel/`. Budgets and the `mdn.ts` output did not change.

The `spec/mbt.mjs` gap under bun's isolated linker is fixed by dropping quint-connect (`cssints-wiqx`).

## CSS output: what atomic libraries do (cssints-wx85)

StyleX, Panda, Tailwind v4 and UnoCSS each ship one global stylesheet and sort every rule in it, so the cascade does not depend on the order modules load. vanilla-extract emits CSS per file, as we do today. It has no duplicates to remove, because each class belongs to one file, and it relies on import order.

In our demo build, LightningCSS minify on the output file already removes rules repeated across modules (85 → 70) and keeps the `@layer` order, as long as `layers.css` comes first. Per-module CSS cannot fix order inside one layer. Two breakpoints in `_.c`, or `p(4)` and `pl(2)` in `_.a`, resolve by the order Vite joins modules.

Recommendation: one global sorted virtual sheet. Sort by:
1. layer;
2. condition (min-width ascending, then pseudo order);
3. shorthand before longhand;
4. class name.

It stays a Vite CSS module, so LightningCSS and reload-free HMR come from Vite. The build fills it after all modules are transformed: a placeholder filled in `renderChunk`, as UnoCSS does, or evaluating every file in `buildStart`. We lose per-chunk CSS, which none of these libraries keeps by default. Details: `docs/research/css-output.md`. The final decision belongs to the "CSS output pipeline" ticket, together with conditions and layers.

## Engine cost at scale (cssints-grrd)

The benchmark uses generated React apps with 50, 200 and 500 modules (`packages/cssints/test/perf.mjs`). Evaluation is about 90% of the plugin's time. It grows linearly, because modules are evaluated one at a time since cssints-hdui.

About 60% of each evaluation re-ran the cssints library. Every runner clear threw away css-grammar's module bodies and twin.ts's grammar cache, so grammars were parsed again in cold code. BCD and browserslist were never the cost: Node's `require` loads them once per process.

The plugin now clears only app modules and keeps the library's import closure (`clearApp`). The cost per module halves, from about 18 ms to 9 ms. A 500-module `vite build` drops from 9.7 s to 4.7 s, and the output is byte-identical.

`runner.qnt` did not change: the model contains only app files, and the library imports none of them. The fixtures, race.mjs, the HMR tests and mbt still pass.

Keeping unchanged app modules too would remove most of the remaining cost, but it reopens the race surface of cssints-hdui. We leave it until 9 ms per module is too slow. Details: `docs/research/engine-cost.md`.

## The 0.1 authoring surface in the engine (cssints-7fdc)

The plugin finds build-time code by the import attribute, not by package name. Any import `with { type: "cssints" }` marks its names as build-time, whether it comes from cssints, another package or a local helper module. Calls to helper functions run in the Module Runner like `css.*` calls, and they must return a css value, a `cv` config or a Typed OM value.

Importing a build-time member of cssints without the attribute is a build error. The error names the file and gives the fixed import. Only `cx` and `_cv` are runtime.

Property names come from the grammar's property list (camelCase) plus `p/pt/pr/pb/pl`, `m/mt/mr/mb/ml` and `bg`. There are no static exports per property. In the build-time code the plugin rewrites a named import to read from the `css` Proxy, so named imports work only through the plugin.

A bare number is a 0.25rem step only in padding, margin, inset and gap properties.

`flex()` and `grid()` set `display` and chain only their container properties, from short lists in `lib.mjs`. `test/contexts.mjs` fails when mdn-data adds a container property that is not listed. Plain styles do not chain.

Calls inside functions now go into an exported `__cssints_hoisted()`, which runs only for the file being compiled. That lets helper modules whose calls use their own parameters load normally as dependencies.

The demo's CSS is byte-identical after the migration. `grid().templateColumns(...)` and the other grid template methods still fail with "no grammar for this property" until the grammar covers every property (cssints-unkt).

## Single runtime and typed cv (cssints-e2nn)

`cssints` is the only runtime package. `packages/variants` is deleted. `cx` and `_cv` in `runtime.mjs` are the only code shipped to the browser. `cx` flattens nested arrays and skips falsy values, and its hand-written types are in `runtime.d.mts`, because TypeScript looks for `.d.mts` next to an `.mjs` file.

`cn` is build-time only, and no `cn` or eval-time code reaches the demo bundle.

`cv` takes css values for `base` and for every variant: one property, `cn(...)` or a `flex()` chain. The old CSS-string form is a build error that shows the new form. The demo's `Card` was migrated, and its CSS is byte-identical.

## One global sorted stylesheet (cssints-vzd9)

The CSS output is one stylesheet, `virtual:cssints.css`, imported once from the app entry. It replaces `layers.css` and the per-module CSS modules. The plugin records each module's classes, and the sheet is their union, so every rule appears once.

Rules are sorted by:
1. layer;
2. condition, a slot that stays empty until conditions land;
3. shorthand before longhand, by the number of leaf longhands in mdn-data `computed`, so `border` comes before `border-top`;
4. class name.

So a longhand wins whatever the order of arguments to `cx`.

- **Dev.** A change to a module's rules invalidates the sheet, and Vite updates it without a reload. The browser drops an HMR update for a module that has not run yet, which left a cold page load with 0 of 70 rules. So the sheet now reports its version to the server, which re-sends it when stale.
- **Build.** The sheet is a placeholder until `renderChunk`. There the final sorted CSS goes through Vite's own CSS plugins, as UnoCSS does it, so LightningCSS and minify still come from Vite.
- **Targets.** The LightningCSS targets come from the same browserslist query as the support warnings (`css-grammar/src/browsers.ts`). The demo also sets `build.cssTarget: false`, because Vite otherwise replaces the targets.
- **Model.** The Quint model covers the sheet. The new invariant `sheetFresh` says that once nothing is in flight, the rules of every module being served are in the sheet. A model with the stale-marking removed violates it. mbt compares the real sheet with the model at every step.
- **Demo.** The same 70 rules as before, now in one sorted file.
- **Known gaps:**
  - rules of a module deleted in dev stay until the server restarts;
  - forgetting `import "virtual:cssints.css"` gives no CSS and no warning;
  - sheet updates are not debounced.

## Design-token constraints and math (cssints-kag5)

DTCG 2025.10 has no constraints and no math. It is a static format: types, aliases, groups, and a resolver for modes. Its only checks are type validity, alias type match and no cycles. Colour functions, arithmetic and contrast rules are open issues (#88, #224, #268).

Ariakit's Tailwind plugin does not use `contrast-color()`. It derives layers with relative colours and `calc`. Text contrast comes from a WCAG table computed in JS when the plugin is built, and CSS picks a row with style queries. That needs about Chrome 138, Firefox 151 and Safari 18, and only `ak-ink` claims AA.

For us:
- The compiler can check what is static: value types, alias graphs, theme completeness, and the contrast of token pairs in each theme.
- Derived values (`calc`, `color-mix`, relative colour) and anything that depends on the DOM stay in CSS.
- `@property` initial values must be computationally independent, so aliases need a flattened literal plus a live `var()` declaration.

The research recommends typed tokens and themes first, then one build-time check, `css.check.contrast`, per theme. That is for the Themes ticket to decide. Findings: `docs/research/design-tokens.md`.

## Vite+ instead of turbo (cssints-ny2w)

The monorepo runs on Vite+ (`vite-plus` 1.0.0, the `vp` command), and bun stays the package manager. One root `vite.config.ts` holds the lint and format settings. `vp lint`, `vp fmt` and `vp check` replace the standalone oxlint, oxfmt and tsgolint. The root `test`, `bench` and `build` scripts run `vp run -r`.

`test` is cached, and css-grammar's steps hit the cache. cssints' tests never hit it, because they write temp apps under `test/`. Note that `vp test` is Vite+'s built-in Vitest; our script is `vp run test`.

The old `oxlintrc.json` was named without the dot, so oxlint never read it. With the real config, `vp lint` reports 1443 errors (1191 rule errors and 252 type errors), mostly `no-unsafe-*`, and formatting would change about 60 files. plugin-icon has three syntax errors that stop `vp fmt` and `vp check`. The TS + Effect port (cssints-djzw) makes this clean and must fix or drop plugin-icon. The demo CSS did not change.

## Grammar coverage: every mdn property (cssints-unkt)

With every non-obsolete mdn property the grammar has 636 properties and 256 syntaxes: 66.5 KB, 15.5 KB gzip. All 892 grammars parse.

What breaks today:
- Unit range bounds (`<time [0s,∞]>`) make the twin reject every `animation-duration`, `transition-duration` and `font-style oblique` value.
- The open repetition `#{2,}` breaks the types and the generator.
- 15 referenced types have no syntax and no primitive (`url`, `zero`, `resolution`, `flex`, …). 88 properties reach one of them, so `url(a.png)` and `1fr` fail.

Twin and Chrome agree on 84% of values over all properties, against 96.6% for the 57. Of the 2516 unexplained rows, 1696 come from nonstandard `-ms-`/`-moz-` properties.

Types: an unused big table costs 0 instantiations, and a call costs about 4.2 k. One outlier, `font-variant: "none"`, costs 4.3 M instantiations and hits TS2589. A one-line `[S] extends [never]` short-circuit in `AnyOrder` brings it to 51 k.

Decision: ship every standard and experimental property at once, with nonstandard ones out, after fixing the blockers above. Findings: `docs/research/grammar-coverage.md`.

## Surfaces and frames, Ariakit-style (cssints-1xqr)

Ariakit's parent-relative colour and concentric radius come down to two small kernels. A compiler can emit each once, and per-site classes then only set custom properties.

| Kernel | Size, minified | Ariakit | Floor (Chrome / Firefox / Safari) |
|---|---|---|---|
| Frame: radius, padding, border, margin | 40 lines, 667 bytes | about 4 KB | 111 / 151 / 18 |
| Surface: lighten, darken, contrast against the parent | 29 lines, 434 bytes | about 12 KB | 122 / 151 / 18 |

The frame kernel gives the same radii as Ariakit on a nested tree. Both were checked in Chrome at three depths.

Reading the parent is the one thing a compiler cannot do, so both kernels use Ariakit's odd/even `@container style()` trick, which sets the floor above. CSS Values 5 `inherit()` would remove the trick and cut the kernels to 12 and 6 lines. It is off by default in Chrome 154, not signalled in Firefox, and behind a flag in WebKit. A lightness step does not guarantee contrast: 4.61:1 on greys, but 3.71:1 on saturated colours.

Decision: not in 0.1. Later, an opt-in module: `frame()` first, then `surface()`. 0.1 keeps only a seam: a global rule by key in a cascade layer `_.k` below `_.a`. Findings: `docs/research/surfaces-frames.md`.

## Plugins and runtime polyfills (cssints-rq2r)

CSS Parser Extensions is one person's explainer, with no spec draft and no implementation, so we plan on nothing native. cssints does not need it: the compiler knows every class it emits, so a runtime polyfill does not have to parse CSS.

**Prototype.** The runtime for `frame()` and `surface()` on browsers without style queries is 730 B gzip (the container-query polyfill is 9.8 kB). It copies each parent's computed value into a custom property.
- **Correctness.** It matched the style-query version on 2088 values in Chrome 154, Firefox 155 and WebKit 26.6, across three depths, class toggles, inserts, `:hover` and a media query.
- **Cost.** About 10× the style-query CSS on 5 000 nested elements (about 120 ms in Chrome), but about 2 ms for a small change, so it ships only when a browserslist target needs it.
- **Floor.** Frames drop to Chrome 99, Firefox 128 and Safari 16.4. Surfaces gain only Firefox 128–150, because relative colour still sets their floor.
- **Name clashes.** Two plugins' kernels must not share custom-property names, which should be a build error; the prototype broke every radius that way.

**Contract.** A plugin is a build-time module of members (property, style, chaining context, function) plus kernels emitted once by key into `_.k`. It may declare a runtime as data, chosen by BCD, and delivered through a per-plugin virtual module that is empty when no target needs it. Plugin grammar strings feed the existing type-level recognizer unchanged. Icons fit as one mask kernel plus one class per icon, but they need the engine to accept a plugin value (a function) at an attributed site. The five live WebKit-only properties stay a built-in list: LightningCSS passes them through, and they need no behaviour.

Recommendation: no public plugin API in 0.1, only the internal seams (kernel by key in `_.k`, markers on the style node, a BCD `lacking()` helper) and the WebKit list. In 0.2 comes the public contract, with `frame()` and icons as the first consumers. `surface()` comes later. Findings: `docs/research/plugins.md`, prototype in `docs/research/plugins-proto/`.

## The engine in TypeScript and Effect (cssints-djzw)

`packages/cssints/src` and `packages/css-grammar/src` are `.ts` files that Node runs by type stripping. Every exported function returns an Effect with tagged errors (`Data.TaggedError`; beta.107 has no `TaggedErrorClass`).

The exceptions are what user code calls in expressions: the `css.*` builders, the Typed OM values, and `__at`/`__site` around each site, which run one Effect at that synchronous edge. The lexer, recognizer, class hash and AST walk stay plain code inside Effect boundaries.

**Cost.** A traced `Effect.fn` costs about 4 µs, so per-declaration and per-site code is `Effect.fnUntraced`, with one boundary per site. The per-module cost stays within about 10% of before (eval median +4..8%).

**Correctness.** The await points did not move, so the Quint model still holds; it was re-run, and so was mbt.

**Errors.** A failing `css.*` call reaches Vite as a tagged error with `loc`, so the overlay points at the user's call (`fixtures/invalid.ts` line 6, column 17). `cv()` became lazy, so its config is checked at its site.

**Tooling:**
- User code gets types from `src/types.ts` and the generated `src/members.ts`.
- `bun run typecheck` runs `tsgo` plus `effect-tsgo diagnostics` in each package. `@effect/tsgo` 0.45 patches native TypeScript 7 in `prepare`, which takes over `.bin/tsc`, so the TypeScript 5.9 checks call it by path.
- `vp pack` builds both packages.
- `vp lint` is clean for the repo, and `vp fmt --check` is clean for cssints, css-grammar and the demo.
- The demo's CSS is byte-identical.

## Conditions and layers (cssints-mjgx)

Wrappers take styles and return styles, and they nest: `media(q)` (as a string, a tuple or an object), `container(q)`, `supports(q)`, and 49 pseudo-class wrappers from mdn-data selectors (`hover`, `focusVisible`, …).

- **Layers.** A style's layer is its number of conditions, from `_.a` to `_.e`. A fifth condition is a build error located at the call site.
- **Classes and rules.** The class hash includes the condition chain. The sheet emits one at-rule block per chain per layer, ordered by min-width, then by pseudo-class order. Min-width is read from `(min-width: X)` or `(width >= X)` in px, rem or em.
- **Bindings.** `const md = media(…)` and its destructured forms are site roots. In the client the binding becomes `null` in the same shape.
- **Query checks.** Query strings are checked in types (`query.ts`) and at build time against `<media-query-list>`, `<container-condition>` and `<supports-condition>`. The grammars come from webref first, because its `<media-condition>` is linear, with mdn-data filling the gaps. There is no `<general-enclosed>`, so an unknown feature is an error, not "false".
- **Gaps:** `supports()` accepts only property declarations, and `style()` container queries do not accept custom properties.
- **Type cost.** With every standard property, a `supports()` call costs about 0.5 M instantiations, paid once per program, because `<declaration>` alternates over all properties.
- **Seam.** `@layer _.k, _.a … _.e;` and an internal `addGlobal(key, css)`.
- **HMR model.** Unchanged: wrappers are synchronous builders.
- **Demo.** A media query on the feature list and `hover` on buttons and cards, checked in Chrome: row layout at 1000 px, hover colour changes. Performance is unchanged.

## Every standard property (cssints-lmru)

The grammar holds every standard and experimental mdn-data property, 529 in all, and the cssints members follow it: 536 properties plus 49 pseudo-classes. To get there, the twin, the generator and the types learned:
- ranges with units;
- open repetition `{A,}`;
- the missing primitives (`url`, `zero`, `resolution`, `flex`, `ident`, `hash-token`, `declaration-value`, `intrinsic-size-keyword`);
- `<string>` scanned as a whole.

`AnyOrder` stops when a part failed. That took `font-variant: "none"` from 4.3 M instantiations and TS2589 to about 50 k. An unused table still costs 0.

**Against Chrome 154.** 16 731 of 18 215 values agree (91.8%). There are 0 unexplained twin-accepts rows, down from 826:
- 128 became prose rules and 17 support lookups;
- the rest are in KNOWN with their upstream cause: mdn-data stale or wider than the spec (324), BCD gaps (206), spec grammar as written (73), Chrome differs (71), `linear()` (7).

Types and twin agree on all 4232 sampled rows. Numeric ranges are skipped there, because types strip them by design.

**`<declaration>` in types.** When merged with conditions, `<declaration>` inside `supports()` and container `style()` alternated over all 529 properties: 581 k instantiations for 16 queries and 1.23 M for 7 `supports()` calls. The types now take a `<declaration>` as balanced tokens, and the twin checks the real declaration at build time. That brings them to 100 k and 27 k. `supports("(display: grdi)")` is now a build error, not a type error; `cases-queries.ts` lists it under `runtimeOnlyQueries`.

**Open:**
- The reverse direction (Chrome accepts, the twin rejects), mostly stale mdn-data grammars such as `image-orientation: none` and `tab-size: 3.5`; a follow-up could prefer the webref property grammar where mdn-data is stale.
- `attr(x type(<length>))`.

## Tokens (cssints-79xr)

`css.token.<type>(initial, name?)` gives a Typed OM value whose text is `var(--name)`, so it fits typed parts and single-part properties.
- **Checking values.** The twin knows no `var()`, so a value that uses a token is checked with each token swapped for a literal of its type.
- **Names.** A named token can be set. An unnamed one is private, with a `--_<hash of file and site>` variable, and setting it is a type error and a build error.
- **`@property`.** Each token adds one `@property` rule to the global sheet, after the layer statement and outside the layers, deduplicated across modules. A clash is a build error at the second declaration.
- **HMR.** A module records the `@property` text of the tokens it reads, so editing an initial value reaches the browser through HMR. The Quint model needed no change.
- **`style()` and `token.set()`** become an object literal at build time: custom properties first, values checked, no conditions.

**A spec rule that changed the design.** `@property initial-value` must be computationally independent, and Chrome drops the rule when it is `1rem`, `1em` or `1ch`. So a font-relative initial value is a build error, and API.md now writes `16px`.

**Left out for now:**
- `resolution`, `url` and `image`, whose grammars were missing when the branch started; they landed with cssints-lmru.
- Typed-part sentinels for `integer`, `angle`, `time` and `custom-ident` in `css.ts`.

In the demo, one token is read by a class and set in a `style` prop, and both were checked in Chrome. Perf and budgets are unchanged apart from the new `tokens.ts` bench.

## `<color>`: relative colour, contrast-color(), if(), var() (cssints-gcuz)

`<color>` accepts relative colour (`oklch(from var(--x) l c h)`), `contrast-color(<color>)`, `if()` and `var()`. The `from` forms and `if()` come verbatim from @webref/css, which has css-color-5 and css-values-5; mdn-data 2.27.1 has neither. The few overrides are documented in `extract.mjs`: `contrast-color( <color> )` from css-color-5, `<custom-property-name>` and `--x : <declaration-value>` in `<declaration>`.

**Twin.** The twin checks what the grammars do not carry:
- Channel keywords exist only inside the colour function that has a `from`.
- `calc()` or `var()` may stand for a number there, and `calc()` is type-checked against its position, so `calc(h + 30deg)` is rejected, as in Chrome.
- `if()` branches go through the same condition grammars as `@media` and `@supports`.

**Types.** Types stay opaque after `from` and inside `if()`: checking them would need calc typing and a channel scope through every `Consume`. The cost is about +1% on the colour benches.

**Chrome and BCD.** Chrome 154 agrees on every generated value (91.4% overall, since mutants with `var()` or `if()` always pass in Chrome). The BCD lookups for `contrast-color`, `if` and `relative_syntax` warn for Firefox and Safari targets.

**Limits:**
- `if()` and `var()` exist only in `<color>`. A value-level pending-substitution rule is the general fix.
- `min()`, `max()`, `clamp()` and nested `calc()` in channel positions are not accepted yet.

## Typed public surface (cssints-v63t)

User code gets the grammar check on every property call. Each of the 536 members is generated as `Prop<"property">`: a variadic function that checks its parts against the mdn grammar through `Valid` and returns a branded class string, `Style`.
- **Parts:** strings, Typed OM values, and a lone number, which is a spacing step in `padding*`, `margin*`, `gap*` and `inset*` and a `<number>` elsewhere. A `Style` passed as a part is a type error, matching the build-time error.
- **Chains:** `flex()` and `grid()` chain methods are typed with their properties.
- **Only `Style` accepted:** `cv` config values, `cn`, `style` and the condition wrappers take only `Style`, so `cv({ base: "padding: 1rem" })` is a type error.
- **Demo:** it type-checks with tsgo and tsc 5.9 (`bun run typecheck`) and needed no fixes.

**Cost.**
- The demo check goes from 171 k to 554 k instantiations (tsc), and from 0.22 s to 0.36 s (tsgo).
- About 100 calls cost 710 k (`packages/cssints/bench/users.ts`, budgeted).
- An edit to `Button.tsx` gets diagnostics in about 200 ms over tsgo's language server (`bench/lsp.mjs`).
- A file that only imports `cssints` adds about 1 k.
- Shipping `.d.ts` instead of `.ts` sources would spare users' `skipLibCheck` builds; that belongs to publishing.

**Limits.**
- The error lands on the first argument of a call, not on the bad part.
- `calc()`, `min()`, `max()` and `clamp()` are not in the recognizer yet: `width("calc(100% - 2rem)")` fails in types and at build time alike.

## Themes and the contrast check (cssints-7qqw)

`createTokens` turns inline DTCG-shaped data into named tokens. `$type` is inherited through groups. `color`, `dimension`, `number`, `duration` and `fontWeight` map to token types, and other DTCG types are rejected with the list of supported ones. Aliases get the flattened literal in `@property` and stay live as `var()` on `:root`, with cycles and type mismatches as build errors.

`createGlobalTheme` re-declares the overridden tokens, and the aliases that depend on them, under:
- a media condition, on `:root`;
- a container condition, on `:where(*)`, because `:root` never matches a container query (checked in Chrome);
- or a selector.

Token and theme rules sit in `_.k`. They set custom properties only, so site classes still win. A module also carries the rules of every token it uses, because attributed imports are stripped from the client and the theme module would otherwise never reach the sheet.

`css.check.contrast` computes WCAG 2.x for the defaults and for each theme that affects the pair, at module evaluation and again at build end.
- Below `min` is a build error that names the theme and both values.
- Values it cannot read (`color-mix()`, `currentColor`, translucent colours) are warnings.

The colour maths is `culori/fn` (9.4 kB gzip) and is loaded only at build time; none of it is in the bundle. The demo has a dark theme checked in Chrome with `emulateMedia`. Perf and the Quint invariants are unchanged.

**Open:**
- `rem` dimensions are rejected, since `@property` needs a computationally independent initial value. A fix would flatten `rem` to `px` in `@property` and keep the live `rem` on `:root`.
- Themes are checked one at a time, not in combination.
- Theme selectors are not grammar-checked.

## Math functions everywhere (cssints-91im)

`calc()`, `min()`, `max()`, `clamp()` and the rest of the CSS Values 4 family (`round`, `mod`, `rem`, trigonometric functions, `pow`, `sqrt`, `hypot`, `log`, `exp`, `abs`, `sign`) are accepted wherever a `<number>`, `<integer>`, `<length>`, `<percentage>`, `<length-percentage>`, `<angle>`, `<time>` or `<resolution>` is.

**Twin.** The twin checks each call with one typed parser (`mathScan`) that follows the §10.7 type rules. It replaces the old `calcType` and serves calc-size() and relative-colour channels as well.
- `calc(100% - 2rem)` is a length-percentage.
- `calc(1px + 2s)` and `min(1px, 2%)` for a plain `<length>` are build errors, and the message says why ("cannot add length and time").

**Types.** The types check only the function name and balanced parentheses, which cost 0.04–0.24% on the budgets.

**Exceptions.** Numeric ranges are not checked on a math function, since browsers clamp. `<flex>` is left out, because Chrome rejects `calc(1fr)`.

**Chrome 154.** Generated math values agree 100% in a type-matching position. In whole-grammar values, 24–50 of 6 000–10 000 per seed differ, and Chrome is always the stricter side: parse-time range checks such as `cubic-bezier` x and a grid line that rounds to 0.

The demo uses `width("calc(100% - 2rem)")`, and the sheet test asserts it.

## Token types and typed-part sentinels (cssints-7rot)

Token types now cover every `@property` syntax type we support, `resolution`, `url` and `image` included. Chrome accepts a sample `initial-value` for each, through `CSS.registerProperty` and in a real stylesheet.

Every token fits the typed parts of its own type and no others. Two exceptions are deliberate:
- `⟨integer⟩` also fits `<number>`;
- `⟨url⟩` also fits `<image>`.

An image token does not fit a `<url>`-only position such as `marker-start`, at the type level or at build time; the build-time probe for an image is a gradient.

One bug went away: a length or colour token used to fit `<custom-ident>` positions such as `animation-name`. A relative `url()` in a `<url>` token resolves against the page, not the stylesheet (noted in API.md). The sentinels cost about +15 instantiations unused, and at most +180 on the widest bench.

## Built-in WebKit-only properties (cssints-6fay)

`extract.mjs` has a `LIVE_NONSTANDARD` list next to the standard and experimental selection. It holds `-webkit-tap-highlight-color`, `-webkit-touch-callout`, `-webkit-box-reflect` and `-webkit-user-modify`, with grammars verbatim from mdn-data. They become members and are checked by both twins.

All four are live in Chrome or Safari per BCD. `-webkit-overflow-scrolling` was dropped: it has no BCD entry, and Chrome 154, WebKit 26.6 and Firefox 155 reject it. `-webkit-user-modify` does not warn, because BCD files it under `user-modify` with a prefix, which the support lookup does not follow. Other prefixed properties come with the plugin API in 0.2.

## JSDoc on generated members (cssints-7pv1)

Every generated member carries a one-line JSDoc, so the editor hover explains the value. It holds:
- the property's grammar (from `mdn.ts`, so the enforced ranges show);
- the first version of Chrome, Edge, Firefox, Safari, iOS Safari and Chrome Android that supports it without a prefix or flag (BCD, through the lookup in `support.ts`);
- an MDN link.

Pseudo-class wrappers get the support row and the link. tsgo's hover does not show JSDoc on `flex()`/`grid()` chain methods yet, though tsc does. Instantiations did not change. `members.ts` grew from 35 KB to 142 KB. `node bench/lsp.mjs <file> <word>` prints a hover.

## Ship 0.1 (cssints-808j)

`bun run build` followed by `bun run pack:tgz`, in `packages/cssints` and in `packages/css-grammar`, produces two tarballs with only `dist/` (`.mjs` and `.d.mts`): cssints is 32 kB and css-grammar is 61 kB. The workspace still runs from sources: the top-level `exports` point at `src/*.ts`, and the published `exports` live in `publishConfig`. npm ignores that field, so `scripts/pack.mjs` stages `dist` with a merged manifest (`workspace:*` becomes `^0.1.0`) and runs `npm pack` on it.

`bun run test:smoke` is the release check. It installs the tarballs with npm into a fresh Vite 8 and React app, builds it with plain `vite`, and asserts:
- the CSS is right;
- the only library code in the client bundle is the browser runtime;
- tsgo and tsc 5.9 type-check the app, with `color("blu")` still an error.

With `skipLibCheck`, an unused import of cssints now costs 0 instantiations instead of about 27 k, and a real file costs 3–4% less.

Both npm names were unclaimed on 2026-09-30, but the `@cssints` scope must be created before publishing. Recommendation: publish 0.1.0 of both together, as tarballs, with no changesets yet. Neither package has a LICENSE or README yet.

## 0.1 docs and demo pass (cssints-gcho)

`docs/API.md` was rewritten against the code and the fixtures: real class names and sheet output, `cv` shown as `_cv(cv(...))`, and new sections on build-time arguments, helper modules, typed parts and math, and errors. The Browser Compat idea became a short note on what 0.1 has and lacks.

`packages/cssints/test/docs.mjs` type-checks every `ts`/`tsx` block of API.md and README.md against the workspace types. A trailing `// error` marks a line that must fail. On the old API.md it found 25 problems.

- **README:** setup and a 20-line example.
- **AGENTS.md:** corrected (Effect beta names, formatter and test notes).
- **Demo:** a feature tour covering every 0.1 feature, checked in Chrome with 51 checks at 500, 800 and 1200 px, in dark mode, with hover, active, focus-visible and a token set in `style`.

**Engine limits found, now documented and ticketed:**
- An unreached top-level `css` call fails: `false && p(4)` gives "site N was not evaluated".
- A top-level `_cv(...)` call fails at build time.
- A runtime value in a `css` call fails with "n is not defined", while the types accept it.
- The `flex`, `grid` and `container` shorthand properties have no member, since those names are the contexts and the condition.
- `createGlobalTheme(t, hover, …)` type-checks.
- `vp fmt` does not apply the `fmt` block of `vite.config.ts`.
- `race.mjs` failed once under load (`firstTransform … STALE`).

## webref against stale mdn-data grammars (cssints-h6qk)

We compared each of the 529 properties by behaviour against Chrome 154. webref and mdn-data behave the same on 302. webref is right where they differ on 40: it is narrower (9), wider because mdn-data is stale (26), or differs both ways (5). mdn-data is right on 3. webref describes syntax newer than Chrome on 86, and 90 are mixed.

The twin parses 1401 of 1403 webref grammars; the two failures are typos in webref.

| Variant | Agreement with Chrome | Chrome accepts, twin rejects | Budget |
|---|---|---|---|
| mdn-data (today) | 88.6% | 2300 | as is |
| webref for 47 properties | 90.0% | 1499 | +0.5% |
| webref everywhere | 84.6% | 1508 | +11 to +14% |

Switching everything would add draft syntax that Chrome rejects (171 properties), break curated cases and blow the budget.

**Recommendation: switch per property.** Take webref's grammar for a property when all of these hold:
1. both sources have it;
2. its closure parses and resolves;
3. the two grammars differ on a sample;
4. Chrome rejects every value that only mdn-data accepts, and accepts every value that only webref accepts;
5. the rule still holds when re-run on the assembled table.

Today that selects 47 properties. It ships as a committed list read by `extract.mjs`, plus a Chrome-backed script to re-run on every Chrome, webref or mdn-data bump. Findings: `docs/research/webref-grammars.md`. `extract.mjs` has a default-off `WEBREF=all|@list.json` switch.

## race.mjs flake: the harness, not the plugin (cssints-jwdw)

The flake seen under load (`firstTransform button served null STALE`) was a harness timing bug. `settle()` decided the dev server was idle after about 45 ms without a counted step. The last stretch of a transform counts no step: running the module in the runner, then import analysis. So under load `request()` returned before Vite had cached the transform, and the check read a module with nothing cached. That is exactly what `servedFresh` allows for a transform in flight.

It failed in about 1 of 100 runs with no load and 3 of 50 under load. `settle()` now also waits while a request is unresolved and nothing is held at a gate, and 200 runs under load pass. The plugin and `runner.qnt` did not change.

Lesson for harnesses: wait on the request's own promise or a gate, never on a quiet period alone.

## Build-time evaluation edge cases (cssints-wigi)

- **Unreached sites.** A top-level call the module run does not reach (`false && p(4)`, an untaken branch, a ternary arm) now gets its class string. The instrumenter also puts each top-level site in the hoisted pass, guarded by `__unseen`. The arguments of such a site may use module bindings, but not locals of the untaken block.
- **Top-level `_cv(cv(...))`** works: the eval-time `cssints` exports a tolerant `_cv`. The browser `runtime.ts` is unchanged.
- **Runtime values.** A runtime value in a css call (`p(n)` with `n` a parameter) fails with "css arguments must be known at build time: n is not defined where the call is evaluated", located at the call. A type-level ban on non-literal arguments cost +0.4% and also rejected parameterized helper modules, so it was dropped; the build error is the check.
- **`createGlobalTheme`** takes only `media()` and `container()` conditions or a selector. A `QueryWrap` brand makes `hover` and `supports()` type errors.

The intermittent mbt failure (the tokens-fetch mismatch) did not survive the `race` harness fix: 6 of 6 runs pass.

## Pending substitution: var(), env(), if() in any property value (cssints-xrzv)

A `var()`, `env()` or `if()` may stand anywhere in any property value. This removes the "only in `<color>`" limit of cssints-gcuz. Each call stands for zero or more component values, commas included, and the rest of the value is still checked:
- `padding: var(--a) 2px` and `margin: var(--a)` pass;
- `padding: var(--a) red` and `border: 1px var(--x) solud` are errors.

Chrome accepts all of these, so we are stricter on purpose.

**How the twin handles a call.** When a leaf fails at a call, the call may stand for that leaf, stay for the next one, or be empty. A call can also close a function or a value, and can hold the comma of a `#` list. In `||` and `&&`, a call at the head stands for any of the parts. That needed its own rule: it is 10–100× faster than a memoised version, and it is the only form the types can take without TS2589 on `animation`.

**Scope.** `env()` is included, because it is the same kind of substitution function. `attr()` is not: outside `content` it is typed. A call is checked by shape only; its fallback, its `if()` branch values and the `env()` name are not checked against the position. Tokens are unchanged, and the types follow the same rule.

**Cost:**
- +2–3% on the instantiation budgets;
- +6 k fixed when the sources are checked, and 0 from the published `.d.mts` with `skipLibCheck`;
- +16% on values made of calls.

Chrome 154 agreement is 91.4%, as before.

**Process note.** An earlier session of this ticket was reported crashed by the harness but kept running. It followed its directory through a `git worktree move` and committed to its branch. The work was finished on a fresh branch from the last clean commit, and the zombie's `anyOrder` idea was taken by hand after measuring. Lesson: after a harness crash, never reuse or move the worktree; give the retry a new branch in a new directory.

## Per-property webref grammars (cssints-pctg)

`extract.mjs` reads `packages/css-grammar/scripts/webref-properties.json` by default and takes webref's grammar for the 45 properties listed there. `WEBREF=none` gives mdn-data alone, byte for byte as before. `bun run webref` applies the rule, with Chrome as the judge, and rewrites the list in about a minute. Run it, then `bun run extract`, after a bump of Chrome, @webref/css, mdn-data or the twin.

Re-measured on the current twin, the list is 45, not 47:
- `all` and `z-index` left, because CSS-wide keywords are exempt;
- `flex` left, because its grammar text is the same in both sources;
- `pointer-events` joined.

Five small hand overrides live in `extract.mjs` (`image-orientation`, `column-rule-width`, `column-rule`, `zoom`, `outline-color`), and the script re-checks them against Chrome on every run.

| | Before | After |
|---|---|---|
| Chrome agreement | 91.4% | 92.2% |
| diff-support rows | 1317 | 1155 |
| KNOWN rows | 588 | 477 |

Ten obsolete KNOWN entries were removed. Budgets moved by at most 0.4%, and the demo build is byte-identical.

## flex("1") and grid("...") shorthands (cssints-okos)

`flex("1")`, `flex(1)`, `flex("1 1 0")` and `grid("auto / 1fr 1fr")` are the `flex` and `grid` shorthand properties, checked by the grammar. `flex()` and `grid()` with no argument stay the layout contexts. The two forms differ by argument count at build time and by overload in the types. The spacing-number rule does not apply to them, so `flex(1)` is `flex: 1`. `container` stays the condition, and its property is written `containerName`/`containerType`.

Cost finding: overloads written inline in the generated `members.ts` added about 17% to `unused.ts`, because every consumer checks that file as source. A generic `Layout<P, M>` in `types.ts` costs under 1%. A member with a special call shape should be declared through a generic type, not inline in the generated file.

## vp fmt and the fmt block (cssints-uhu6)

vite-plus 1.0.0 does not read the `fmt` block of `vite.config.ts`. On a bare project `useTabs: true` there changes nothing, in `.ts` or `.mjs`, while the same key in `.oxfmtrc.json` applies. So oxfmt has always run with its defaults: 2 spaces, 100 columns, no import sorting.

The block now states exactly those defaults, so the config tells the truth, and nothing changes if a later vite-plus starts reading it. No reformat was needed. Tabs, 120 columns and import sorting were the old intent; switching to them would be a mass reformat in a commit of its own.

## 0.1 closed, 0.2 charted (2026-09-30)

The 0.1 map (cssints-vy0o) is closed: its destination was reached at d04771c. The 0.2 map is cssints-9js6. Its destination: a public plugin API with `frame()`, `surface()` and icons as consumers, working in apps/demo, still unpublished.

The 0.1 fog comes along in scope: error DX, derived tokens, value helpers and sublayers. Error DX is a ticket now; the rest stays fog until the plugins sharpen it. The first tickets follow the research recommendation in plugins.md §8: engine seams and the contract first, then the API, `frame()` with the runtime, icons, and `surface()` last.

## Plugin contract (cssints-zho2)

Decided with the user. A plugin reaches user code by an import with the attribute (`import { frame } from "cssints/frame" with { type: "cssints" }`), with no registration in `vite.config` and no type augmentation. The engine already finds sites by the attribute, and it learns kernels and runtimes from the style node while it evaluates.

That leaves nothing for a `definePlugin` to do, so there is none. A plugin is a module that exports members built with `context()`, `style()` and `property()` from `cssints/plugin`. Each member carries its own kernel, runtime and conflicts.

`frame` and `surface` are subpaths of `cssints`, written on the public helpers. Icons are a separate package, `@cssints/icons`, because of the iconify dependencies. Authors pick short custom-property names and markers. When two kernel keys declare the same name, the build fails and names both plugins.

## Error DX: the bad argument and completions in strings (cssints-kotg)

Both parts ship. Findings, numbers and the shapes that were tried and dropped are in docs/research/error-dx.md.

**The error lands on the bad argument.** `padding("2px", "red")` now marks `"red"`, with the same message, in tsgo and tsc 5.9. A mapped tuple in `Check` gives the message only to the bad position, and `Furthest` in css.ts finds that position from how far the recogniser got. `media("a", "b")` had the same problem and is fixed too.

**Completions inside strings, with limits.** The editor offers the keywords that start with the word under the cursor: `display("fl…")` offers `flex`, `flow` and `flow-root`. This works in later parts and in empty parts too. The keywords come from a generated table (`src/keywords.ts`, written by `bun run extract`), bucketed by first letter, so the recogniser budget is untouched.

Limits:
- it offers keywords from the whole grammar, not only those that fit at that point;
- it stops once the string is valid;
- it looks only at the last word;
- it does not offer functions.

An empty part is now a type error.

**Cost:** `users.ts` is +5.6% over the old budget (+4.2% for the error position, +1.3% for completions). That is over the +5% line, but it is accepted: the cost is a flat 0.2–0.7 k per call, and editor latency is unchanged within noise.

## Engine seams for plugins (cssints-vcop)

The seams plugins will stand on are in, with no public API yet.

- **Style node.** A style carries its markers (fixed classes, each tied to the kernel that owns it) and its kernels next to its declarations. `cn()` and the conditions merge both; the class string starts with the markers.
- **Kernels.** A kernel is registered by key on first use. Each module records the kernels it uses, like its themes, so a sheet holds only the kernels of its modules, and `forget(file)` drops them on re-evaluation. Kernel CSS goes in layer `_.k`; its `@property` block goes at the top, beside the tokens'. A sheet with no kernel is unchanged, and the demo build is byte-identical. `addGlobal` stays for rules that go into every sheet.
- **Collisions** are build errors at the call site: the same key with different CSS, two keys declaring one custom property, two keys printing one marker.
- **`lacking(bcdKey, targets)`** sits next to `support()`; a kernel's `requires` gives a support warning once per build, never an error.
- **Definition sites.** A build-time module may hold a plugin value (a function or a configured object) from an attributed call. It has no replacement; a client module that calls it still gets a normal replaced site.

Known limits: a kernel used through a helper module can linger in the registry until restart, giving a false collision in dev after its source is edited. Declarations of custom properties (`["--_r", v]`) are still rejected by the grammar check; the plugin API ticket must let them through.

## The style-query polyfill on old Firefox and WebKit (cssints-fxz3)

The polyfill has now run on browsers that lack style queries on custom properties: Firefox 128 and 150, and WebKit builds 16.4, 17.0 and 17.4. The runtime probe switched the script on in every one. Against the values the same test gave in a newer build of each engine, Firefox 128, Firefox 150 and WebKit 17.4 match exactly (1 392 of 1 392). WebKit 17.0 and 16.4 differ in two colours only because they do not clamp oklch lightness above 1; the script copied the parent's value faithfully.

The engine needs no change. `@property` (Firefox 128, Safari 16.4) is the floor, below which the runtime stays off. A first pass costs about twice what it costs in newer browsers: 190 ms in Firefox 128 for 5 461 elements. Two bugs in the test scripts were fixed (a dead negative control and a hover race in old Firefox). The download URLs and commands are in plugins-proto/README.md.

Still open: Playwright's WebKit builds are trunk snapshots with features Safari shipped later (relative colour in "16.4"), so real Safari 17 is a hand check for the `frame()` ticket.

## Panda CSS 2.0, read on 2026-10-01

Panda rewrote its compiler in Rust on Oxc. It confirms our choices: one Oxc parse, layered output with shorthands below longhands, variables through `@property`, modern media syntax. Its "99% fewer type instantiations" (2 600 to 20) comes from having no grammars: native properties share one value type and only tokens are checked, while we run every value through the mdn grammar (about 750 k on `users.ts`). A deliberate trade.

Three ideas joined the 0.2 fog: local at-rules (`keyframes()`, `positionTry()`) on the kernel seam, ordered value fallbacks (`firstThatWorks`) tied to the BCD warnings, and published packages written on cssints.

## The public plugin API (cssints-su6o)

`cssints/plugin` ships four helpers: `context()` with `method()` for chaining contexts, `style()` for functions of typed parts, and `property()` for user-defined typed properties (first proof: `-webkit-font-smoothing`). Each member returns a style node that carries its kernel, runtime and conflicts; the engine reads them at evaluation, so nothing is registered.

- A plugin's marker and a listed property in one `cn()` is a build error with the plugin's message and the call site.
- A plugin grammar gets a readable message labelled `plugin.method`; the error still lands on the bad argument. Custom properties (`--*`) pass the grammar check.
- **Runtime delivery** follows plugins.md §5. A client module whose site holds a member with a `runtime` imports `virtual:cssints/runtime/<name>`. The module is empty unless a browserslist target lacks a polyfill key and has `@property`. Only then does it configure the shared `cssints/parent-vars` engine and add the fallback CSS to `_.k`.
- Errors are `MemberError` with `pluginName` (Vite overwrites `plugin`) and the call site.
- **Cost:** existing benches within about 1%; 30 plugin calls cost about 41 k.
- **Fixed on the way:** the dev-only false collision of an edited kernel; css-grammar's dist had lost `Hint` and `Furthest`; a grammar kept in a plain `const` widened to `string` and accepted anything (now a message; tsc 5.9 still widens, the guard covers it).

Left out: `fn()`, keyword completions inside plugin grammars, conflicts across `cn()` calls that only `cx()` joins, and a switch to turn a runtime off.

## firstThatWorks(): ordered value fallbacks (cssints-bogz)

`firstThatWorks(wanted, ...fallbacks)` is a part of any property, the wanted value first. The build emits one atomic class with all declarations in CSS order, the wanted value last, so `cn()` and the sorted sheet treat it as one rule. Every value is checked against the property's grammar, at the type level and at build time; inside a multi-part value the whole declaration is repeated with each value; one per declaration. It is not a Typed OM value, and `style()` rejects it.

The support warning for the wanted value drops every target that supports a fallback; what remains names only targets that lack every value.

**Finding:** Vite's CSS minify takes its targets from `build.cssTarget`, not from `css.lightningcss.targets`, so with `cssTarget: false` LightningCSS merged `100vh; 100dvh` into `100dvh` even for targets without `dvh`. `cssints/vite` now exports `cssTarget` from the same browserslist query; the demo and README use it.

**Cost:** +2.1% on `users.ts` for the types, about 13 k per fallback use; +13% on `plugins.ts` after the merge (about 180 per call), accepted.

Still open: LightningCSS drops `color: red` before `color: var(--x)` when it merges, which is wrong if `--x` is undefined.

## Published packages written on cssints (cssints-0l3f)

Decided with the user: a package written on cssints ships its source with the attribute kept (tsdown keeps it), and the consuming app evaluates it in its own Module Runner. One sheet, one set of targets and themes, and tokens, kernels and `@property` dedupe for free because each module is evaluated once. The engine recognises such a package by the same marker as app code (`with { type: "cssints" }` in the file), with nothing to declare, and keeps it out of `optimizeDeps` so esbuild does not strip the attributes. Today the transform skips everything under `node_modules`, so a dependency on cssints builds no classes. A pre-compiled format (classes plus a sheet fragment, for apps without cssints) waits for its first user.

## keyframes() and positionTry(): local at-rules (cssints-lirm)

`keyframes({ from, "50%", to })` and `positionTry(style)` define an at-rule next to the code that uses it and return its name as a typed value: a `<custom-ident>` for `animation`/`animationName`, a `<dashed-ident>` for `positionTryFallbacks`, each refused in the other's place. A step is a style of member calls, as `cn()` and `cv()` take them, so every declaration gets the grammar check, prose rules and support warnings; a bad one is a build error at the call. `positionTry` accepts only the properties `@position-try` allows (build error; the types cannot see them).

The name is a hash of the content (`kf-…`, `--pt-…`), so identical blocks are one name and one rule. The name carries its rule as a kernel keyed by the at-rule, so the rule lands only in the sheets of modules that use the name, through `cn`, conditions and `cv` too. Both go in `_.k`: names are global, hashed names never collide, so layer order never decides.

Findings: `position-try` is already a property, so `positionTry` is the rule with one style and the shorthand with value parts; the recogniser needed a `⟨dashed-ident⟩` sentinel; kernels keyed by an at-rule are exempt from the custom-property collision check (custom properties in a step are uses); a module's kernels now pull in the `@property` of the tokens they read. Cost: +6.8% on `users.ts` (one use of each). Not done: step lists (`"0%, 100%"`).

## Icons on the plugin API (cssints-1x1o)

`@cssints/icons` replaces `packages/plugin-icon` and is written only on the public `style()` helper. `icons({ provider: "iconify-json", collection })` reads `@iconify-json/<collection>/icons.json` from the working directory's `node_modules`; `icons({ provider: "fs", dir })` reads SVG files. Both are called in a build-time helper module (a definition site). `mdi("home")` is a style: the marker `_i` with a mask kernel, or `_ic` with an image kernel for icons that do not paint with `currentColor` (iconify's rule, from `@iconify/utils`), plus one class `--_svg: url("data:…")` per icon on a square view box. No runtime.

Names are typed by a type argument, `icons<typeof import("@iconify-json/mdi/icons.json")>(…)`, because TypeScript cannot read a module type from a string; it costs about nothing per call and 0.1 s (tsgo) to load mdi's JSON. Without it, and for `fs`, a name is a `string`. An unknown name is always a build error at the call with the nearest name ("did you mean home?").

Very little of plugin-icon survived: the provider idea and the iconify JSON handling, now through `@iconify/utils`, the one runtime dependency. Engine changes: `style()` turns whatever `build` throws into a MemberError at the call site, and the inner build server skips Vite's dep scan, which followed attributed imports into build-time code (demo build 1.2 s to 0.4 s). The mask kernel has no `requires`: LightningCSS adds `-webkit-mask`, so a `mask-image` key only gave a false warning. Still open: the iconify HTTP API with a lockfile, generated `fs` types, watching SVG files in dev.

## Packages written on cssints from node_modules (cssints-2kci)

A package ships the JS tsdown built, with `with { type: "cssints" }` kept (no option needed), plus its `.d.ts`. The app's engine evaluates it like its own code: one sheet, the app's targets and themes, and the app can theme a package token.

- The transform skips a dependency file unless it contains `type: "cssints"`, so cssints' own dist is never parsed.
- At startup `cssints/vite` reads the app's `package.json` and each direct dependency's; a dependency that lists `cssints` goes into `optimizeDeps.exclude` and `ssr.noExternal`. Both are needed (negative controls): the optimizer strips the attributes, and the runner loads the package as native Node. Entry files are not scanned, because tsdown can keep the marker in a shared chunk. A package that is only a dependency of another package is not found; the app must list it directly.
- Found on the way: Vite appends `?v=<hash>` to a dependency's URL in dev (now stripped); tsdown merges `import { _cv } from "cssints"` into the attributed import, so `cx` and `_cv` are runtime wherever they are imported; the build's evaluation server uses the config root, not `process.cwd()`.
- Package modules are cleared on each evaluation like app modules and never watched (Vite does not watch node_modules); `runner.qnt` is unchanged.

Tests: `test/packages.mjs` (dev over HTTP and build) and the smoke test with a library tarball, including a type error on a wrong token path across the boundary. Pre-compiled output for apps without cssints waits for a first user.

## frame(): concentric radius on the plugin API (cssints-q2vh)

`cssints/frame` is the first package written on `cssints/plugin`. A frame passes its inner radius down the tree; a nested frame's radius is the parent's inner radius less its own margin, so a rounded field inside a rounded card is concentric with no wiring, through any number of plain wrappers. Methods `radius`, `padding` (spacing step), `border`, `margin` (spacing step, negative allowed), each once.

- **Kernel:** the registered 40-line one, not the 24-line px/rem one: `@property` is the runtime's floor anyway, and registration makes `em`, `calc()` and tokens reach the child as exact lengths (a test reads an `em` padding from a child of another font size). About 0.2 kB more.
- **Conflicts:** `frame()` with `padding*`, `margin*`, `border-radius*` or the border widths and styles in one `cn()` is a build error; border colours stay free.
- **Runtime:** the shared `parent-vars` script with a transition sentinel for hover and media, plus fallback CSS, only for targets that have `@property` and lack style queries.
- **Browsers:** `bun run test:browsers` builds one app three ways and reads `getComputedStyle` on a three-deep tree in Chrome 154, Firefox 155 and WebKit 26.6 (style queries; probe leaves the runtime off; runtime forced on), with a blinded-script control. It also passed on Firefox 128 and a WebKit 17.4 snapshot, where the probe switched the runtime on by itself. Real Safari 17 is still a hand check.
- **Cost:** 30 chains in `bench/frame.ts` cost 179 k (tsc). The demo has a card at 24px with a field at 7px.

## surface(): parent-relative colour on the plugin API (cssints-vsc9)

`cssints/surface` is the second package on `cssints/plugin` and reuses frame's runtime. A surface passes its colour down the tree; a nested surface is that colour with its OKLCH lightness moved, through any number of plain wrappers. Methods: `color` (an absolute base, colour or token; default the surface around it, `Canvas` at the top), `lighten`/`darken`/`contrast` (a step in [0,1], one per chain), `ink()` (black or white text at lightness 0.5636). The `<color>` grammar and the twin already accepted the relative colour the kernel emits. `method()` gained `excludes` (removes other methods from the chain) and an empty grammar (a method with no value). `surface()` with `bg`/`background`/`backgroundColor` in one `cn()` is a build error. The docs say: tonal steps, not a contrast guarantee; `css.check.contrast` checks a ratio.

The fallback needed one extra rule so an element that is both a frame and a surface keeps both transition sentinels (a negative control lost a frame-only hover without it). `test:browsers` builds three apps (frame, surface, both nested) and passes in Chrome 154, Firefox 155, WebKit 26.6, and on Firefox 128 and a WebKit 17.4 snapshot with the runtime switched on by the probe; one MutationObserver serves both plugins. Cost: 30 chains cost 328 k (mostly the `<color>` grammar).

Open: BCD calls relative colour partial in Chrome 119–121 and Safari 16.4–17.6 (other channel scales), so the warning stays silent where the steps are wrong; real Safari 18 is a hand check; keyword colours in the grammar are case-sensitive (`canvas` fails), which CSS is not. The demo warns that `surface@1` lacks relative colour on chrome 109 (in its default targets): honest data, kept.

## Keyword in the wrong case (cssints-317k)

Decided with the user: keywords and function names stay canonical-case only, so each value has one spelling. The error now says the canonical spelling when a failed token is an expected keyword or function ignoring ASCII case: `color: unexpected "RED" in "RED" ("RED" is red in CSS; write "red")`, and `RGB(` gets "write rgb()". The type message does the same for the property's keywords (the generated keyword table has no function names). Cost: about 4.2 k flat per program, +0.46% on `users.ts`; `unused.ts` crossed its 10% gate (+11%), so both budgets were updated.

## Partial support and relative colour (cssints-5q6j)

BCD `partial_implementation` still counts as support in every warning. Measured with a scratch switch: partial-as-lacking added no warning to the demo or the 104 fixtures, but about nine mostly false ones on 132 common declarations (`accent-color`, `overscroll-behavior`, `paint-order`, …). So a kernel marks the requirements that need the whole feature with `{ key, exact: true }`, and only there does partial count as lacking. `surface()` uses it for relative colour, partial in Chrome 119–121 (`l` runs 0–100) and Safari 16.4–17.6 (`h` needs units); those targets now get the warning, ending in "(a partial implementation counts as lacking)". The runtime choice is unchanged: Safari 17 lacks style queries and already gets it; Chrome 120 does not, and the script could not repair the steps anyway. Open: whether Safari's partial support really breaks lightness steps (BCD's note is about `h`), a hand check in real Safari.

## Sublayers vs sort order (cssints-z03v)

Kept the sort; the fix is in its data, not its comparator. 66 cases were run in Chrome through the real plugin, plus an audit of all 532 properties. The sort is wrong only where mdn-data's `computed` gives a wrong leaf count:

- `all` has width 1, so it sorts after and beats every shorthand it contains (`all` + `padding`, `color`, `border`, …);
- `border-inline`/`border-block` beat their `-start` sides, because mdn-data lists physical shorthands inside the logical ones (the side has 9 leaves against 3);
- `font-variant` and `font-variant-caps` tie (no leaves in mdn-data), and then the class hash decides, about half the time wrongly.

Of 823 containment pairs, 79 are wrong and 454 depend on the hash. A leaf count taken from Chrome's own expansion of each shorthand fixes all of them (it goes into `bun run webref`); the 12 failing cases become a test. The audit found 2 ties even with webref lists (`text-box`).

**"The later argument of `cn()` wins" was never implemented, and no sort can do it:** `cn(a, b)` and `cn(b, a)` produce the same sheet. For the same property twice, and for overlap without containment (`border` with `border-inline`, `color` twice, `inset` with `inset-block`), exactly one order is right, so this belongs in `cn()` at build time.

**Sublayers rejected:** they use the same bad data (six containment cases still fail), tie on depth for 41 pairs including `grid-area`/`grid-row` where the count works, and putting depth outside the condition lets `md(pl)` beat `lg(p)`, inverting the breakpoint ladder. On the demo the declared layers rise from 6 to 21, 6 sublayers have rules, and minified bytes grow 4.5%. (Inside a layer a pseudo-class beats a media query by specificity; left as is, `:where()` would change it.)

## Sheet order from Chrome's longhands; cn() merges and refuses overlaps (cssints-s12e, cssints-33ah)

Done in the coordinator session while subagents were down; one change, because both need the same containment data.

- **Leaf counts.** `bun run longhands` asks Chrome for the longhands of every property (set it to `initial` on an element and read the style; `all` is every computed longhand but `direction` and `unicode-bidi`) and writes css-grammar `src/longhands.ts`: 95 shorthands, `all` with 476. mdn-data `computed` remains only for properties Chrome lacks. The sheet sorts by these counts, so `all`, the logical border sides and `font-variant` now precede their longhands. The demo CSS is byte-identical.
- **`cn()`** (and every condition wrapper): under one condition, the same property again replaces the earlier declaration, aliases included (`word-wrap` is `overflow-wrap`); under different conditions both stay. Two properties that overlap without one containing the other are a build error at the call site.
- **Containment is semantic, not only by longhand sets.** Chrome expands `border` to physical longhands and `border-inline` to logical ones, so the sets are disjoint, yet they meet in the cascade (css-logical-1 §4: a logical and a physical side of one group are one value, and the order decides). So a logical and a physical side of a group meet, and a property that sets every side of a group covers whatever a sibling sets there. `border` contains `border-inline` (the research listed it as an overlap by sets; `borderInline` wins, like `pl` against `p`), while `border-color`/`border-inline`, `border-top`/`border-color`, `margin-left`/`margin-inline` and `width`/`inline-size` are errors.
- **Tests:** `test/cascade.mjs` (the relation table, the 10 research cases in the sheet order with a negative control on the old counts, the merge, the error). `test/sheet.mjs` had pinned `all` last, the wrong order.
- Found on the way: `docs/research/sublayers-proto` had been merged without a lint run and turned `vp lint` red on master; it is now ignored like other throwaway prototypes.

## Derived tokens and JSON token input (cssints-5y5a)

Decided with the user: a derived token is a reference inside a CSS value, and `createTokens` takes an imported DTCG JSON.

- **Derived:** `"color-mix(in oklab, {color.accent}, black 15%)"`, `"calc({space.md} * 2)"`. The `@property` initial value takes the targets' flattened literals (an initial value cannot hold `var()`, and `color-mix()` of literal colours is computationally independent); the `:root` rule keeps `var()`, so it stays live. Aliases became `{ name, targets, css }`, so a theme of any target declares every token derived from it again, through chains (`ring` from `hover` from `accent`). A derived token needs a `$type`; a missing reference or a cycle is a build error.
- **Types:** each `{path}` becomes the sentinel of its target's type (`⟨color⟩`) and the string is checked by the type's grammar; a missing path is a type error (tsgo and tsc 5.9).
- **JSON:** a JSON import widens `$type` to `string`, so the editor knows the tree (a wrong path is a type error) and the build checks the values. No runtime change was needed.
- `check.contrast` still warns on a derived colour (culori does not parse `color-mix()`); a small evaluator is an option.
- The engine's own rules caught two fixture mistakes on the way: two modules declaring one variable differently, and `rem` in an initial value.

## fn() and the built-in value helpers (cssints-obd3)

Decided with the user: `fn()` in `cssints/plugin` plus a few built-ins.

- **`fn(grammar, computeTo, name?)`** makes a build-time function whose call is a part of any property. The parts are checked against the grammar in the types and at build time; `computeTo` gets them as text (a token as its `var(--name)`), and its result is inlined where the call is, so nothing ships. A Typed OM result keeps its type and goes only where that type goes (a `CSSColorValue` in `width()` is a type error); a string is opaque to the types and checked in the declaration it lands in. Errors are `MemberError`s naming the function and the call site; a result that does not fit its property is that property's error.
- **Built-ins:** `colorMix(space, a, b)` (on `fn`), and `min`, `max`, `clamp` (typed by their first typed argument, or explicitly: `clamp<"number">(…)`). They exist because a token cannot go into a template string without losing its type: `` `color-mix(in oklab, ${t.color.accent}, black)` `` is a `${string}` hole the recogniser rejects. `calc()` and other functions stay strings.
- **Cost:** about 17 k instantiations per `colorMix` (two `<color>` checks), under 2 k per `min`/`max`/`clamp`; new bench row `functions.ts`. After merging with the cascade and derived-token work, `unused.ts` rose 11% in fixed declaration cost and its budget was updated.
- The demo's button hover is now `colorMix("oklab", t.color.accent, "black 15%")`.

## 0.2 closed (2026-10-02)

The 0.2 map (cssints-9js6) is closed at bf23710: the plugin API with `frame()`, `surface()` and icons works end to end in the demo, the 0.1 fog is shipped or ruled out, and every check is green. Left for later: a hand check in real Safari 17/18, `check.contrast` for `color-mix()`, a bench row for derived tokens.

## 0.3 charted: a read-only atproto client (2026-10-02)

The next map is a real app instead of more features: `apps/sky`, a minimal read-only atproto client on Solid 2 RC and atcute, with Mu's tokens and layout (mu.social, a Bluesky fork by Eurosky) and Witchsky-style appearance settings (hue slider, colour schemes, square-ish UI, hidden metrics). It is the cssints showcase (frames in post embeds, surfaces, container queries, icons, keyframes, derived tokens, themes, tokens from JSON) and the first time cssints runs outside React. The riskiest question goes first: whether Solid's Oxc JSX compiler and our Module Runner evaluation work together.

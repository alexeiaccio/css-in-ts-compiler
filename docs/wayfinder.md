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

**Model-based test.** `spec/mbt.mjs` replays model traces against a real dev server, holding every ssr transform until the trace releases it, and compares what each module serves after every step. It passes on the fixed plugin (10×8 in 6 s) and fails on the old one. The `effect4` tag of `@firfi/quint-connect` failed on an Effect version split, so the test uses `latest` with Zod.

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

Known gap: `spec/mbt.mjs` fails under bun's isolated linker. `@firfi/itf-trace-parser` has `effect` as an optional peer and gets the hoisted Effect 4 (`Schema.pattern is not a function`) instead of the Effect 3 of `@firfi/quint-connect`. npm nested it correctly.

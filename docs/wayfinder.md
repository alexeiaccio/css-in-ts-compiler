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

## Solid 2 and cssints in one Vite app (cssints-yfxf)

cssints works with Solid 2 RC (solid-js and @solidjs/web 2.0.0-rc.13, @solidjs/vite-plugin 3.0.0-next.47 with its native compiler; the 3.0 plugin is the Solid 2 one). `apps/sky` is the skeleton the later tickets grow. `css.*` goes straight into Solid 2's `class={...}` as a string, an array or an object, so `cx` is not needed; `cv()` with a signal-driven variant, tokens and a theme, `frame()`, `container()` and an icon work; the build, HMR (a style edit updates class strings and sheet without reload; a component edit goes through Solid's refresh), tsgo and tsc 5.9 are green and tested in `apps/sky`.

Three breakages, one cause: the Module Runner evaluates a module in the ssr environment and needs no render output, yet it got Solid's DOM output (with `ssr` off), which calls the server runtime's `template()` and throws; the build's private server could not parse JSX left by `jsx: "preserve"`; and a Solid plugin listed before cssints made sites run in Solid's output. The fix is ours and small: in the ssr environment the instrumented module's JSX becomes calls of a no-op `__jsx`, and the transform hook runs with `order: "pre"`, so neither the framework plugin nor the plugin order matters (`packages/cssints/test/jsx.mjs`, which fails without the fix). The rest is configuration, in the README "Frameworks" section: `jsx: "preserve"`, `jsxImportSource: "@solidjs/web"`. Open: Solid reads a module-level class constant through an effect (a small per-element cost), and the plugin is on a `-next` line, so each RC needs a re-check.

## Mu's design tokens and layout (cssints-uifu)

Mu is Bluesky's design system with the colours replaced: spacing, radii, type scale and weights are `@bsky.app/alf` 0.1.15 unchanged; Mu swaps the palette (`src/config/brand-theme.ts`, `brand.json`), and dim and dark read the light ramp backwards (dim's background is `#1A1A1A`). Layout: a 600 px centre column, a 240 px left navigation (80 px icons-only up to 1300 px), a 300 px right rail (250 px at 1100–1300, hidden below 1100), breakpoints 500/800/1100/1300, one column with a bottom bar below 800, a 52 px web header. Details in `docs/research/mu-design.md`.

`apps/sky/src/tokens.json` (DTCG, 89 `@property` rules once built) has one number token, `hue.accent` (default 345, Mu pink), driving the accent colours as derived tokens `oklch(L C {hue.accent})`; Witchsky's slider shift `s` is `345 + s`, set on `<html>` at runtime. Neutrals stay literal (Mu's are near grey, and literals keep `check.contrast` exact); positive, negative and like are fixed, as in Witchsky. Witchsky's "square" is two flags, buttons and avatars, which become radius tokens in a theme; hidden metrics are app state, not tokens.

Licence: the token values and Inter (OFL 1.1) and Phosphor icons (MIT) are usable; Bluesky and Mu marks, logos, images, commissioned art and a Font Awesome Pro avatar are not. The app ships under its own name.

Two cssints findings: a `createGlobalTheme` override takes plain values only, not `{path}` references, so the dim and dark themes set lightness and chroma numbers that the derived colours read; and `check.contrast` warnings for derived colours did not show up in a dev run.

## Theme overrides may refer to tokens (cssints-q6l0)

A `createGlobalTheme` override can be a whole-value reference (`"{radius.sm}"`) or a CSS value with references inside (`"oklch(0.7 0.1 {hue.accent})"`), as tokens can since cssints-5y5a. The theme declares `var(--target)`, so it stays live, and tokens derived from an overridden token are declared again in the same rule. Order does not matter: one rule is one element, and `var()` reads that element's own value of the target. A reference to no token, a whole-value reference of another type, a value not of the token's type after substitution, and a cycle through base tokens and the theme are errors in the editor and at build time. Paths are from the root, so a theme that refers to another group needs the root `t`. Cost: about 800 instantiations per file. Mu's dim and dark themes no longer need the number-token workaround. (The agent wrote the API.md bullet into the main checkout instead of its worktree; it was committed separately.)

## Contrast warnings in dev (cssints-hbqf)

The warnings were never lost in the logger: a derived `color-mix()` colour warned on its first evaluation. The `warned` set, which keeps contrast and support warnings to one per build, was never cleared, and a dev server has no end of build, so a warning came once per process and never after an edit. The client `hotUpdate` hook now clears it; a build still warns once (test in `test/themes.mjs`, failing before the fix). Separate problem, ticketed as cssints-l90l: `check.contrast` follows `alias` only and reads a derived token as its default literal, so a theme that changes a token it refers to is not checked (a probe passed at a real ratio of about 1.1).

## Read-only atproto data with atcute (cssints-t5g6)

The data layer is small: `@atcute/client` 5.1, `@atcute/bluesky` 4.0 and the richtext segmenter, no login and no identity resolver (`getProfile`, `getAuthorFeed`, `getPostThread` take a handle from the URL). Everything the three screens need works without auth on `public.api.bsky.app`: a feed generator such as Discover, author feeds with five filters, threads, profiles. `searchPosts` is blocked there by a CDN 403 (it works on `api.bsky.app`), so search stays out of the first version. Details, the endpoint table and a type-checked data-layer sketch are in `docs/research/atproto-data.md`.

Three things need app code:
- **Moderation:** about 17% of Discover posts come from accounts that asked not to be shown logged out, and adult posts arrive labelled, not removed. A rule of about 25 lines (trust only the Bluesky mod service and the author; hide adult labels) agrees with `@atcute/bluesky-moderation` on 10 822 posts.
- **Paging:** Discover's cursor grows until a 414 after about 21 pages, and moderation shortens pages, so keep loading while a cursor exists.
- **Solid 2 (rc.13):** an async `createStore(fn)` is the first page under `<Loading>`, a plain `loadMore()` appends; a store write in the same tick as a source change drops the re-run, and signal writes are invisible until the flush. The helper in the doc avoids both.

The embed union has a new `gallery` member (`thumbnail`, not `thumb`). Image preset sizes and the video thumbnail were not verified (CDN unreachable from the researcher's network).

## check.contrast follows derived tokens through themes (cssints-l90l)

`check.contrast` read a derived token as its default literal, so a theme that changed a token it refers to was never checked (a probe `oklch({tone.l} 0 0)` with `tone.l` 0.95 in a theme passed at a real ratio of about 1.1). `TokenDef` now keeps one form for aliases and derived tokens: a `template` (the value with `var(--target)` per reference) and its `refs`. The check computes each colour per theme by putting the theme's values, or the base's, into the template recursively, so chains work and a theme value with references is read the same way. A theme is checked whenever it sets any token a checked colour depends on. An unreadable result (`color-mix()`, `light-dark()`) stays a warning and names the theme. Tests: a failing probe first, then a passing derived colour and a chain.

## sky: app shell, routes, data layer and themes (cssints-dqw8)

apps/sky has Mu's layout (left navigation, a 600 px column that is a named container, a right rail from 1100 px, a bottom bar below 800 px; checked in Chrome at 400/900/1200/1400 px), Solid Router 2 with the three bsky.app URLs, the data layer from the atproto research tested against four recorded API responses (`test/api.mjs`, never the live API), Inter self-hosted with its OFL licence, and themes light, dim, dark and system built with references in overrides, so the `accentTone` workaround is gone. The mode is a class on `<html>` (no class is system); a selector theme beats the condition theme.

Two engine bugs found and fixed: a token that other tokens only refer to (the hue) got no `@property` rule or `:root` declaration, so every derived colour stayed at its initial value and nothing warned (`closeNames` in sheet.ts now pulls in what used tokens are made of, through chains); and `check.contrast` rejected JSON-imported tokens at the type level. Gaps left open: no global-selector API (the reset and `color-scheme` are plain CSS), no attribute or parent-state selectors (an active nav item needs `useLinkState` and a `cv()` variant), and Solid Router 2 adds about 100 kB of server and decode code to the client bundle. Pink on white is 3.79:1, so accent pairs are checked at 3, not 4.5.

## sky: appearance settings (cssints-1kob)

The settings live at `/settings` (a route and a nav item; the right rail is hidden on phones) in one localStorage value, `sky.settings`: the hue shift (-180 to 180 around 345, setting `--hue-accent` on `<html>`), the mode (system, light, dim, dark) and Witchsky's two square flags as theme classes that point `radius.button`, `radius.avatar` and `radius.avatarSmall` at smaller tokens, so a `frame()` on the token passes the radius to its children (inner preview 995 px → 4 px). A 10-line inline script in `index.html` and an `html` background on `--color-bg` give the first frame the stored look; a Chrome test with a held-back module script proves it, and a control without the script shows the flash.

`check.contrast` sees themes, and the slider is a runtime value, so the build checks the default hue and `test/contrast.mjs` sweeps all 361 positions in three modes with the engine's own colour maths (Chrome pixels agree within 0.01 on sRGB). **Finding:** the worst case is inside the range: at a cyan-green hue (slider -155) white on the accent is 2.76:1 and the rail note 3.69:1, below the 3 and 4.5 that pink holds. Holding them at every hue needs the accent's lightness (or the text on it) to depend on the hue. Engine gap: a check cannot be scoped to a subset of themes, so a per-hue check cannot live in the build.

## sky: post card and embeds (cssints-n3xy)

The card, every embed (images, gallery, external link, quote incl. not found/blocked/detached/hidden, quote with media, video as a poster) and the moderation states (tombstone, blur with "Show anyway") are in `apps/sky/src/post/`, shown on `/dev/posts` (dev only) from 15 recorded posts and on the home screen's first Discover page. Measured in Chrome:
- **`frame()`:** card / quote / media in the quote are concentric with only the card's radius written: 20 / 11 / 6 px at a 360 px card, 20 / 7 / 2 px at 600 px (a wide card pads 12 px instead of 8, and the nested radii follow).
- **`surface()`:** OKLCH lightness feed 0.940, card 0.980, quote 0.950 in light; 0.248, 0.288, 0.318 in dark (`contrast()` darkens a light card's quote and lightens a dark one's).
- **`container("post (width >= 28rem)")`:** avatar beside or above the text, three images as a banner plus two or three columns, gallery in two or four columns.

Tests: the pure model on recorded posts (`test/post.mjs`), the build check of container/frame/surface rules, a Chrome run (`test:posts`). Gaps found, not fixed: the plugin's ssr environment is its build runner, so a node test cannot render components with Solid's server renderer; there is no `-webkit-line-clamp` member and `lineClamp` warns for every default target; a literal `oklch()` warns for the default targets while the same colour in a token does not. Quoted feeds, lists and starter packs get no card yet.

## sky: home feed with tabs (cssints-11l0)

Three tabs over feed generators that answer logged out and page with a cursor: Discover, Science and News (For You and Popular With Friends return one post or an error logged out). Each tab is a panel made on first visit and kept hidden, so its pages and scroll position survive switching; an IntersectionObserver sentinel keeps loading while a cursor exists; a 414 or the cursor cap ends the feed with a "that's all" note. Skeletons shimmer with one `keyframes()` rule; a `reduced` condition stops the shimmer and the tab indicator's slide; the tab bar is a sticky `surface()`. Tests: tabs and paging on recorded fixtures, the build check, and a Chrome run with the API stubbed (scroll loads the next page, tabs keep scroll, reduced motion stops the shimmer; controls fail without the scroll restore and without the `reduced` rule).

Gaps found: **every property rejects CSS-wide keywords** (`inherit`, `initial`, `unset`, `revert`, `revert-layer`), so `font-family: inherit` on buttons lives in plain CSS; `cursor("pointer")` warns for iOS Safari (honest BCD data, kept since 0.1); `isPending` is not true for an imperative `loadMore()`, so the paging helper's own flag drives the footer skeleton.

## sky: profile screen (cssints-5d42)

`/profile/:handle`: a banner, an avatar that overlaps it and reads `radius.avatar` (so the square-avatars setting reaches it), name, handle, a bio drawn with the post card's rich text (the API sends no facets for a bio, so links, handles and tags are found on the client at UTF-8 byte offsets), and the counts. The header's layout is `container("column (width < 500px)")`: avatar beside the name when the column is wide, stacked and smaller when narrow (Chrome: 499 vs 500 px of column). Tabs Posts / Replies / Media are `getAuthorFeed` filters with an IntersectionObserver sentinel remade per page; the server pins the post on every filter, so pins are asked for on Posts only. Not found, suspended, deactivated, opted-out and network errors are states; only network errors offer a retry.

Two engine bugs found and fixed by the agent: **CSS-wide keywords** (`inherit`, `initial`, …) were rejected on every property (now valid as a whole value in the types and the twin; this closed cssints-fejg, filed in parallel from the home ticket), and the Module Runner failed on a `.tsx` file without a cssints import that a module with sites imported, because its JSX was never made inert. Noted: a `borderColor` in a `cv()` variant loses to a `borderBottom` in the base (they overlap without containment, and `cn()`'s overlap error does not see across base and variants, which only `cx()` joins).

## sky: thread screen (cssints-dwty)

`/profile/:handle/post/:rkey`: parents above the focused post (joined by lines, the page scrolled so the post sits just under the sticky header), the post as a `cv()` variant of the card (bigger text, full timestamp, counts row), replies below as a tree sorted by likes then time (the API returns them unsorted), branches deeper than three levels behind "Show N more replies", opened in place. Connector lines are placed from the avatar's centre (the card's border, padding and half the avatar), so each row is a `post` container like the card and the offset follows the card's own width; Chrome measures them within 1 px of the avatars at 1000, 560 and 390 px. A missing post is HTTP 400 NotFound, so the loader turns it into a state; blocked, not-found and hidden posts are tombstones in the parents, the replies and as the whole screen.

With all screens merged, every Chrome check passes on the combined app (settings, post card, home, profile, thread). No engine bug from this ticket; `calc()` takes no token argument, so the offsets are strings with a raw `var()`.

## Support warnings for colours in tokens and themes (cssints-tuyw)

A literal `oklch()` in a property warned for targets that lack it, but the same colour as a token's initial value, a `createTokens` value, a theme override or a `token.set()` value did not. All of them pass through `checkSyntaxFx` in token.ts, which only checked the grammar; it now also runs the support check as a value of a property that takes the token's type, once per token (or theme value) and feature, in the shared `warned` set. The demo gains nothing; sky gains 26–28 true warnings for `oklch()` against chrome 109, since it keeps the default targets (alias tokens repeat their target's warning: noisy but accurate).

## cv() compares base and variants (cssints-mbky)

`cv()` joins base and variants at runtime, so the build compared nothing. Now the base is checked against every variant value, and variants of different keys against each other, with `cn()`'s relation: an overlap without containment is a build error at the `cv()` call, and so is the same property in two keys that can be active together. For the same property in base and variant under one condition (also an alias, or a variant shorthand over a base longhand) the variant wins: the build lists the base classes a value replaces in an optional `drops` map, and `_cv` leaves them out while that value is active. Chosen over dropping only when every value of a key overrides (fixed none of sky's cases) and over a variant layer or duplicated classes (+20 rules, +2.5% CSS on sky). Cost: 0 classes, 0 sheet bytes, about 70 B gzip of runtime. It fixed two real cases in sky's `navItem` that the class hash had been deciding.

## Line clamp via the WebKit box (cssints-l54z)

LightningCSS passes `line-clamp` through untouched for every target (no `-webkit-` form, no box properties), and Chrome 154 rejects it unprefixed, so `lineClamp` keeps its honest warning. A clamp is `display("-webkit-box")`, `WebkitBoxOrient("vertical")`, `WebkitLineClamp(N)` and `overflow("hidden")`: `-webkit-box-orient` joined the built-in WebKit list (grammar from mdn-data's `box-orient`), and `display` takes `-webkit-box` and `-webkit-inline-box`. None warns (BCD files them under prefixed standard names). Sky's link card clamps to two lines; `test:posts` measures it in Chrome.

## sky: text on the accent picks black or white (cssints-2jzr)

`color.onAccent` is a derived relative colour reading the accent's luminance (via `lab(from color(from … srgb-linear …))`): white under CIE L* 49.4, black over it, where both tie at 4.58. OKLCH `l` as first sketched cannot work: the accent's `l` is the same at every hue, so it would never move with the slider, and any `l` threshold leaves a gap where neither holds 4.5. Mu's pink accent is light enough that the label is black at all 361 positions (worst 5.54; white was 3.79 at pink, 2.76 at worst). In light, `link` now uses `accentStrong` (L 0.47 instead of 0.525), so links and the rail note hold 4.5 at every hue. `accent` on white stays below 3 at cyan-green hues in light: a documented exception for large text and graphics. `check.contrast` cannot read a relative colour, so `test/contrast.mjs` holds the pair; Chrome agrees with the model at 361 hues and 65 other accents.

## Support warnings read the browserslist config and ask LightningCSS (cssints-fxzg)

Decided with the user: fallbacks belong in the engine, and sky stays on `defaults`. The targets are now read in browserslist's own order: `BROWSERSLIST`, then the config found from `process.cwd()` (`package.json`, `.browserslistrc`, env sections), then `defaults`; the working directory, not the Vite root, because `targets` and `cssTarget` are computed when `vite.config.ts` is imported. When a value warns, the engine transforms `x{prop:value}` (or `:root{--x:value}`) through LightningCSS for the lacking targets and drops the warning if the feature is gone from the first output declaration (a hex before `lab()`, a `-webkit-` prefix). So a literal `oklch()`, `light-dark()`, a static `round()` or a prefixable property stop warning; values holding `var()`, unprefixable properties, `@property` initial values and inline `style()`/`token.set()` keep it. One cached transform per distinct warning value, about 0.03 ms; build time unchanged. Demo 4 → 4, sky 32 → 28: what remains is mostly `@property` initial values (cssints-33pa) and values with `var()`.

## css.global(), attr(), within() and group() (cssints-eaob)

Decided with the user in cssints-635k. `css.global(selector, ...styles)` writes a rule with no class, declarations typed and checked like any member call, merged like `cn()`, `media()`/`container()`/`supports()` around a style becoming an at-rule block; it goes into `_.k` of the calling module after the kernels and before the themes, so classes always win over a reset. The selector is checked at build time by a small recogniser over `<complex-selector-list>` (the twin drops whitespace, which is the descendant combinator); the types only check pairing (about 180 instantiations a call). `attr(name, value?, op?)` is a condition like `hover` (`[aria-current="page"]`, value always quoted, six operators and presence), sorting after the pseudo-classes. `group(name?)` adds a marker class; `within(state, name?)` gives `:where(._g:hover) ._x`, one class of specificity, so the sheet's order decides as for every condition and an element's own state beats its group's (without `:where()` the ancestor class would win by specificity, the race docs/research/sublayers.md describes). `:has()` stays out (it looks down from the ancestor).

Sky: the reset moved to `css.global` (`src/base.ts`), the active nav item uses the `aria-current` Solid Router sets on exact-match links (no more `useLinkState` variant), and a post's timestamp lights up while its card is hovered (`group()` + `within(hover)`). Bug found and fixed: the plugin found a module's classes with `_[a-z0-9]+`, so a hyphenated marker (`_g-card`) hid the classes after it. Limit: two `attr()` states that can match together and set one property order by class name; keep them exclusive.

## Token fallbacks for older targets (cssints-33pa)

When a target cannot parse a token value, the engine asks LightningCSS what it lowers the value to, writes that as the `@property` initial value (LightningCSS does not touch those), and puts the original value in `:root`, where LightningCSS adds the wide-gamut form under `@supports`. A derived token or theme value holding `var()` cannot be lowered: it gets its lowered literal as the default, and the live value follows under `@supports (<property>:<the flattened literal>)`; the literal names exactly the features the live value needs, so no BCD-to-test table is needed (the condition is long for relative colours). A target set that has the features gets the same sheet byte for byte. Sky's warnings went from 28 to 2 (the surface kernel and `cursor`); its CSS grows from 27.97 to 29.58 kB on default targets.

Proved in Chromium 109.0.5414.46 (playwright-core 1.29.2): sky shows Mu pink in light and dark with real colours and the hue slider doing nothing, while Chrome 154 still follows the slider (`apps/sky` `bun run test:old-browser`, manual; the old browser is installed under `node_modules/.old-browsers`, steps in the script header). A control against the engine before the change reads `rgba(0, 0, 0, 0)`. Limit: a theme that sets a token a derived token depends on redeclares that derived token live, so an older browser keeps the default there; the runtime polyfill ticket (cssints-i9xo) takes that on.

## Runtime for derived tokens in older browsers (cssints-i9xo)

Asked by the user. Derived tokens whose live value holds `var()` are now live in browsers that cannot parse `oklch()` or relative colour, so sky's hue slider works in Chrome 109. Tokens are not members, so this is not a plugin package but a token-level runtime the engine registers when a derived colour needs it, delivered on the plugin runtime path (`virtual:cssints/runtime/derived`) with the same `needed()` decision; it is imported by the client modules that use such a token (the module that declares the tokens is often not in the client). The build leaves the used templates, per-theme overrides and probe literals in one `:root{--_derived:'…'}` rule in `_.k`. The browser module `cssints/derived` (7.2 kB min, 3.1 kB gzip) picks the themes that apply to `<html>`, evaluates a documented subset (hex, rgb, oklch, oklab, lab, srgb/srgb-linear; `color-mix` in srgb, srgb-linear, oklab, lab; relative-colour channel maths with calc/clamp/min/max/var), writes inline `rgb()` custom properties, re-runs on `<html>` attribute and theme media changes, and stays idle where the literals parse. Anything outside the subset keeps its static default with a build warning naming the token.

Measured: Chromium 109 matches Chrome 154's pixels within 1/255 for the accent steps, onAccent and the background, over 5 hues × 5 mode cases (including a live system scheme flip); a slider input costs 1.1 ms against 0.5 ms of the browser's own recalculation (reads before writes, one forced recalc). Modern targets ship nothing; sky and demo are byte-identical there. Limit: a template that reads an alias of a derived token is one update late.

Process note: a separate session is working in the main checkout on a "mise-en-mode" plugin (cssints-l1qf, uncommitted edits in author-types.ts, lib.ts, registry.ts). The coordinator now commits by explicit paths only; an earlier `git add -A .beans` had swept that bean into a chore commit.

## 0.3 closed (2026-10-03)

The 0.3 map (cssints-co8y) is closed at f2edfcb. apps/sky, a read-only atproto client on Solid 2 and atcute with Mu's look, works end to end and shows every cssints feature; building it found and fixed about a dozen engine bugs and gaps, and led to the fallback work for older browsers (LightningCSS-aware warnings, token fallbacks, a runtime for derived tokens). A separate effort, a "mise-en-mode" plugin (cssints-l1qf), is in progress in another session and is not part of this map.

## Solid RC recheck (cssints-z2i6)

Asked by the user after 0.3. apps/sky now pins exact versions: solid-js and @solidjs/web 2.0.0-rc.13 (the newest RC), @solidjs/router 2.0.0-next.35, @solidjs/vite-plugin 3.0.0-next.47 (no stable 3.x yet; its `latest` tag points at that next build). Nothing broke; the router's `aria-current` now also needs the query to match, and sky's nav links have none. Both JSX no-ops in the Module Runner are still needed (removing either one makes the build fail on the JSX that `jsx: "preserve"` leaves). The old note "Solid Router 2 adds ~100 kB of server code to the client" is half true: those ~105 kB (unminified) are three lazy chunks in `dist` (server-function entry, form handler, decoder) that Chrome never downloads on the pages checked; the entry is 457 kB (139 kB gzip, +2.8 kB from the bump). No export condition or router option removes the chunks from `dist`. Each new RC still needs this recheck.

## frame()/surface() and the derived-token runtime in Safari 17/18 WebKit builds (cssints-7gq2)

Checked in Playwright's WebKit builds of the Safari 17.0, 17.4 (builds 1944 and 2035), 18.0, 18.2 and 18.5 lines and WebKit 26.6 against Chrome 154, with `test:browsers` (which now detects style-query support itself instead of `OLD=1`) and a new `apps/sky` `bun run test:safari` that reads the built app. The decisions hold everywhere: the frame/surface runtime is on exactly in the builds without style queries (17.0, 1944), and the derived-token runtime writes exactly where a probe literal does not parse. Settings colours (within 3/255), frame radii, surface lightness, embed sizes and line clamp match Chrome in every build except the 17.0 snapshot, where the card's rem padding reads as px on the first style pass under a container query and the radii stay stale (cssints-z7lt, low; unknown whether a real Safari 17.0–17.3 does it). Old builds install side by side only with `PLAYWRIGHT_SKIP_BROWSER_GC=1`. Real Safari 26.3.1 did not run: remote automation is off (`sudo safaridriver --enable`, or Developer > Allow Remote Automation); the WebDriver client in the script is untested against a live session. Still for a human on a device: real Safari 17 / iOS 17 (the WebKit snapshots all parse relative colour, which BCD marks partial for 16.4–17.x) and iOS 18.

## Engine cost on sky (cssints-lfoi)

Sky (17 modules with sites) is a real tree, and the engine was 87% of a cold build: 944 ms in process against 122 ms for the same build with the plugin replaying recorded output. Most of it was repeated work: every module that imports the theme re-ran it, and with it the support warnings and twin checks of the same declarations, the parse of a 4.5 MB iconify JSON, and Node's source map cache. Caching support warnings and checks per declaration, parsing icons once per file version (cache on `globalThis`, keyed by file and mtime) and `sourcemapInterceptor: "prepareStackTrace"` cut the build to 696 ms and HMR (style or component edit, write to DOM) from ~320 to 119 ms; 3 ms a site, the first module ~350 ms (mostly Vite's ssr transform of the engine's own TS sources). The biggest cost was in the types: a token from a JSON import carried all 12 type sentinels, so n such arguments in one call made 12^n strings (three in `grid-template-columns` cost 3.9 s of tsc, four hit TS2589, the editor took 1.7–1.9 s per edit on `Shell.tsx`). Such a token is now one wildcard sentinel `⟨*⟩`: tsgo 10.1 M → 2.4 M instantiations (2.6 → 0.85 s), tsc 5.9 7.3 M → 1.2 M (10.2 → 4.5 s), editor 0.28 s. `apps/sky/scripts/perf.mjs` prints the table, `bench/lsp.mjs` takes `APP=sky`, `test/perf.mjs` works again. Left: each evaluation still re-runs the app modules it imports (the cssints-hdui trade-off); `@solidjs/signals` rc.13 logs `SETTLED_CLEANUP_UNOWNED` in dev.

## Real Safari 26.3.1, and a stale read in sky's settings (follow-up to cssints-7gq2)

With remote automation enabled by the user, `test:safari` drove real Safari 26.3.1 through safaridriver; the WebDriver client worked on its first live session. Safari matches Chrome 154: the settings in light, dim and dark at two hues, and the post card (frame radii, surface lightness, embeds, line clamp); no runtime ships to it (style queries, every probe parses). The first run disagreed, and found two problems that were not the engine. (1) Real Safari follows the system appearance (this Mac is dark) and paints at 2x, so the Playwright engines are now read in the system's scheme (`AppleInterfaceStyle`, `SCHEME=` overrides) at `SCALE` (default 2). (2) In every Playwright engine the mode never changed: the script picks a mode and moves the hue slider in one task, and sky's settings built the second change on `s()`, which Solid 2 keeps at the committed value until the next flush, so the hue write put `mode: "system"` back. A person cannot click twice in one task, but it is a real Solid 2 trap; the settings screen now keeps the latest value in a plain variable. So the earlier "3 modes equal to Chrome" of the WebKit builds was true only for light; rerun with the fix, dim and dark match too in 17.4 to 26.6 (17.0 still fails on cssints-z7lt). Screenshots of tall or off-screen elements in Safari are clipped to the window by WebDriver's element screenshot (reported, not asserted).

## Engine observability (cssints-r2qq)

Asked by the user, for debugging. `CSSINTS_TRACE=otlp[:url]` (default `http://localhost:4318`) before `vite dev` or `vite build` sends OTLP/HTTP traces to a local backend (`docker run -d --rm -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one`, then http://localhost:16686, service `cssints`). Each Vite hook is a root span with the file as attribute (`vite.transform`, `vite.hotUpdate`, `vite.load`, `vite.renderChunk`, build start/end), and under it the engine's `Effect.fn` spans plus `cssints.runner.import`, `cssints.lightningcss` and `cssints.cssPost`; warnings and errors are span events with the file, and an error's message carries its trace id into Vite's overlay. One ManagedRuntime, built at load only when the variable is set (read through `Config`); unset, the plugin uses Effect's own `runSync`/`runPromiseExit` and loads no observability code, so perf and build times are unchanged. Per-site work stays untraced (a span costs what it would measure). OTLP traces only: Jaeger takes no logs, an agent reads its HTTP API, and Effect DevTools needs the VS Code extension listening. `test/trace.mjs` (in `test`) checks spans against an in-process collector; `test/trace-live.mjs` reads a traced sky build and HMR back from Jaeger. First finding: one 1.8 s sky transform spent 77 ms in its own evaluation; the rest was waiting for the evaluation lock. On effect 4.0.0 the modules are `effect/http` and `effect/observability` (no longer `unstable/`).

## ai-automation and every Effect check (cssints-fuyb)

Asked by the user. `tools/ai-automation` (from effects-of-atmosphere) is a bun workspace package: an oxlint JS plugin `automation/*` (effect, core and anti-slop profiles, a vendored MIT subset of dmmulroy/anti-slop) and an added-lines diff-check against master (`bun run diff:check`); its tests run through `vp test run`. The root lint has the whole effect profile, the Effect tagged-value rules and the cheap anti-slop rules as errors; the engine now writes `Formatter.formatJson`, `Schema.fromJsonString`, `Result.try` and `Predicate.*` where it wrote `JSON.*`, `try/catch`, `in` and `typeof x === "object"`. The positional-parameter, type-assertion and `unknown` rules stay off (this code's style, not Effect misuse; counts in the tool's README). The Effect language service runs every diagnostic as an error (`tsconfig.effect.json`) except `strictBooleanExpressions`, `missingPipeableSignature` and `nodeBuiltinImport`. Plain code by design (browser runtimes, Typed OM values, the twin's recognizer, @cssints/icons, apps, tests, scripts) is exempt through one `plainCode` override. `macro.ts`, `lib.ts`, `registry.ts`, `author.ts`, `author-types.ts` keep 36 warnings until cssints-6nqy.

## Effect checks in the last five engine files (cssints-6nqy)

After the mise-en-mode session committed, `macro.ts` and `author.ts` moved to the engine's Effect replacements, `lib.ts` (the sync css.* builders and the class hash) joined `plainCode`, and the temporary `inFlight` overrides left vite.config.ts and tsconfig.effect.json: `vp lint` is 0 errors and 0 warnings, the Effect language service reports nothing. `trace-otlp.ts` silences `unstableApiUsage` for the file (OTLP and FetchHttpClient are unstable in effect 4.0.0). perf.mjs, measured in one worktree for both sides, is within noise (median 14.5 vs 13–15 ms per eval); a worktree with its own install measures about twice slower than the main checkout, so A/B runs must share one. The subagent's session broke twice on a harness error and the coordinator finished the ticket.

## Plugin API step 1: engine seams (cssints-0v30)

Asked by the user (plugin API v2, cssints-easl; plan in docs/research/plugin-api.md). A plugin's global rules are identified by their content, recorded per module like kernels and forgotten when the module runs again: editing a look's values updates the sheet (before, the first registration won and kept the old CSS), and a look no file uses leaves the sheet; a rule no client module carries does not print. `createGlobalTheme(tokens, condition, overrides, { layer?, scope? })` now says so in its types, and `scope` wraps the rule in `@scope` (an error with a condition: `:root` is not inside a scope). `layers("app", "author", "viewer")` declares top-level layers, printed once after the engine's; an undeclared layer, the same layers in another order, or overlapping statements where neither holds the other are build errors at the call (a three-way cycle across statements is not detected). `GlobalRule.layer: null` (verbatim) is gone. `check.contrast` reads the themes of one selector together in cascade order (no layer, then declared layers, then source order), so a viewer look that sets only the text colour is checked on the app look's background. A plugin member can emit themes (`Built.themes`) through the same function as `createGlobalTheme` (aliases re-derived, overrides checked, contrast sees them); its token set must be closed over, because member arguments are still joined into one string. mise-en-mode uses `layers` and content-keyed globals; it moves onto themes in step 2.

## Plugin API step 2: @cssints/mise-en-mode as its own package (cssints-by3v)

Mise en Mode left the core and is `packages/mise-en-mode` (`@cssints/mise-en-mode`, cssints as peerDependency), written only on the public plugin API. `look(tokens, expression, source, overrides, { scope? })` makes a look a theme in the declared layers `app < author < viewer` (each variable filled from the most preferred source that sets it); the top-level token groups are the aspects (`data-mode="dark"` applies all, `data-mode="dark/color"` only the color group); `scope` wraps it in `@scope`. Because a look is a theme, its overrides are checked against the token set in the types and at build time, aliases depending on an overridden token are re-derived, and `check.contrast` reads the looks of one selector together in layer order: a viewer look that sets only a poor text colour on the app look's background fails the build. Breaking against the old `look()`: a token set first and values by token path instead of raw `--color-*` declarations nothing checked; aspects from token groups instead of a prefix table; import `@cssints/mise-en-mode`. `look` is still a plain function closing over its token set, because member arguments are joined into one string (scope() in step 3 lifts that). The engine has no mise-en-mode code left; the package is checked by its tests, the demo's build (a viewer look under check.contrast) and the smoke test that installs its tarball.

## Plugin API step 3: scope() (cssints-8ogz)

`cssints/plugin` has `scope(name, table).build(impl).export()` (the A+C synthesis of docs/research/plugin-api.md). The table's entries are told apart by shape: local syntax names (expanded in grammars by the same rule in the types and the build), typed `-prop` properties, kernels (raw CSS or `css.*` styles; `&` is the class the engine mints, `--_x` the scope's own custom property, `&(mod.key)` a kernel class of an embedded scope), globals, layers, a runtime, conflicts, token sets, embedded scopes and `#private` keys; members are chains, call members with positional arguments (a colour, a token set, values for its paths, an options object: within budget, so no named-record fallback; a bad argument is reported on the call with its position) and value members. Everything is namespaced by the scope name, so frame, surface and icons print `--frame-*`, `--surface-*`, `--icons-svg`, markers `_frame-core`, kernel keys `frame.core`, runtime ids `frame.fallback`, a little longer than before, rules otherwise identical. Identity: the name is unique per process and hashed from the table and its functions' source; an edit replaces the definition (hotUpdate forgets the affected modules), another content while an unaffected module still uses the old one is a build error; `cssints` and `derived` are reserved. The types cannot be read from the implementation (benches and apps type-check without Node types or a newer lib), so `scope.ts`/`author.ts` hold signatures with one-line bodies and `scope-engine.ts` is registered by the library; `icons/src/types.ts` is gone and no author writes `as never`. Cost: the plugin author's import floor +31k instantiations (re-baselined, `bench/plugins-defs.ts`), per call 1.02x, evaluation +0.5% on 300 modules. Checked after the merge in test:browsers and test:safari (WebKit 17.4, 18.5, real Safari 26.3.1). Left: `context`/`style`/`method`/`property` until @cssints/mise-en-mode moves onto scope() (cssints-rmws); `fn` until colorMix/min/max/clamp become value members; kernel conflicts are not derived from style kernels, and style kernels take no conditions.

## Plugin API v2 done: mise-en-mode on scope(), legacy helpers gone (cssints-rmws, cssints-easl)

`@cssints/mise-en-mode` stands on `scope()`: `look(tokens, expression, source, overrides, { scope? })` is one call member with positional `$tokens` and `$overrides` arguments returning themes in the declared layers, and the package has no hand-written types file (one explicit annotation stays on the export: the inferred type is too long for the compiler to print, TS7056, which broke `vp pack`). Call arguments gained a `$selector` leaf (types: `ValidSelector`; build: the selector recogniser), since no CSS grammar accepts a selector. The looks' CSS is byte-identical; only error labels changed (`look(2): …`, the scope name as `pluginName`). `style()`, `context()`, `method()`, `property()` and `fn()` are deleted with their tests; what they tested (typed properties, value functions, kernel and marker collisions, definition sites, themes and globals from members, runtime delivery) is tested on `scope()`. `colorMix` is a value member of the built-in scope `cssints-fn` (`min`/`max`/`clamp` were never on `fn()`). `functions.ts`' budget dropped to 310807/322309. The plugin API is now one function, and the map of cssints-easl is closed: seams (0v30), the package (by3v), `scope()` (8ogz), the migration (rmws).

## SETTLED_CLEANUP_UNOWNED in sky dev (cssints-m2vd)

Our own code: the profile Sentinel returned a cleanup from `onSettled` inside a `ref` callback, and `@solidjs/web`'s `ref()` runs callbacks under `runWithOwner(null)`; dev throws, production drops the cleanup silently, so the IntersectionObserver leaked. Fix: `onSettled` in the component body, the element taken from `ref` (as Home's sentinel does). A second dev-only bug in the same sweep: a `createEffect` callback returned `scrollIntoView()`'s Promise (Chrome returns one), an invalid cleanup value that broke the thread screen in dev. The production builds under the browser tests hide this class of error, so `bun run test:dev` (apps/sky/test/dev-browser.mjs) opens every route on the dev server and fails on page errors, console errors and SETTLED_CLEANUP_UNOWNED. Upstream point (nothing documents that refs are unowned) drafted, not filed.

## Style kernels derive conflicts and take conditions (cssints-vma0)

A kernel written as `css: (css) => styles` prints its rules under its minted class in `_.k`, sorted with the sheet's own comparator (`byOrder`), so hover, `attr()`, `within()`, `media()`, `container()` and `supports()` work inside it; a kernel without conditions prints as before. Its conflicts are derived once per scope entry: every property that meets one the kernel sets under `relation()` (the function `cn()` uses for overlap: same, longhand, shorthand, logical/physical sibling), carried as a plug, so the per-site check is unchanged. A `conflicts` entry in the member's `uses` replaces the derived list (`props: []` allows all); raw-CSS kernels derive nothing, so frame (lets `border-color` through) and surface keep theirs. Limit: the check reads every declaration of the style, including a member's own emits, so a member that emits a property its kernel sets lists its own conflicts. Budgets unchanged.

## WebKit 17.0 stale radii solved (cssints-z7lt)

The earlier note (rem read as px on the first style pass under a container query) had the wrong cause. In WebKit builds 1869–2104 (Safari 17.0–18.2) an element with a running transition on a registered custom property computes `rem` wrong, also through `var()`: 1869 reads `0.75rem` as 0.75px, 1944–2104 resolve `rem` against the element's own font size; 2182 is right, `em` and plain lengths always. The frame sentinel (`transition: --_t 1ms`) is such a transition, so the runtime read a wrong `--_i`; the correction comes when the transition ends, with no new `transitionrun`. The runtime now also listens to `transitionend` (+16 B gzip, 1–3 ms per `dev/posts` load in browsers that do not need it; only browsers below Safari 18 / Chrome 122 run it). A rem-padded frame in a 20px font in `test:browsers` fails on 1869 without the fix; `test:safari` passes on WebKit 17.0, 17.4, 18.5 and real Safari 26.3.1.

## cv() is the function (cssints-ep2l)

`_cv(cv({...}))` was two spellings of one thing: `cv({ base, variants, defaultVariants, compoundVariants })` is now the function, typed `(props?: CvProps<V>) => string`; a name or value not in `variants` is a type error in the props, `defaultVariants` and `compoundVariants` (`NoInfer` keeps `variants` the one source). A variant with only `true`/`false` keys takes a boolean, and `false` is a value, not a missing one. The plugin replaces the site by `__cv({...class strings...})` and imports `_cv as __cv` itself; `_cv` is no longer exported, and an old `_cv` import is a located build error (a shim would keep two spellings and `_cv(cv(...))` would now pass a function to the runtime). During evaluation `cv()` returns a lazily built function, so top-level use works; published libraries keep `cv({...})` with the attribute. The compound key is `class` (as in cva; `style` reads like the inline `style()`); a compound drops the base classes and the classes of the variants it combines that it sets again, so it wins whatever the sheet order (checked in Chrome), and anything that can be active with it shares the overlap rules of two variants. Type-only imports from "cssints" no longer need the attribute. Runtime 323 → 344 B gzip, still import-free; budgets +160 instantiations.

## Tokens as getters (cssints-tdiu)

Decided by the user against the coordinator's advice: `createTokens` leaves are getters, `t.color.accent()` returns the token, groups stay plain objects (themes, `check.contrast`, `look`, scope `$tokens` take the set); `token.<type>()` stays a value. The token type carries the definition's `$value` as text, `Token<K, S, V = string>` (a covariant phantom `"~value"`), inferred and shown on hover: an alias carries its `{path}` string (a theme can change the target), a number or unit value its CSS text, a colour object or a JSON import (sky) `string`; V is `:root`'s definition, themes override it. An uncalled getter is a type error on the argument (`TokenGetter` is a `Part` only to report `⟨uncalled-token-getter⟩`) and a located build error (`call it, as in t.color.base()`). Sky's instantiations +0.4%, editor latency unchanged under equal load. The merge with cv() missed one bracket access (`t.space["2xs"]`); the build error named it. Known red on master since the user's "ship built dist" commits (2026-10-05): `bench/errors.ts` 13 errors vs 12 and "tighten" rows (benches without the `development` condition read the cheaper dist types), and `vp fmt --check` on four package.json files; `dist/` is tracked, so every source change rebuilds and commits it.

## Token getters reverted; the value in the type stays; digit keys read as _2xs (cssints-tdiu)

The user looked at a sky hover and saw what the coordinator had warned: sky's tokens come from `tokens.json`, and TypeScript widens a JSON import's values to `string`, so the getter showed the union of every kind and a template string, and `()` on every use bought nothing. The getters are reverted (`d7ef4db`, a revert of the merge; cv() untouched). Kept: `Token<K, S, V>` with the definition's value as text, which shows on hover for `const` token objects (demo, packages, tests) and is `string` for JSON. Added: a key that starts with a digit is read as `_` and the key (`t.space._2xs`, `t.fontSize._2xl`), so no bracket access; overrides of a theme follow the set (`{ space: { _2xs: "3px" } }`), while the variable (`--space-2xs`), `{space.2xs}` references and the DTCG data keep the key; `2xs` and `_2xs` in one group is a build error. Real hover values for JSON tokens would need a generated `.d.ts` beside the JSON or a `tokens.ts`, at a type cost to re-measure (cssints-lfoi bought sky's 10.1M → 2.4M instantiations by not having literals).

## Sky's tokens show their values on hover (2026-10-08)

A JSON import widens every value to `string`, so a sky token showed every kind and `${number}${string}`. `apps/sky/scripts/tokens-types.mjs` (`bun run tokens:types`) writes `src/tokens.d.json.ts`, the type of `tokens.json` with its literals; with `allowArbitraryExtensions` TypeScript reads it for `./tokens.json`, so `t.space.sm` is `Token<"length", true, "8px">`. `typecheck` fails when the file is stale. Cost: sky 2.45M → 3.14M instantiations (literal values are now checked by the grammars in the types too; before cssints-lfoi it was 10.1M), check time unchanged, about 50–80 ms more per edit in bench/lsp.mjs (293 → 345 ms invalid edit, 307 → 381 ms bad part).

## Documentation site (cssints-z8sb)

`apps/docs` is a local-only site on Solid 2 + cssints: 27 pages built from README.md and docs/API.md (the markdown stays the source), Shiki highlighting and twoslash hovers on the ts blocks that docs.mjs checks (27 blocks, 911 hovers, 42 expected errors shown; a build test holds them to docs.mjs). An SPA with a document per URL (`<slug>/index.html` + `404.html`), not prerendered, because Solid 2 SSR and its router are release candidates and the shell is interactive. Styled with cssints: tokens from JSON with a generated `tokens.d.json.ts`, system/light/dark themes, `check.contrast` on 11 pairs, frame, surface, `global()` for the markdown, icons. Findings: a module with css sites also runs in the engine's evaluation server, which has none of the project's plugins, so such a module cannot import a virtual module (the data goes down by context from an entry without sites); a local named `open` in a component let `ph(open() ? "x" : "list")` build, since the evaluator read `window.open` (a runtime argument that shadows a DOM global should be an error); `search.ts` next to `Search.tsx` made the type-aware lint drop the tsx file on a case-insensitive file system; `import/namespace` finds no member of `import * as css` without a plain `import type … from "cssints"` in the file.

## CSS functions as calls (cssints-67qf)

Every function with an mdn-data grammar (110) is a `css` member and named import, generated from `functions.json` and the `name()` syntaxes (`extract.mjs` writes `css-grammar/src/functions.ts`, `scripts/members.ts` the types), not written one by one: `css.calc(t.space.md, "*", 2)`, `css.lightDark("white", t.color.bg)`, `css.linearGradient("90deg", [t.color.a, "25%"], "blue")`. Parts are tokens, numbers, strings, nested calls, or arrays joined by a space; `"+" "-" "*" "/"` join with spaces, other parts with the function's separator (a comma, or a space where the grammar has none). The result is a Typed OM value built at build time; the twin checks the whole call against `<name()>`. Math functions are typed by the kinds of their arguments with CSS precedence (length + time is a type error on the argument); other calls are checked as text against `<name()>`, the error on the first argument (the recognizer does not say where it stopped). Clashes: `colorMix`, `min`, `max`, `clamp` are generated (`colorMix("in oklab", …)`, `clamp<"number">` gone, the scope `cssints-fn` deleted); `attr` stays the condition and a function that clashes with a property or condition gets `Fn` (`attrFn`, `colorFn`, `translateFn`). `css.var(token, fallback?)` types the fallback as the token's type; a raw `var(--token)` string of a declared token warns with the token to pass. The agent's rule that any other `var()` is a build error broke the merge (Shiki's `--shiki-light` in apps/docs, motion's namespaced `--motion-o`), so other custom properties are left alone. Cost: members.ts +17%, `users.ts` +1.2%, a new `functions.ts` bench (377k).


## Typed OM imports in build-time modules (2026-10-08, cssints-tn5i)

The import check ran in both environments, so a plugin module could not `import { CSSColorValue } from "cssints"` without the attribute, as the "Functions" example in API.md does: the error was raised in the ssr transform, while the Module Runner loaded the plugin. In that environment `CSS`, `CSSStyleValue`, `CSSUnitValue`, `CSSColorValue` and `CSSImageValue` are real exports of the eval-time library, so the ssr check now accepts them plainly. The client check is unchanged: the browser's `cssints` (runtime.ts) has none of them, and with the attribute a constructor is a site that ships as its CSS text ("Value constructors are sites"). A plugin module never reaches the client (its import has the attribute), so only the ssr check sees it.

`cssints` now exports `CSSStyleValue` (the base, for a value of another type) and `CSSImageValue` (an `<image>` text, beside `CSSColorValue`). `@cssints/fluid` and `@cssints/gradient` import them from `cssints` and no longer depend on `@cssints/css-grammar`. docs.mjs runs the `tint`/`step` example through the engine.


## Ranges and long lists in the types (cssints-ini5, 2026-10-08)

Found by @cssints/gradient and @cssints/tokens. **Lists.** A `#` list stopped after 9 items in the types (the depth cap of `Star` and `ListRest`), so Open Props' `linear()` springs and bounces (14 to 44 stops) were type errors that built. `ListRest` now has no cap, like the twin: it is tail-recursive and goes on only with remainders it has not seen (they are suffixes of the value, so it ends; a `var()` may stand for the comma, so the text alone does not shrink). Unconstrained parameters keep the declaration cheap: the floor (`empty.ts`) fell from 28.5 k to 26.4 k on tsc and from 28.7 k to 26.7 k on tsgo. 44 stops cost about 50 k. `*` and `+` keep the cap of 8. **Ranges.** The types stripped every `[lo,hi]`. They now keep a range whose bounds are integers from 0 up, `-∞` or `∞` (all of mdn's but `[0s,∞]`, `[-90deg,90deg]` and `[-∞,-1]`), and reject a plain decimal out of it on any numeric primitive: the sign, the integer part and whether the fraction is zero, compared digit by digit, the unit ignored as in the twin's `magnitude`. A literal with an exponent, a sentinel, a math function or a `var()` is not read and passes; the twin checks it at build time. So `padding: -1rem`, `font-weight: 1001`, `column-count: 0` and `gradient(…, 1)` (`<integer [2,64]>`, a TS number or a string) are type errors now; types and twin agree on 4272 of 4272 sampled rows. Cost, net of the floor (tsc / tsgo): one `padding` 1.6 → 1.7 k / 3.3 → 3.5 k, 200 calls 218 → 224 k / 220 → 227 k, `nocolor.ts` +4%, `queries.ts` +5%, the rest +1–3%; budgets updated. cssints' bench stays red as on master (13 errors in `errors.ts`, see above).


## Runtime fallbacks of CSS only, requires covered by a runtime, one name per key (cssints-mz30, 2026-10-08)

Found by `@cssints/fonts` `trim()`. A runtime's fallback reached only the targets with `@property`, because the parent-vars script stands on it; a runtime of `css` alone is no script, so it now reaches every target (`unreached()` in delivery.ts): `BROWSERSLIST="firefox 120"` gets capsize's trim. The derived-token runtime and every `parentVars` runtime keep the `@property` floor, so `frame()` and `surface()` do not change. A kernel's `requires` key that a runtime of the same style polyfills warns only for the targets that runtime does not reach: a fallback of CSS only silences it, a `parentVars` one still warns below `@property`. `uses` names a private key without its `#`, so `#trim` beside `trim` pointed at the member: rather than two namespaces (a `#` in `uses`, a second lookup), such a table is a type error and a build error (`#trim and trim share a name: rename one`).


## Layers below the engine's (cssints-63ia, 2026-10-08)

Every declared layer was printed after `@layer _.k, _.a, …;`, so a plugin's `reset` layer ranked above the classes and `* { margin: 0 }` beat `margin("1rem")`; `@cssints/reset` nested its rules as `_.k.reset`, and a stylesheet could not name a layer between the reset and cssints. A declaration now says which side it is on: `layers("reset", { before: true })`, a table entry `{ layers: ["reset"], before: true }`, or `layers: { layers: ["reset"], before: true }` from `build` (a plain list stays "after"). The sheet prints the statements before the engine's first, then `@layer _.k, …;`, then those after; each side keeps the old rules (one order, a statement that holds another first, then longest first and by name), so several scopes give one deterministic order. A layer declared on both sides is a build error at the second call. `check.contrast` ranks the themes the same way: the layers before, `_.k`, the layers after. `@cssints/reset` is a top-level `@layer reset` before `_.k`, and `layers("reset", "base", { before: true })` puts a user's layer between it and cssints. Only the order of the statements changed, not when the sheet is rebuilt, so the Quint model is untouched.


## Value members take positional arguments and a label (2026-10-08, cssints-pnnw)

A value member's `args` is now what a call member's is (a grammar, `arg<T>()`, or a tuple ending in an object of named leaves), checked by the same types (`Callable`, shared by both kinds) and the same runtime (`argsOf`, split out of `callOf`). `value` gets an array: a grammar's parts one by one, as before, or the arguments as `build` gets them. A table cannot type `value` from the `args` beside it (TypeScript does not infer the table's type through a context-sensitive function in it: tried through `Valid`, the parameter came out `never` or `any`), which is why call members have `build()`; a value member returns a value, not a style, so it gets the one-line identity `fn({ args, value })` instead, and the types reject a tuple written without it (its `value` would be typed as a grammar's parts). For the name in errors, `label?: string` on the entry beats dotted keys (every key check, `uses` paths and the export walk read a dot as an embedded scope) and member methods (a new kind of entry): `fluid` keeps `fluidContainer` as a key, attached by hand, with `label: "fluid.container"`, and its plain wrapper is gone. Lost: fluid's px/rem-only types; a grammar cannot name units, so `em` is a build error only. A tuple value member costs ~1.06k instantiations a call (32 calls of fluid's shape); the table checks add ~1.3k to plugins-defs.ts.


## Kernels written as styles reach children, set custom properties, carry keyframes (cssints-b4q6, 2026-10-08)

The tier-1 plugins hit three walls in `css: (css) => [...]`: no child rules, no custom properties, no `keyframes()` name, so layout had a second raw `-base` kernel per primitive and motion a raw kernel that read untyped internals of the keyframes value. Two members only the kernel's `css` has (`KernelCss` in scope.ts; user code does not see them): `nest("& > *")`, a condition with `nest: true` whose text after `&` follows the class in the selector (in the order the conditions wrap, so `nest(hover(...))` is `> *:hover` and `hover(nest(...))` is `:hover > *`), and `vars({ "--_x": v })`, unchecked values. A kernel's styles may now hold the kernels of at-rule names (keys starting with `@`): they go into the member's carry before the kernel. Derived conflicts leave out custom properties and nested rules, since they are not the element's properties. Rules of two nested selectors of the same rank are grouped per selector within a run of equal conditions, not interleaved by property. layout is one kernel per primitive (`_layout-stack-core`, one class less per call), motion a styles kernel that names its four keyframes in `--motion-in/out/ri/ro`, with presets that pick one (`--motion-n: var(--motion-in)`) and conflicts derived (`kernel core sets animation, animation-name`).


## Kernels as styles: `&` anywhere in nest(), `--_x` in their keyframes (cssints-l8nq, cssints-ge5k, 2026-10-09)

Found by `@cssints/skeleton`, whose `:root` clock stayed raw CSS. `nest()` took only `&` and a combinator at the start; now it takes one complex selector with at least one `&` anywhere (`:root:has(&)`, `.dark &`), and the selector built so far stands for `&` (wrapped in `:is()` when it already holds a combinator), so `hover(nest(":root:has(&)"))` is `:root:has(._k:hover)` and `nest(":root:has(&)")(hover())` is `:root:has(._k):hover`. The subject decides what counts as the element's: `&` in the last compound outside parentheses (`.dark &`, `&.on`) is the element, whose properties count for derived conflicts and the overlap of two kernels (cssints-life); anything else (`& > *`, `:root:has(&)`) does not. A list is an error (a list after `&` printed broken CSS before). Separately, the at-rule kernels a styles kernel carries went into its carry as `kernelOf` made them, while `own()` renamed `--_x` only in the kernel's own css: they are renamed now, and one that holds `--_x` gets the scope's name after its hash (`kf-1c9bee79-skeleton`), since the hash is of the steps before the rename and two scopes with the same steps would have registered one key with two bodies. skeleton's clock is a styles kernel (media, nest, `animation(keyframes(...))`); only its `@property` stays a string, in `atProperty`, as there is no member for it. The sheet's output is unchanged apart from the keyframes name; the browser test is green in Chrome, Firefox and WebKit.

## Tokens: font-relative values, easing and shadow types, theme registrations, cheap hex colours (cssints-wpuv, 2026-10-08)

Found by `@cssints/tokens`. A browser drops an `@property` rule whose initial value depends on a font size, which is why `rem` was rejected: such a token now gets its initial value in px at a 16px font and the value itself on `:root` (`:where(*)` when it does not inherit), so it still follows the user's font size. DTCG `cubicBezier` and `shadow` map to two new token types, `easingFunction` and `shadow`, registered with `syntax: "*"` (the browser checks and animates nothing, the grammar still checks the initial value); no rule at all would lose `inherits` and the default. A module that imports a theme's module now gets the `@property` rules of the theme tokens it uses, not of every token the theme sets. A hex colour token skips the colour grammar walk in the types: Radix light 2.8M → 31k instantiations (`bench/palette.ts`), so the TS2589 ceiling on large sets is gone for hex palettes; other colour forms still cost the walk. `@cssints/tokens` now ships Open Props' rem/ch/em sizes, font sizes and letter spacings, and easings, springs and shadows as typed tokens.

## A condition around a kernel's marker alone is an error (cssints-q83n, 2026-10-08)

Found by `@cssints/balance`: `hover(pretty())` printed `text-wrap: pretty` everywhere, with no error. A kernel is global CSS keyed to its marker class, and a condition wraps declarations, so a member with no declaration of its own (`pretty()`, `frame()` with no method, `group()`) had nothing for the condition to wrap and its marker went out unconditionally. Making the kernel conditional per site would mean a second, conditional copy of its CSS under a minted class for each condition chain, for a case that has a native answer (`css.textWrap(...)` under the condition, `frame()` outside and its methods inside), so it is a build error at the call instead: `cssints: :hover wraps _balance-prettyCore, the marker of kernel balance.prettyCore, with no declaration of its own: …`. The one check is in the condition wrapper (macro.ts), which every condition goes through (pseudo-classes, `attr()`, `within()`, `media()`, `container()`, `supports()`); `carried()` keeps the markers that came without declarations as `bare` on a merged node, so `hover(cn(frame(), color("red")))`, `hover(frame(), color("red"))` and a condition around a `cn()` that holds one fail too, as does one inside a `cv()` variant. A member with declarations of its own under a condition (`hover(frame().padding(2))`) is unchanged: its custom properties are conditional and the kernel only reads them. The types do not catch it: a member is a class string in user code, and telling a marker-only one apart would need a brand on every member's return type.



## A runtime ships a script of its own (cssints-kuki, 2026-10-08)

Found by `@cssints/reveal`, `@cssints/balance` and `@cssints/stuck` (cssints-qhug, cssints-q6il, cssints-z1hd): `virtual:cssints/runtime/<scope>.<entry>` held only `cssints/parent-vars` or the derived-token runtime, so each shipped its fallback as a subpath the app imported by hand, and a missing import was silent. A runtime entry now takes `script`, a module specifier that the runtime module imports when a target lacks a polyfilled key. A string, not `new URL("./runtime.ts", import.meta.url)`: tsdown keeps that URL as written, so `dist/index.mjs` would point at a `dist/runtime.ts` that does not exist, while a package subpath picks `src/` by the `development` condition and `dist/` otherwise, and Vite 8 resolves a package's own name from inside it, so its tests need no alias. It is resolved from the app's root, as `cssints/parent-vars` is, not from the scope's module: the engine does not know that file, and an app has the plugin among its dependencies; a scope embedded by another package under a strict layout (pnpm) would need the plugin hoisted (left for when it happens). A script stands on nothing, so it reaches every target (`unreached()`), which also covers its kernel's `requires` everywhere; it probes the feature in the browser. Deduplication is the browser's: one module, however many runtime entries name it. The three packages dropped the manual import from READMEs and tests, and their browser tests run the delivered script (a modern-only `BROWSERSLIST` gets `export {};`).

## Function calls: the error on the bad argument (cssints-6jou)

The recognizer cannot say where inside a call it stopped (a failed sequence reports its start), so the error of a non-math call landed on the first argument. `CheckFn` now finds the argument by prefixes with the recognizer's pending substitution: a `var()` stands for any run of values, so `name(parts 1..i, var(--x))` is a `<name()>` while the parts can go on (or `name(parts 1..i)` is complete), and the first part after which neither holds is the bad one (`Stop` in function-types.ts); a call that ends too soon puts `unexpected end … (after argument N)` on its last argument. The message is the twin's wording plus the position. It runs only on a call that is already an error: valid calls cost the same (functions.ts bench +3%), an error about 57k instantiations. Rejected: a per-argument `CheckIn` (TS2589 risk) and partial-failure tracking in `Consume` (the hot path). The build-time message still names no position.


## Support warnings of a kernel written as styles are covered by its runtimes (cssints-rp0e, 2026-10-08)

Found by `@cssints/squircle`, `@cssints/reveal`, `@cssints/balance` and `@cssints/stuck` (cssints-pvfo, cssints-qhug, cssints-q6il, cssints-z1hd): cssints-mz30 let a runtime's `polyfills` cover a kernel's `requires`, but each declaration of a kernel written as styles warned on its own (`corner-shape`, `text-wrap`, `animation-timeline`, `container-type: scroll-state`), so the four kept raw kernels and wrote their conflicts by hand. Now `kernelOf` collects those warnings instead of recording them (`checkNow` with a sink: the per-declaration path of user styles is unchanged, perf.mjs within noise), scope-engine.ts keeps them with the kernel, and `addKernel` weighs them against the runtimes of the style with the `requires` rule, one function `uncovered` in delivery.ts: a runtime that polyfills the warning's BCD key covers the targets it reaches (CSS and `script` every one, `parentVars` those with `@property`). Matching is by exact key, so a runtime lists the keys the declarations warn with (`css.properties.corner-shape` and `css.properties.corner-shape.squircle`). Their messages, and the errors of such a declaration, print `--_x` as `--<scope>-x`. squircle, balance's `balance()` and stuck are styles kernels with derived conflicts now; reveal folds its `&&` timeline kernel into `core` (a shorthand prints before its longhands, so the timeline beats `animation`); balance's `pretty()` stays raw on purpose (nothing covers `text-wrap: pretty`, which should not warn) with its own conflicts entry.

## Two kernels of one member may not set one property of the element (cssints-life, 2026-10-08)

Found by `@cssints/reveal` (cssints-qhug): its `animation` shorthand kernel reset the timeline kernel, worked around with a doubled class until cssints-rp0e folded both into one kernel. The gap stays for any plugin: `_.k` prints kernels sorted by key, so with `"#view": animationTimeline("view()")` and `"#zap": animation("1s both")` in one member the shorthand came last and reset the timeline, and renaming a kernel flipped it. Rules weighed: `uses` order (a kernel is shared by members, and embedded ones by scopes, that may list it in another order, so the sheet would need a global order and an error on a cycle), a shorthand before its longhands across kernels (says nothing for one property in both), and an error. Chosen: the error, at the call site, when two kernels written as styles in one carry set properties of the element that meet under `cn()`'s `relation()` (`kernels zap and view both set animation, animation-timeline ...: write those in one kernel`); one kernel already sorts its declarations by the sheet's order. It is the smallest rule and cannot surprise: the declarations of two kernels of one member are one element's styles, so overlap is a mistake, as two kernels declaring one custom property already is. A raw kernel derives no properties and is not compared; nested rules and custom properties are not the element's and are left out, as for derived conflicts. The sheet order is unchanged (by key, so independent of module load order), so the Quint model is untouched.


## A plugin member carries a group marker (cssints-sbs8, 2026-10-08)

Found by `@cssints/stuck` (cssints-z1hd): `within()` reads only `_g-<name>`, and no field of a member added one, so `sticky()` wrapped its chain in a Proxy that put `group("stuck")` on every node. A chain or call member now takes `group: true`: its carry (scope-engine.ts `grouped`, once per `uses` list, also for a call whose `build` adds `uses`) gets the marker `_g-<scope>` with the owner `group`, as `group()` makes it. The name is the scope's, not a free string: scope names are unique in the process, so two plugins cannot collide, and `within(state, "<scope>")` names it with no new syntax; a separate namespace (`_<scope>-g`) would need a second form of `within()` for little gain. A user's `group("stuck")` is the same group, documented rather than forbidden (the scope may register after the user's call). One group per scope, deferred until a plugin needs two. The marker comes after the kernels' markers, so the class list is `_stuck-core _g-stuck _x` and the error of a condition around a member with no declaration (cssints-q83n, unchanged: a group marker is a marker) names the kernel. stuck drops its Proxy and exports the scope's member as it is.

## Plugins read the build targets; what a plugin throws is located (cssints-rf3k, 2026-10-08)

Found by `@cssints/stuck` (cssints-z1hd). **Targets:** `cssints/plugin` exports `lacking(...keys)`, the targets that lack one of the BCD keys as browserslist names them (`["firefox 140"]`), from css-grammar's `lackingOf`: the query and the `partial_implementation` rule of the support warnings. A free function, not a context argument of `build`/`value`/`emit`: stuck's `stuck()` is a plain function of the plugin (it wraps the user's styles, which no member kind does), so an argument would not reach it, and a free function serves members too. The query itself stays hidden. stuck drops its `@cssints/css-grammar` dependency. **Errors:** a plain `Error` became a located `MemberError` only where the engine wrapped the callback in `ran()` (`build`, `value`, a kernel's styles); a chain's `emit` was not wrapped, and a plugin's own plain function (`stuck("middle")`) has no wrapper at all, so `failureOf` (evaluate.ts) made both an `EvalError` with the file only. Fixed at the shared spot: anything thrown while a site runs (`registry.at` set) is a `MacroError` at that site, with the thrown message; `emit` goes through `ran()` too, so every member kind names its scope (`pluginName`). scope.mjs throws from each kind and from a helper.


## `display: grid-lanes` and `flow-tolerance` ahead of Chrome (cssints-rali, 2026-10-08)

Found by `@cssints/masonry` (cssints-btiz): mdn-data 2.27.1 has no `grid-lanes`, so the kernel was raw CSS with conflicts by hand. @webref/css 8.7.5 has it at the top of `display` (`| grid-lanes | inline-grid-lanes`) and has `flow-tolerance`; BCD 8.1.3 has `css.properties.display.grid-lanes`, `.inline-grid-lanes` and `css.properties.flow-tolerance`, all Safari 26.4. Chrome 154 and Firefox 155 reject every value of them in `CSS.supports` (WebKit 26.6 takes all; `item-tolerance` and the `grid-lanes` shorthand nobody takes), so Chrome cannot be the judge: the webref list would never pick `display` (and its webref grammar also has `math`), and a `PROP` override would fail `bun run webref`, which holds every override to Chrome. So `extract.mjs` appends the two keywords to mdn-data's own `display` grammar, in every mode, as it already patches `-webkit-box-orient` and `<display-legacy>`: both twins of the rule accept them, so grid-lanes leaves the rule's disputed values. Rerun, the rule then picks webref's `display` (46 properties): its only other difference is `math`, which Chrome takes, where before grid-lanes made `display` mixed. `flow-tolerance` (an `AHEAD_OF_CHROME` list) takes webref's grammar verbatim; it exists in the list mode only, so the rule never sees it. BCD gives the warnings: `display("grid-lanes")` warns for targets before Safari 26.4. Budgets: against master b100 +1.5%, b200 +1.4%, nocolor +4.5% (webref's `display` repeats `<display-outside> || <display-inside>`), all within the 10% band, not updated. masonry's kernel is now written as styles (`css.display("grid-lanes")`, `gridTemplateColumns`, `gap`, and `columns`, which a grid lanes container ignores, so the fallback needs only its children rules under `@supports not`); its derived conflicts equal the old list and replace it, and the `#columns` runtime's `polyfills` (`css.properties.display.grid-lanes`) cover the declaration's warning (cssints-rp0e).

## Benches measure the sources; fmt skips package.json (2026-10-08)

Since `dist/` is tracked and the package exports point at it without the `development` condition, `bench/budget.mjs` measured the smaller dist declarations: `errors.ts` counted a 13th error that came from dist, and growth went unseen. The benches now pass `--customConditions development` (as the editor and the packages' typecheck do); re-baselined with the reason in the commit: frame.ts +10.5% and surface.ts +10.7% (tsgo) over budgets taken from the sources earlier, mostly the 110 generated function members; functions.ts and palette.ts had budgets taken from dist. `vp fmt` sorts the keys of `exports` and put `types` before `development`, which broke the tests and the typecheck, so `packages/*/package.json` is skipped by the formatter (and the git-ignored `css-grammar/out`).

## Runtime locals vs evaluator globals (cssints-mwqw)

The evaluator exposes happy-dom's own properties that Node lacks (`open`, `name`, `top`, `parent`, `self`, `close`) as closure bindings around each module body, and a site inside a function is hoisted to module level, so a runtime local named like such a global, or like a module binding (`const n = 4; (n) => p(n)`), was silently read from there: the site built with a wrong value (apps/docs: `ph(open() ? "x" : "list")`). `instrument.ts` now records the names declared around each site (parameters, let/const/class/function, loop heads, catch params); a hoisted site that names one is emitted as `{ __site(...); let open; }`, so the read is a TDZ error, which `evaluate.ts` maps to the usual "css arguments must be known at build time" message at the call. Limits: a `var` in a nested block is not tracked; a real top-level TDZ read in a site's arguments now gets this message.

## Devtools on the sheet; a dev source map from class to call (cssints-0a3p, 2026-10-09)

docs/research/devtools.md. atomic-css-devtools reads any sheet through the CSSOM and gets cssints' layer order right, but misses `@container`, `@supports` and `@scope` rules, ignores specificity (the one place the sheet relies on it: `hover()` over a query in one layer) and ranks unlayered rules below layers; upstream bugs, nothing cssints could print would fix them. What it and Chrome both lacked was the step from a hashed class to its source, so the dev sheet now has a source map (plugin.ts `sheetMap`: each class rule to the first site that produced it, read with `css.devSourcemap`; test/sheet-map.mjs). Readable dev class names, a `data-cssints` attribute and a JSON class map were weighed and not done: the Styles pane shows the declaration already, cssints does not own the JSX, and the map carries the same data to the browser. Sonda sees the sheet as a 0-byte module (no build map); Playwright CSS coverage reads 79 % of the demo's sheet as used on load, but that is an artifact of `@layer` blocks; by rule usage it is 75 % of the style-rule bytes (corrected by cssints-5jj1, docs/research/coverage.md).


## Token files from Figma tools (cssints-ow16, 2026-10-09)

Checked against what the tools write (samples in `packages/cssints/test/fixtures/importers`, with their sources). Figma's native export (Export modes) is plain DTCG 2025.10, one file per mode: the default mode already worked, but the file of another mode could not be a theme, since overrides took values, not `{ $value }` leaves with `$type` and `$extensions` beside them. `createGlobalTheme` now takes such a file as it is, and a key that starts with a digit (`500`) finds the set's `_500`; that is the whole normaliser, and TokensBrücke's "Split modes into separate files" gives the same shape. What was silently misread is now a build error that says what to do: modes in `$extensions` (TokensBrücke's `mode`) were dropped, a Figma boolean (`com.figma.type`) became a number, a Tokens Studio colour modifier was ignored. Tokens Studio's other differences (legacy `value`/`type`, its type names, unitless dimensions, math, `rgba(<ref>, a)`, sets and `$themes`) are many and already solved by `@tokens-studio/sd-transforms`, so they are not normalised here: each is an error that points to a recipe in docs/API.md (Style Dictionary with sd-transforms and a six-line format that writes DTCG, checked with style-dictionary 5.6 and sd-transforms 2.0). Terrazzo was not needed: its Figma import reads variables through the REST API (Enterprise plans) and writes a resolver file, and it does not read Tokens Studio. Not done: a FLOAT variable stays a `number` token (Figma has no unit on it; `calc(t.x, "*", "1px")`), `string`/`fontFamily` tokens in a file are still an error for the whole file, and the DTCG resolver format (sets and modifiers) is not read.

## A source map of the build sheet (cssints-vxfr, 2026-10-09)

Vite 8 writes no CSS map in a build: `vite:css-post` keeps each module's CSS as a string and `finalizeCss` (minify) and `emitFile` carry none, whatever `build.sourcemap` or `css.devSourcemap` say, so a map handed through `vite:css` in `renderChunk` would be dropped. With `build.sourcemap` (true, `"hidden"`, `"inline"`) the plugin records `siteOf` in the build too and, in a `generateBundle` hook after `vite:css-post`, maps each CSS asset as written with the dev map's own `sheetMap`: one segment per selector (LightningCSS prints a rule per selector, so that is the granularity that survives the minify), the first call of its first class, modules taken by path so builds are reproducible; the rest is unmapped. Off, nothing is recorded and the demo build is byte-identical. Sonda's Vite plugin (0.14.0) never analyses a CSS asset (it passes assets without entrypoints and its report drops them), an upstream gap; fed to its `Report` directly, the demo's 9 kB sheet splits into Showcase.tsx 3.4 kB, App.tsx 2.1 kB, Button.tsx 0.8 kB, Card.tsx 0.3 kB and 2.5 kB unassigned (layers, tokens, `@property`, keyframes). docs/research/devtools.md section 4; test/sheet-map.mjs.


## CSS coverage per route on sky: keep one sheet (cssints-oj0c, 2026-10-09)

docs/research/coverage.md, `cd apps/sky && bun run test:coverage`. A route of sky uses 49–74 % of the style-rule bytes after its interactions, and the shipped routes together use 95.3 %. A sheet per route would save 7.6–11.6 % (0.7–1.0 KB gzip of 7.6 KB), which does not pay for an extra request and the layer order, so sky keeps one sheet. None of sky's own rules is dead. 12 unused rules are embeds and a moderation state that only /dev/posts shows, and 3 are the style-query fallback of frame and surface, which Chrome never needs. `page.coverage` cannot measure a layered sheet: Chrome reports a used `@layer` block as one range over all its rules, so every rule counts as used (80.1 % on every sky route, 404 included). The demo's 79 % in cssints-0a3p is that artifact (correction: cssints-5jj1). coverage.mjs reads CDP rule usage and counts only leaf rules.

## Build errors of function calls name the argument (cssints-90q7)

The twin cannot say where inside a call it stopped, so `functions.ts` repeats the method of `Stop` (function-types.ts) at build time, on the failure path only: it checks the prefixes of the parts as `name(prefix, var(--x))` or `name(prefix)` with the twin's pending substitution, and the first prefix that neither goes on nor ends is the bad argument (none: "after argument N"). The message is the twin's plus `(argument N)`; math functions are unchanged and a valid call costs nothing. The location stays the site: a site knows only its own offset and a nested call is part of it; locating the argument would need `instrument.ts` to record the argument offsets of nested calls.

## Docs site prerendered and on GitHub Pages (cssints-mnso)

At build time each page's document gets its title, a description from the first real paragraph, and the article as static HTML (`#prerender`) beside a hidden app root; the app swaps the two in one task once its article is ready (no frame shows both or neither), and without JS the static copy stays. Chosen over Solid SSR: the content is already static HTML, and Solid 2 SSR and its router are release candidates. `DOCS_BASE` (default `/`) is Vite's `base`; the markdown worker, the router (`BASE_URL`) and `url()` follow it. `.github/workflows/docs.yml` deploys on push to master with `DOCS_BASE=/<repo>/`, from the tracked `dist` (no package build; Node 24 for the worker's type stripping); Pages source must be "GitHub Actions". Findings: a host that falls back to `index.html` shows the overview's copy until the article loads (GitHub Pages serves `404.html`); `vite preview` serves a slug without a trailing slash as the overview, so the static links end in a slash; `$` in page HTML needs function replacers in `String.replace`.


## Our own devtools: a dev overlay on the compiler's knowledge (cssints-cncb, 2026-10-09)

docs/research/devtools.md showed that atomic-css-devtools, reading the CSSOM, misses `@container`, `@supports` and `@scope`, ignores specificity and ranks unlayered rules last, and cannot say which call made a class. `@cssints/devtools` is an overlay that `cssints({ devtools: true })` injects in dev (opt-in: on by default would add a script and a package to every dev page, and apps/sky's HMR test reads every HMR message as an update, so sky stays without it; the overlay works there, checked by hand). The dev server answers `cssints:devtools:get` over the HMR channel with a table built from its own records (`devtools-server.ts`: the sheet as rendered, each class's rule, plugin and tokens, and the sites of each module, recorded beside `siteOf`); after each client transform it sends `cssints:devtools:stale`, so once nothing is in flight the overlay's table is current, by the argument of `sheetFresh` (no await point moved, the Quint model is untouched). The core (Effect) parses the sheet and ranks per longhand by layer, specificity, then order; the browser decides the at-rules through a probe sheet around the element, and each winner is verified on a childless clone, with the cause named when the page shows something else (an unlayered `.mine` rule, an inline style). The UI is Solid + cssints, built ahead into one file (256 kB, 73 kB gzip, dev only) and mounted in a shadow root with its own sheet, so it is neither in the app's sheet nor in the table. Checked by a core test on happy-dom, a build test (nothing in the demo's build) and Playwright on the demo in Chrome, Firefox and WebKit. Left: `@scope` proximity, logical/physical pairs, elements in other shadow roots, server-rendered pages.


## Plugins tell the engine which files they read (cssints-04u8, 2026-10-09)

Found by `@cssints/placeholder` (cssints-cpca); icons (`fs`) and fonts (`fs`) had the same limit: a plugin that reads a file while a module runs cannot register it, so in dev an edited image, SVG or font changed nothing until the importing module was touched or the server restarted. `cssints/plugin` now exports `dependsOn(path)`, a free function like `lacking()`, so a member's `build`/`value`/`emit` and a plain plugin function can call it. It adds the path to `registry.files`, which `evaluate.ts` clears when an evaluation starts; `plugin.ts` reads it inside the evaluation lock (with the sites) and adds each file to `depsOf` for the module being evaluated, at the same point as the runner's imports, before the transform returns. The dev path is the one an imported module takes: `hotUpdate` finds the module in `depsOf` (or in `inflight` while its transform runs), invalidates it and `forget`s what it registered. No module graph has the file, so the server's watcher is told to watch it (`watcher.add`, which also covers a file outside the root); `ctx.addWatchFile` is used only in `vite build`, because in dev Vite would make the file an import of the client module. Race model: the file is known before the result can be cached, so the race of cssints-hdui (a dependency unknown during the first transform) is covered by `inflight`, as for a module. runner.qnt gets a third instance, `asset` (`--main asset`): tokens is such a file, the watcher invalidates nothing and the evaluation reads the disk. It keeps `servedFresh`, `readsOwnSites`, `depsOfKnown` and `sheetFresh` (100 000 traces, 60 steps), and loses `servedFresh` when `inflight` is removed from `hotUpdate`: for a file no graph knows, nothing else stops a stale result in flight from being cached. mbt replays module `fixed` and needs no change; race.mjs and mbt stay green. `vite build --watch` also hung on its second build: `closeBundle` closed the evaluation server and the next `buildStart` kept it; the server and the runner are now reset there. Tests: `test/depends-on.mjs` (dev, and a rebuild in `--watch`), and a dev test in each of the three packages (edit the file, the module is invalidated, the sheet changes). Left: a directory is not a dependency (a new SVG in `dir` is not seen), files in `node_modules` are not watched, and an evaluation that fails records nothing.

## Docs site on Cloudflare with Alchemy (2026-10-09)

The repository is private, so GitHub Pages is not available: the site is a Cloudflare Worker serving `dist/` as static assets at https://cssints.accio.blue, described by `apps/docs/alchemy.run.ts` (Alchemy v2 beta.81 on effect 4.0.0, `Cloudflare.Website.StaticSite`: `bun run build`, `notFoundHandling: "404-page"`, `domain`). The state is in the Cloudflare account (`Cloudflare.state()`, the account's existing `alchemy-state-store` worker), so local deploys (`bun run deploy`, OAuth profile) and CI (`.github/workflows/docs.yml`, `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`, token scopes in apps/docs/README.md) share it. The first deploy used local state and was destroyed and redeployed on the account state (a Worker's physical name has a random suffix per instance, so adopting across stores would have made a second Worker).


## MCP tools on a running app and in a browser (cssints-vitu, cssints-xifk, 2026-10-09)

An agent could compile a module but not ask the running app what a class in the DOM is, or why an element is red. `@cssints/mcp` now reads the table of the devtools overlay the way the overlay does: a Node WebSocket on Vite's HMR channel (protocol `vite-hmr`; it sends no Origin, so Vite's token check does not apply), `cssints:devtools:get`, the table decoded by `@cssints/devtools/model` (a DOM-free subpath) and cached until `cssints:devtools:stale`. A dev server knows only the modules it has served, and an agent often has no browser open, so the tools fetch every module the page reaches (the HTML's scripts, then static and dynamic imports) on the first call and after an `update` or a `full-reload` of a module (the sheet's own updates are skipped): an edit is seen without a browser. `explain_class`, `module_styles` and `dev_errors` are built on that; the errors are Vite's `error` payloads, sent while a module fails to transform, so `dev_errors` fetches the modules again. Vite sends no warnings to clients and the page's runtime errors stay in the browser: the tool says so (`compile` has a module's warnings). `inspect_element` and `why_property` run the overlay's own cascade in a headless Chromium (playwright-core): `@cssints/devtools/inject` (the core with `domPage`, no UI) is bundled by Vite on the first call (an iife, about a second) and added to the page, which gets the table from Node; the core's probes and the clone check run in the browser that paints the page. Weighed: a prebuilt `dist/inject.js` (one more build step before the MCP tests) and importing the core through the app's dev server (a dependency optimisation and a reload in the user's app). Left: `@scope` proximity and the other limits of the overlay; an app under a base path needs `server`; elements in shadow roots.

## A string that a value member returns is opaque, a template literal too (cssints-izcy, 2026-10-09)

cssints-zayr found that ``shade: fn({ args: ["<color>", { "dark?": arg<boolean>() }], value: ([c, { dark }]) => `color-mix(in oklab, ${c}, ${dark ? "black" : "white"})` })`` failed in the user's code: `color(shade("red"))` gave TS2345 `color: unexpected "color-mix(in" ...`, though the build accepts it and docs/API.md says a string is opaque. `fn()` types its result `R extends string | CSSStyleValue`, so TypeScript keeps the literal or template type of a string; the table form (`value(parts: string[]): string | CSSStyleValue`) widened it already. The member's type (`MemberOf` in scope.ts) now maps each string part of the result to `string`, which every property accepts, and leaves a Typed OM value as it is: both forms go through it. A result of `"thick" | CSSColorValue` becomes `string | CSSColorValue` and is accepted anywhere, as that union was before. The workaround (annotate `: string`) is gone from the plugin skill. Cost: about +6 instantiations (tsc) and +10 (tsgo) on the plugin benches; no budget changed. Type tests in test/types/scope.ts.

## Devtools in sky; the demo's coverage by rule usage (cssints-t42q, cssints-5jj1, 2026-10-09)

apps/sky now runs `cssints({ devtools: true })` with `@cssints/devtools` in its devDependencies. Its test/dev.mjs read every HMR message as a file update and crashed on the overlay's custom event `cssints:devtools:stale` (sent as `hot.send(event)`, so the payload is a string); it now skips custom events by their type, not by name. The overlay adds no console error or warning on any route (test:dev, test:browser green); on /dev/posts it picks a post card and lists its classes by `src/post/Post.tsx:56`. Without `dist/overlay.js` built, the entry prints one `console.warn`, which test:dev does not flag. The demo's coverage in devtools.md was `page.coverage`'s 79 %, which counts every rule of a used `@layer` block (coverage.md); by CDP rule usage, as apps/sky/test/coverage.mjs counts, the demo uses 75.2 % of its style-rule bytes on load and 83.9 % after widths, hover, focus, a dark browser and reduced motion (`page.coverage` reads 81.0 % on the same sheet). The profile's Media fixture now ends with a 3-image post, a gallery and a "warn" post from posts.json (scripts/record-profile.mjs adds them when it records again), so the 11 rules only /dev/posts used are measured on a route: sky's unused rules go from 15 to 4 (the dev page's width and the 3 style-query fallback rules). Left: whether @projectwallace/css-code-coverage has the same layer problem (cssints-o3dz).


## Engine entry points for the MCP: contrast, lowering, located warnings, targets per root, shipped docs (cssints-p3d2, 2026-10-09)

@cssints/mcp (cssints-w57u, "## Engine gaps") worked around five things inside its own package. Each is now in the engine. A new subpath, `cssints/check` (Node only, Effects), exports `contrast(fg, bg)`, the ratio of `css.check.contrast` with its text cut at two places (the MCP had a copy of the culori maths), and `loweredOf(property, value, warning)`, what LightningCSS writes for the targets of a support warning (`check_support` answered by raw BCD, so `color: oklch(…)` for chrome 100 was "unsupported" while a build said nothing; it now counts as supported and lists the lowered value). `cssints/plugin` was weighed for both and left out: it is the plugin authors' entry, loaded by every evaluation, and culori would load with it. Support warnings had no place and were said once per class per process (`checkDeclarationNow(p, v, fresh)` checked support only for a new class), so a second compile of the same module was silent and the MCP kept its own memo per class and called the plugin's `hotUpdate`. Now `__site` keeps `registry.at` while the site's value is recorded, every warning carries its site, and the plugin gives Vite `{ message, id, loc }`: Vite prints `file:line:col` and a code frame. The rule chosen: once per file of the site, property and BCD feature per build (registry.ts `warn`); in dev a warning is said again when that file is edited (`hotUpdate` forgets the file's keys, it no longer clears all), not on an update of an unrelated module; a build of `vite build --watch` starts over. Weighed: once per module transform (a theme imported by many modules runs in every evaluation, so its warnings would repeat on each), and once per property per build as before (one warning for fifty files, at one of them). A tool calls `api.forgetWarnings(files?)` before a transform to hear them all; the MCP's `compile` does, and gives each warning `line`, `column` and `location`. Targets were read once from process.cwd(), so a Vite `root` elsewhere (the MCP's compile of another project, a test) warned for the wrong browsers: the plugin now reads the browserslist of `config.root` and sets it before each evaluation (css-grammar `useTargets`, on globalThis, as the registry, since the runner evaluates its own copy of support.ts); `supportOf` caches per list of targets. `targets` and `cssTarget` of `cssints/vite` still read process.cwd(): they are computed when vite.config.ts imports them, before the root is known. docs/API.md is copied into the cssints package by a `prepack` script (`files` lists `docs`, the copy is gitignored, scripts/pack.mjs runs it too), and `search_docs` reads `node_modules/cssints/docs/API.md` in a project. Cost: support is now looked up for every declaration, not only a new class (a cached map lookup): perf.mjs seq, 200 modules, A/B in this worktree on a busy machine, median per evaluation 5.0 to 8.6 ms on both sides, user time 2.1 to 3.1 ms on both, no difference above the noise. The order and await points of the evaluation are unchanged, so the Quint model is untouched; only what is printed changed. Left: `targets`/`cssTarget` per root (they would need the plugin to set `css.lightningcss.targets` and `build.cssTarget` itself); a runtime module loaded outside an evaluation reads the targets of the last one (one root per process is the usual case). The dist/ of cssints and css-grammar must be rebuilt on master for the MCP, which runs on dist.

## Docs site: settings, the devtools overlay on the build (cssints-tt24, cssints-sin2)

The docs header has a display-settings popover (the native Popover API; a popover beat a /settings page because the reader sees the page change and there is no route to prerender): the accent hue (`hue.accent`; the accent family and onAccent derive from it, test/contrast.mjs reads six pairs at all 360 hues in light, dim and dark, worst accent on bgSubtle 3.47 against a floor of 3), system/light/dim/dark (dim is `dark dim`, a theme after `.dark` that moves only the neutrals), text size, density and corners (`scale.font`, `scale.space`, `scale.radius`, themes on `data-*` attributes, the scales `calc()`ed into fontSize, space and radius), and the font (three `global()` rules: there is no fontFamily token type). One localStorage key, applied before the first paint by an inline script that test/settings.mjs holds to `apply()`. `cssints({ devtools: "build" })` puts the devtools overlay on a built site: an 846 B loader (a button and Alt+Shift+C), the table as a hashed JSON asset (70 kB, 12 kB gzip on the docs) and the overlay as a dynamic chunk (190 kB, 64 kB gzip), both loaded on the first open, on a transport that never goes stale; site files are relative and the panel shows `file:line` and the call's text, with no editor link and no link into the private repository. `packages/devtools/dist/overlay.js` is tracked, because the docs CI does not build packages. Left: a relative `base` (`./`) for the loader; the old `cssints-docs.mode` key is not migrated.

## Devtools: custom properties checked as the page has them (cssints-g3u1, 2026-10-09)

On apps/sky's /dev/posts the overlay marked the post card's `--surface-d` ✗: "the browser computes .04; ._1b4kpn9 would give 0.04", and a quote inside it the same with `1e6` against `1000000`. The cascade was right (the member class in `_.a` over the kernel's `0` in `_.k`); the check was not. The table carries the sheet as cssints renders it, the page has it after Vite's LightningCSS, which reprints values (`0.04` as `.04`, `1e6` as `1000000`, an `oklch()` as a hex and a `lab()` under `@supports`), and the step is unregistered on purpose, so it computes to its tokens as written, and the clone that got the table's text computed something else. The fix is in dom.ts: a custom property's winner goes on the clone as the page's sheet has it, the last rule with the winner's selector (as the CSSOM serialises it) whose at-rules hold for the element, found by the probe sheet; the table's text when there is none. `Page.verify` takes the winner's selector. Weighed: a comparison of token streams that knows numbers and whitespace (misses colours), and a model built from the page's sheet (a second source of rule indexes, and no text for a `<link>` in a build). Checked by a nested surface case in apps/demo's Inspect.tsx (the outer one's base written `oklch( 0.9   0.02 90 )`) in Chrome, Firefox and WebKit, and a core test on the cascade of nested surfaces. Left: a standard property is still set from the table's text (its computed value is normalised, so only a property that LightningCSS rewrites to another one would differ).

## Playground: the engine in the browser (cssints-4v2z)

Measured first (docs/research/playground.md), then built: `/playground` on the docs site runs the real engine in a worker, with no server. The engine files are not forked: `apps/docs/plugin/playground.ts` answers their Node imports (SHA-1 for the class hash, `relative`, a table-backed `createRequire`, the BCD data cut to CSS, the resolved browserslist, a `Buffer` that is a `Uint8Array`, stubs for happy-dom and the Module Runner); the parsers are the wasm builds of oxc-parser, oxc-transform and LightningCSS (no cross-origin isolation needed); the module runner is an `AsyncFunction` over the instrumented code inside a fake `ModuleRunner`, so the real `evaluate()` runs. One engine change: `moduleEntries()` moved to `entries.ts`. The Node plugin and the worker agree on the README example and 153 fixtures (65 same sheet, 90 same located error, 0 differ). CodeMirror 6, tabs for preview, CSS, shipped CSS, module and JS, errors marked in the editor, the code in the URL hash, a 15 s cut-off; Monaco with TS types was rejected (several MB of compiler, and the type-level grammar is the slowest part of the project). Cost: the docs entry +2.3 KB gzip; a first visit to /playground about 3.45 MB brotli, LightningCSS 1.98 MB of it. Found: a module that loses its last cssints import keeps its old rules in the dev sheet (`plugin.ts` returns early without clearing `usedBy`). Left: several files, the plugin packages in the module table, LightningCSS on demand, a target picker, a DOM stub for build-time code that touches `document`.

## A module that drops its cssints import leaves the dev sheet (cssints-fjho)

Found by cssints-4v2z: a dev-server module edited so that it no longer imports cssints kept its rules, globals, layers, themes and checks, because `transform` returned early for a client file without the attribute and only a run of the module forgets its entries. The early return now calls `drop(id)` (client only, a no-op unless the module is in `usedBy`): it removes the module from `usedBy`, `siteOf` and `callsOf`, calls `forget(id)` as a re-run does, and reloads the sheet. `test/dev-drop.mjs` drops the import and restores it on a dev server. The Quint model is unchanged (no await point moved; it covers modules that use `css.*`). Left: `depsOf` keeps a dropped module's dependency ids (a harmless extra invalidation). Also: `apps/docs` typecheck excludes `test/out`, where the browser tests write the built site.


## apps/sky-tui: sky in a terminal on OpenTUI + Solid (cssints-41z7, 2026-10-10)

The TUI epic (cssints-06ws) needed an app to aim cssints' TUI target at. apps/sky-tui is sky's home feed (three tabs), post card and thread in a terminal, on `@opentui/solid` 0.5.17. That package wants solid-js 1.9.12 exactly, so sky-tui has its own solid-js 1.9 beside sky's 2.0 rc. It shares only framework-free code with sky, by relative import: `src/api.ts`, `src/post/model.ts`, `src/thread/model.ts`, and the feed list, which moved from `home/tabs.ts` (Solid) into `home/feeds.ts` (tabs.ts re-exports it; sky's tests unchanged). The build is Vite: vite-plugin-solid with `generate: "universal"` and `moduleName: "@opentui/solid"` (what `@opentui/solid/preload` does on Bun), `solid-js` aliased to `solid-js/dist/solid.js`, the client build that `@opentui/solid` imports (server conditions would pick `dist/server.js`, a second Solid), everything bundled except `@opentui/core` (it loads a native library), into one `dist/main.js` that `bun dist/main.js` runs. Engine gap: the build cannot be the `ssr` environment. cssints evaluates style modules there and turns the JSX of every module in it into calls of an inert `__jsx` (plugin.ts `inertJsx`), so an SSR build of the app throws `__jsx is not defined` at run time. The workaround is an environment of its own, `tui` (`consumer: "server"`, built by `builder.buildApp`). A TUI target that builds through Vite will meet the same gap. All styles are plain OpenTUI `style` objects in `src/styles.ts` (functions of the theme, dark or light, and a row's state), plus `hoverable()` for hover and the pointer cursor. The binding writes the keys of a `style` object and never clears the others, so each object sets every key it may have changed. The tests import the built file under Bun: `testRender` on 100x40, sky's recorded fixtures through a fake `fetch`, and assertions on the char frame and on the renderables (border colour of the selected card, background of the hovered one, the scroll position, the `setMousePointer` calls). OpenTUI's `waitForFrame` counts render passes, not time. A lone ESC waits for the key parser's timeout, so the tests poll on a clock. Keeping the selected row in view runs in the scrollbox's `renderBefore`: a microtask after the move sees the layout of the previous screen. Deferred: profiles, images, a "show anyway" for warned posts, terminal HMR, and the switch of styles.ts to the TUI target (cssints-m0yj).

## Devtools asks OpenCode about the picked element (cssints-ro4k)

After brendonovich/vite-plugin-opencode (MIT), which marks markup with Babel: cssints already has the context, so the overlay builds the prompt from the table and the inspection (the instruction, the element and its DOM path, its `css.*` calls as file:line plus call text, each property's winner and what it beat, the tokens; every list bounded, the whole cut at 16000). `cssints({ devtools: true, opencode: true | { agent?, skills? } })`, off by default, dev only; `@opencode/client` 2.0.26 is an optional peer of cssints. The dev server, never the page, finds the OpenCode V2 service (`Service.discover`), creates a session in the repository root, prompts and waits; the box shows the status, and a missing service is a message that keeps the text. The page talks over Vite's HMR channel (`cssints:devtools:ask` / `asked`), not a middleware route: a route can be posted to from any origin, the channel carries Vite's token. `@opencode/client` pins effect 4.0.0-rc.112, so the tsconfigs allow `effect` as a duplicated package. Cost: about 1 kB of dormant box code in the overlay chunk of a `"build"` site. Left: follow-up prompts and undo from the overlay, a model picker.

## Playground: Monaco, several files, the plugin packages (cssints-avlz)

`/playground` has Monaco 0.57 with the TypeScript worker (CodeMirror removed) and the cssints types as extra libs built at build time (the built `.d.mts` of cssints and css-grammar, the sources of the plugin packages). The type-level grammar is usable in the browser: the first check of the README example about 1 s, an edit 430–510 ms, 280 checks 700–780 ms, because the language service runs in its own worker, Monaco's own validation is off, and the page checks only the open file 400 ms after an edit. Several files with relative attributed imports (errors located in their file, all files in the hash as `#files=`, old `#code=` links open). The plugin packages that run without Node load as text and are instrumented like Node's runner does it (bundling them let the docs' own plugin transform them); icons, fonts and placeholder read files and are a located error. Parity: 224 cases (63 from the plugin packages, five multi-file projects), 0 differ. Cost: the docs entry unchanged; a first visit to /playground about 5.25 MB brotli (Monaco and TypeScript 1.9 MB of it). Found: the cssints plugin transforms any non-node_modules module that mentions `cssints`, so a plugin package cannot be bundled into another Vite project without an `exclude` option. Left: Monaco after the first paint, LightningCSS on demand, a target picker, icons over the playground's own `.svg` files.


## A terminal target: `cssints/tui` and `@cssints/tui` (cssints-3ff7, 2026-10-10)

The epic cssints-06ws wants cssints styles in a terminal app (OpenTUI first, then `@bomb.sh/tty`, cssints-kotl). A terminal has no stylesheet, no cascade and no custom properties, so `css.*` there compiles to prop objects and a small runtime applies the states and the theme (the user's decisions; design in docs/research/tui.md). The opt-in is the subpath `cssints/tui`, not a plugin option: the types must change (cells for lengths, only the properties a terminal has), which an option cannot do. Its members build `{ __tui }` nodes and the engine's `replacementOf` turns a site that holds one into an object literal, after every web shape has failed, so a web site does the same work as before (perf.mjs dev on 200 modules: 4.67 ms median per evaluation, in the range of master; the new branch is not reached). Units are rejected, not converted (no unit has one size in cells); colours are read at build time to hex by culori, and `color-mix()` or a relative colour by the evaluator of derived tokens; tokens are resolved per theme with the contrast check's `valueOf` and `together`, so a site carries its default values and what each named theme changes. Weighed: a theme table shipped once and looked up at run time (smaller sites, but the app would wire it and the module order would matter); per-site values need nothing. One engine fix came with it: the plugin instrumented the `ssr` environment of a build for evaluation, so `vite build --ssr` (a Bun app) shipped `__site` calls; now only the dev server's and the private build server's `ssr` are evaluation environments. The OpenTUI adapter (`attach`, `use`) hooks the renderable's `onMouseEvent`, so the user's own `onMouseOver` still runs (OpenTUI keeps one handler per event), sets the mouse pointer of `cursor` on over and `default` on out, and gives the caret to an editable's `cursorStyle`/`cursorColor`. Cost: the colour members use the web's `color` grammar; `bench/tui.ts` is 184,399 instantiations (tsc), 193,608 (tsgo), a new budget; the web budgets are unchanged. Tests in packages/tui: the plugin on fixtures (dev, SSR build, errors), the types, OpenTUI's test renderer under Bun (hover, press, out, theme, focus). Left: terminal HMR, text inheritance, per-side borders, `cv()` on terminal styles, the bomb.sh adapter.

## The @bomb.sh/tty adapter: `@cssints/tui/bomb` (cssints-kotl, 2026-10-10)

The second terminal adapter of the epic cssints-06ws. `@bomb.sh/tty` 0.9 (Clay in WASM) has no renderables: each frame is a list of ops and `term.render()` returns that frame's pointer events (`pointerenter`, `pointerleave`, `pointerclick`; no press event). So the adapter is two plain pieces on the neutral `resolve()`, and the core is unchanged: `openProps`/`textProps` map resolved props to the options of `open()` and `text()`, and `createTracker()` keeps `:hover` (enter to leave), `:active` (from `pointer.down` becoming true over the element to the release or a leave) and `:focus` (the id given to `ui.focus`) between frames. The events of a frame come after it is drawn, so `ui.render` draws it a second time when a state changed and a hover shows at once; weighed against showing it one frame late, which bomb.sh's own hover example accepts, but a press would then miss short clicks. bomb.sh has no setting for the mouse pointer or the caret shape, so the tracker writes OSC 22, DECSCUSR and OSC 12 itself, and `ui.reset()` undoes them. Found by the test: `output` is a view of the WASM memory that the next render reuses, so the first frame must be copied before the second render (it came out as garbage). What Clay cannot draw is left out at run time, since the build cannot tell which adapter a style goes to: `double` and `heavy` borders are single lines (one line set, `rounded` is a corner radius), margins, `flexShrink`, `flexBasis`, `flexWrap`, `-reverse`, `space-*`, `stretch`, `alignSelf`, `opacity`; `flexGrow` is `grow` on each axis without a size (Clay grows per axis). Cost: nothing in the engine or the types; `@bomb.sh/tty` is an optional peer. Tests: `node test/bomb.ts` renders the built fixtures at 30x8 and reads the ANSI output back as cells (border characters, colours, attributes, the OSC strings) through a pointer move, a press, a click, a theme switch, focus and the caret; `examples/bomb.ts` ran once in a pty (`script`) with SGR mouse input: hover, press, click and the theme key, then `q`. Left: scroll offsets (Clay's clip has none in the 0.9 ops), a key-driven focus helper, transitions as a style member.


## apps/sky-tui on `cssints/tui` (cssints-m0yj, 2026-10-10)

sky-tui was the app the TUI target (cssints-3ff7) aimed at; its styles were plain OpenTUI `style` objects, functions of a theme signal and of a row's state, with a hand-written `hoverable()` that called `setMousePointer`. Now `src/styles.ts` is written with `cssints/tui`: nine colour tokens through `createTokens` (dark by default), a `light` theme through `createGlobalTheme`, `css.hover()`, `css.focus()` and `css.cursor("pointer")`; the components put the styles on renderables with `use()` of `@cssints/tui/opentui`, and `t` and `--light` call `setTheme`. The selected row is the keyboard focus (`focusable` and `focus()` in an effect), so its accent border is a `:focus` style; this was chosen over a "selected" state, which `cssints/tui` does not have, and over remounting the row. The active tab is a second style and a second `<text>` under `<Show>`, since a renderable keeps the style it was attached with. The `tui` Vite environment is gone: since cssints-ybcm the plugin keeps the JSX of an SSR build, so the config is `build.ssr: "src/main.tsx"` with `ssr.noExternal: true` and `@opentui/core` external, and test/build.mjs's checks (one file, the externals, no inert JSX, one Solid) hold unchanged. Four bugs came up, each worked around in the app and written down: `use()` throws on a text node such as `<span>` (cssints-5vnf; `span(style)` resolves the props and follows the theme through a signal); a focused box draws OpenTUI's `focusedBorderColor` (#00AAFF), not the `:focus` border colour, which test/screens.mjs missed because it read `borderColor` off the renderable (cssints-pkpg; the test now reads the drawn cell, and `Row` sets `focusedBorderColor`); `cssints/dist/tui.mjs` drops the side-effect import of culori's colour modes under `"sideEffects": false`, so every terminal colour is a build error against the dist (cssints-649r; `import "culori" with { type: "cssints" }` in styles.ts); and the build's evaluation server ignores the app's `resolve.alias` (cssints-qnif; styles.ts imports only `cssints/tui`). `@cssints/tui` has no `dist/` in the repository, so the app aliases it to its source. Cost: dist/main.js is 169.8 kB (57.4 kB gzip), with the styles as object literals and the adapter bundled. Left: drop the four workarounds when the bugs are fixed.

## The four sky-tui bugs of the terminal target (cssints-649r, cssints-qnif, cssints-5vnf, cssints-pkpg, 2026-10-10)

sky-tui on `cssints/tui` (cssints-m0yj) found four bugs; each is fixed, and its workaround in the app is gone. `dist/tui.mjs` lost culori's colour modes because `tui.ts` imported `./color.ts` only for its side effect and the package says `"sideEffects": false` (cssints-649r). A `sideEffects` list was weighed and dropped, since the chunk names are hashed. Now `tui.ts` imports `parseColor` from `color.ts`: a used binding keeps the module and its `useMode()` loop. `test/tui-dist.mjs` runs `vp pack` into a temporary `node_modules/cssints` and builds a style module against that dist; every other test runs the source. The build's evaluation server ignored the app's `resolve.alias` (cssints-qnif). It now gets `resolve.alias` and the `conditions` and `externalConditions` of the app's `ssr` environment, which is where a dev server evaluates. It does not get `define`, other plugins or `noExternal` (sky-tui's `ssr.noExternal: true` would inline everything into the runner). `test/build-resolve.mjs` checks an alias and a custom export condition in dev and in a build. The OpenTUI adapter threw on a text node (`<span>`, `<a>`), because a text node is a `BaseRenderable` with no mouse events and no focus (cssints-5vnf). Now a text node gets the props and the theme, and no states. It emits no `destroyed`, so the adapter wraps its `destroyRecursively`, which `@opentui/solid` calls on a removed node. A focused box drew `focusedBorderColor` (#00AAFF), not the `:focus` border (cssints-pkpg). An Input had the same bug with `focusedBackgroundColor`. On every apply, the adapter now copies the current `borderColor`, `backgroundColor` and `textColor` into the `focused*` prop of the same colour, where the renderable has one. A box whose descendant has the focus thus draws its own border, which is CSS `:focus` and not `:focus-within`. `color` is now `textColor` on an editable or a select, where it was dropped. The render tests read the drawn cells. One question is still open: should `use()` follow a changing style, as sky-tui's active tab needs? A Solid ref runs once and the adapter knows no framework, so this needs a `restyle()` of its own (cssints-332g); the tab still swaps two elements. Cost: none in the bundle (sky-tui's `dist/main.js` is 170 kB, as before); `test/tui-dist.mjs` adds a `vp pack` (about 10 s of CPU) to the cssints tests. The tracked `dist/` of cssints has to be rebuilt on master before sky-tui builds again without the culori import.


## A system theme from the terminal's palette (cssints-q1j3, 2026-10-10)

The TUI epic (cssints-06ws) wanted Pi's system theme (earendil.com/posts/system-theme, Pi 1.0.4): a theme built at run time from the terminal's own colours instead of a palette the app ships. Research first: OpenTUI 0.5.17 already queries OSC 4/10/11 (`renderer.getPalette()`, 300 ms to give up on a terminal without OSC 4), turns on mode 2031 and re-queries on `CSI ? 997 n`, emitting `theme_mode` and `palette`, and it draws indexed colours (`RGBA.fromIndex`, `defaultForeground`); @bomb.sh/tty 0.9 has none of that (its input parser drops OSC replies, a colour is a packed RGBA number). So `@cssints/tui/system` holds the solver and a reply parser, and each adapter has a `followSystemTheme`: OpenTUI's feeds `getPalette` and its events, bomb.sh's writes the queries and takes the replies out of stdin's bytes before `input.scan()`. The API is `createSystemTheme(tokens, roles, options)` at run time, roles in the shape of the tokens (`{ hue: "blue", on: [t.color.bg, t.color.card], contrast: 3 }`); weighed and left: a `css.system()` token value in `createTokens` (build-time code for a run-time palette). The solver keeps a source colour that meets its rules, else bisects OKHSL lightness to the reversed WCAG ratio of the strictest rule at the source's hue and bell-scaled saturation, with the OKLCH chroma capped at the source's (Pi's Catppuccin Frappé bug); the WCAG maths is culori's, as in check.contrast, and no polynomial fit was copied from Pi. Fallbacks: the app's hues when only the background is reported, ANSI indices on OpenTUI and the static theme of the appearance on bomb.sh when nothing is; light or dark from the background, then the scheme report, then `COLORFGBG`, then dark. The theme table: sites now carry `vars` (the token of each colour prop, named without `--`, since a `--name` in a site's text counts as a token of the module and pulled in the web's derived-token runtime: found by test/tui.mjs), and `defineTheme(name, values, base)` is one shared run-time table over a static theme; static themes stay inline per site (no registration, no import order). sky-tui now starts on the system theme (`--light`, `--dark` and `t` keep the static ones). Tests: the solver on Gruvbox dark, Catppuccin Latte and Nord (every rule met, hue within 6°, chroma at most the source's), the replies as byte strings, the bomb.sh follower, OpenTUI's test renderer and sky-tui's screens on a fake terminal that answers OSC 4/10/11 and then turns light. Cost: culori's rgb/oklab/oklch/okhsl modes in the app (45 kB unminified of sky-tui's 227 kB bundle); no type budget moved (no change to the members' types). Left: the rebuilt `cssints/dist/tui.mjs` on master (until then a built app gets no `vars`, so the system theme leaves its colours static), and a check of real terminals (Ghostty, kitty, iTerm2, WezTerm) beyond the fake one.

## exclude, credits, npm publishing (cssints-ci7n, cssints-so8y, cssints-6tnn)

`cssints({ exclude })` (createFilter input: glob, RegExp or array; built once; the private build server gets it) leaves matching files alone in every environment, for a project that bundles a module mentioning `cssints` that is not a site; the attribute did not become the only marker, because a forgotten attribute would then be an `undefined` css in the browser instead of a located error; no `include`. The playground keeps loading plugin packages as text (the worker instruments them as project files). Credits: an audit of every package; a Credits section in each README, upstream notices where data or code is copied (fonts: Capsize's MIT text; css-grammar: THIRD_PARTY_NOTICES.md for mdn-data and BCD under CC0 and @webref/css under MIT; sky: NOTICE.md), one Credits table in the root README, a docs page and a footer link; open: the license of the Mise en Mode standard, the Mu fork's copyright line, the reset sources. npm: the 22 packages are publishable; npm keeps `workspace:*` and ships `src` and the `development` condition, and Changesets 3 calls npm for a bun workspace, so `scripts/stage.mjs` writes `packages/<name>/.publish` (publishConfig over the manifest, `workspace:` to `^version`, dist, README, LICENSE, notices) and `changeset publish --tag next` sends it (`publishConfig.directory`); fixed versioning (20 packages peer cssints, and trusted publishing wants every package published within 2 days of its configuration); `bun run release:check` checks all 22 tarballs and `--install` installs them together (it found three blockers in @cssints/mcp). CI: `release.yml` (changesets action, OIDC, npm >= 11.5.1); private repo, no provenance. Left: the first release from the laptop and the 22 trusted publishers (RELEASING.md).

## The devtools panel docks to any side (cssints-651s)

Four buttons in the panel header dock it right (default), left, top or bottom; a strip on its inner edge resizes it (at least 200 px, an 80 px strip of the page always left, capped by `min(Npx, 100vw|100vh)` in CSS); the dock and both sizes persist in `localStorage["cssints-devtools:dock"]`. The page is not pushed aside: the panel covers its side, and picking beside it, the highlight and the fab work in every dock, in dev and in the `"build"` overlay. Floating (drag-to-move) and a shortcut were left out. +3.5 kB in `dist/overlay.js`. `test/browsers.mjs` checks each dock, a pick beside the panel, a drag and a reload in Chrome, Firefox and WebKit.

## The docs site moves to cssints.dev (2026-10-10)

The user bought cssints.dev on Cloudflare (same account). `alchemy.run.ts` now has `domain: { name: "cssints.dev", redirects: ["cssints.accio.blue"] }`: the site is served at https://cssints.dev, and the old address answers with a 301 that keeps the path and the query (a redirect rule in the old zone, before the Worker). Deployed from the laptop; every reference to the old address (README, AGENTS.md, the package homepages, the release check, the workflow) points at the new one. The CI token needs zone permissions for cssints.dev too (apps/docs/README.md).


## A renderable follows a changing style: attach again, use() with an accessor (cssints-332g, 2026-10-10)

sky-tui (cssints-m0yj) found that an OpenTUI renderable kept the style it was attached with: its active tab swapped two `<text>` elements with `<Show>`. Now `attach(r, style)` on a renderable it has attached swaps the style (a WeakMap from the renderable to its restyle): the states, the theme listener and the hooks stay, a prop only the old style set goes back to the value saved before the first style (OpenTUI's default or the element's own prop), the `focused*` colours follow, and under the mouse the pointer turns to the new `cursor` or `default`. `use()` takes an accessor, `use(() => (props.active ? s.tabActive : s.tab))`, read each time the ref runs. The adapter imports no framework: Solid 1.9's universal `spread` calls the ref in a `createRenderEffect`, so the signals the accessor reads run it again; React calls the new ref of each render, which used to stack hooks and now restyles. A separate `restyle()` export, a handle returned by `attach`, and a framework effect passed to `use()` were weighed: attaching again needs no new name and fixes React too. bomb.sh's tracker needs nothing: it takes the style on each `open()` of a frame. The second check of this bean: a `<span>` styled through `use()` follows the system theme rebuilt under the same name (`defineTheme` of the theme in use calls every `onTheme` listener, text nodes included); render.ts and sky-tui's screens.mjs (the title and an author name, from Gruvbox and then Latte) pass without a change to the runtime. sky-tui's "Workarounds" section is gone.

## Docs landing page (cssints-idcq)

`/` is a landing page and the README overview is `/overview`. The page is one HTML string made at build time (`plugin/landing.ts`), prerendered into the document of `/` and swapped in by the app like the other pages (a lazy chunk of 2.4 kB gzip; the entry unchanged), styled with global rules on the existing tokens. The showcase is real output: `src/landing/button.ts` goes through the cssints plugin on a Vite server of its own at build time, and its module, its sheet and a real build error (a misspelt colour) are highlighted with the site's Shiki; `test/build.mjs` compares the document's panels with a fresh compile. HTML plus global rules was chosen over a Solid component so the prerendered copy and the app match with no flash. The install line says `cssints@next` (the first release goes out on the next tag). The logo palette the agent computed (`hue.accent` 303, neutrals tinted at 303, all text pairs over 5:1) waits for the palette work of cssints-et4y. Known: the dev server under `DOCS_BASE` 404s on `virtual:cssints/devtools` (older than this work).

## @cssints/rybitten and the docs palettes; the logo palette is the default (cssints-et4y)

`@cssints/rybitten` (rybitten 1.3.0, MIT, meodai / David Aerne) gives `color`, `wheel`, `shades` and `overrides` over RYBitten's historical cubes as DTCG hex data at build time, no runtime. The docs site's colours and modes point at a token group `pal`; a palette is a theme of `pal` on `:where([data-palette])` (`:where()` because a theme re-declares the aliases it sets and would beat the mode rules by order), and a cube also gets one theme per step of a 12-step RYB hue wheel (the continuous slider is gone: a runtime hue needs a theme per step). The picker has three cubes (Itten, Munsell, Albers) and the Radix, Flexoki, Open Props and Reasonable Colors sets; then the coordinator added the logo palette `cssints` and made it the default: neutrals tinted with the logo's purple (hue 303), the accent the TypeScript blue #3178C6 on light paper and #5b9be0 in the dark modes, text steps found by contrast (1722 pairs over every palette, hue and mode hold their floors; the logo palette's tightest is accentStrong on accentSoft, 4.60). Engine gaps found and worked around: loops that alternate `createGlobalTheme` sites overwrite each other's themes (`__at` resets the counter per site change), the build's private server ignores the project's vite config (packages without a dist are imported by path), a theme's re-declared aliases beat mode rules by order.

The old address went away (2026-10-10): the CI token got 403 on the zones' `http_request_dynamic_redirect` rulesets even with "Single Redirect: Edit" (a temporary cf-check workflow showed DNS and Workers routes at 200 and the rulesets at 403), so the user chose to drop cssints.accio.blue; `alchemy.run.ts` has `domain: "cssints.dev"` only, deployed from the laptop, and the CI token needs no rule permissions.

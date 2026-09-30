---
# cssints-vy0o
title: 'Map: cssints 0.1, the docs/API.md library working end to end'
status: todo
type: epic
priority: normal
tags:
    - wayfinder:map
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-30T10:20:15Z
blocked_by:
    - cssints-vzd9
---

## Destination

The API in `docs/API.md` works end to end in `apps/demo` on the Module Runner engine: typed property functions for every mdn property, conditions (`media()`, pseudo-classes) mapped to `@layer _.a.._.e`, tokens emitted as `@property`, `cx`/`cn`, and one optimized stylesheet through LightningCSS. The demo type-checks with tsc and tsgo, and the packages are ready to publish.

## Notes

- Log findings in `docs/wayfinder.md`; the map only indexes them.
- Tracker is beans. A ticket is a child of this epic with a `wayfinder:<type>` tag. Claim a ticket by setting it `in-progress`. The frontier is `beans list --ready --parent <this map>`.
- Execution is allowed on this map, as on the previous one (`cssints-tmv8`): a decision ticket may end with an implementation ticket that does the work.
- Standing preferences: tsgo is the primary type checker, and tsc 5.9 must stay green; grammars come verbatim from mdn-data, with ranges from @webref/css; every type-level change is checked with `bun run bench`; minimal code (ponytail); Effect TS 4 where there are side effects (AGENTS.md).
- Parallel work goes in `.worktrees/<branch>`; the coordinator merges.

## Decisions so far

- [Grammar coverage: all mdn properties](cssints-unkt): all 892 grammars parse; an unused big table costs 0 instantiations, ~4.2 k per call; blockers are unit range bounds, `{A,}`, 15 missing primitives and one TS2589 outlier (font-variant). Decision: every standard and experimental property at once, nonstandard out. Findings: docs/research/grammar-coverage.md; implementation: [All standard properties](cssints-lmru) (done: 529 properties, 0 unexplained Chrome rows, font-variant 50 k, <declaration> opaque in types)
- [Surfaces and frames](cssints-1xqr): Ariakit's parent-relative colour and concentric radius reduce to tiny kernels emitted once (frame 667 B, surface 434 B minified, against ~4 KB and ~12 KB), with per-site custom properties; the odd/even `@container style()` trick sets the floor at Firefox 151 / Safari 18; `inherit()` would remove it but ships nowhere. Recommendation: not 0.1; `frame()` then `surface()` as an opt-in module later; 0.1 keeps a seam (a global rule by key in a layer `_.k` below `_.a`). Findings: docs/research/surfaces-frames.md
- [Plugin API: registered properties and functions, build-time lowering, runtime polyfills](cssints-rq2r): no native CSS Parser Extensions to rely on; the compiler knows its classes, so a 730 B gzip runtime reproduces style-query results exactly (Chrome, Firefox, WebKit); the contract is members + kernels by key in `_.k` + a runtime declared as data and chosen by BCD; plugin grammars feed the recognizer unchanged. Recommendation: 0.1 ships internal seams only. Findings: docs/research/plugins.md
- Plugin scope (after [Plugin API research](cssints-rq2r)): 0.1 has no public plugin API, only the internal seams already in (`addGlobal` by key into `_.k`) and the five WebKit-only properties as a built-in list ([Built-in WebKit-only properties](cssints-6fay)). The public contract, `frame()` and icons are 0.2.
- [How atomic CSS libraries emit and order CSS in Vite](cssints-wx85): one global sorted sheet (layer, condition, shorthand before longhand, class), filled late in build; per-module CSS cannot order rules inside a layer. Findings: docs/research/css-output.md
- [Engine build cost at scale](cssints-grrd): evaluation is ~90% of plugin time; keeping the cssints library loaded in the runner (clear only app modules) halves it, 500 modules build in 4.7 s instead of 9.7 s. Findings: docs/research/engine-cost.md
- [Public API shape for 0.1](cssints-5dbi): import attribute `with { type: "cssints" }` marks build-time code; camelCase names + p/m/bg; 0.25rem numbers only for spacing; variadic parts; chaining only on `flex()`/`grid()` with prefix-dropped names. Spec: docs/API.md "Authoring surface"; implementation: [Implement the 0.1 authoring surface in the engine](cssints-7fdc), done: sites by attribute (helpers and other packages too), names from the grammar, flex()/grid() chains with an mdn drift test; demo CSS byte-identical
- [Conditions and layers](cssints-kpq1): nesting wrappers `media()` (string, tuple or object form), `container()`, `supports()`, pseudo-class wrappers from mdn; queries checked by the mdn grammar; layer = number of conditions, `_.a` to `_.e`. Spec: docs/API.md; implementation: [Implement conditions and layers](cssints-mjgx) (done: wrappers, layers, query checks, _.k seam, demo)
- [CSS output pipeline](cssints-euf0): one global sorted virtual sheet (layer, condition, shorthand before longhand, class); placeholder filled in `renderChunk`, Vite 8 only; one sheet per app; LightningCSS through Vite with browserslist targets shared with support warnings; longhand beats shorthand by sort order. Implementation: [Implement the global sorted stylesheet](cssints-vzd9), done: virtual:cssints.css, dedupe, sort by layer/condition/leaf count/class, dev re-send on cold load, renderChunk fill, model invariant sheetFresh
- [One runtime package](cssints-lo9x): `cssints` is the only runtime (`cx`, `_cv`), `@cssints/variants` deleted; `cx` strings, falsy values and arrays; `cn` build-time only; `cv` takes css.* values. Spec: docs/API.md; implementation: [Implement the single runtime and typed cv](cssints-e2nn), done: variants deleted, cv on css values, demo CSS byte-identical
- [Token model](cssints-o00x): a token is a Typed OM value `var(--x)`; `token.<type>` for every @property syntax type, with the initial value checked by the grammar; named tokens can be set, unnamed ones are private and hashed; one `@property` per token at the top of the sheet; `style()`/`token.set()` static at build time. Spec: docs/API.md; implementation: [Implement tokens](cssints-79xr) (done: token.<type>, @property in the sheet with clash errors, style()/token.set(), font-relative initial values are errors; <color> extended (cssints-gcuz: relative colour, contrast-color(), if(), var()); typed public surface done (cssints-v63t: Prop<P> for 536 members, Style brand, typed chains and cv; ~200 ms LSP diagnostics); [Math functions everywhere](cssints-91im) done (typed mathScan in the twin, name + balance in types); follow-up [Token types](cssints-7rot) done (resolution/url/image, sentinel matrix)); follow-up research: [Design-token constraints and math](cssints-kag5) — done: DTCG 2025.10 has no constraints or math; Ariakit contrast = build-time table + relative colours; compiler can check static things (types, aliases, theme completeness, contrast per theme). Findings: docs/research/design-tokens.md; next: [Themes and token constraints for 0.1](cssints-exof)
- [Themes and token constraints for 0.1](cssints-exof): inline DTCG-shaped tokens with property access, `createGlobalTheme` for a condition or a selector, aliases flattened for `@property` plus a live `var()`, and `css.check.contrast` per theme (a build error below min). Spec: docs/API.md "Themes"; implementation: [Implement themes and css.check.contrast](cssints-7qqw) (done: DTCG createTokens, aliases, themes on :root/:where(*)/selector in _.k, WCAG check with culori at build time, demo dark theme)
- [Engine language and Effect scope](cssints-odi9): Effect everywhere (typed errors, laziness, spans), except the sync css.* node builders in user code; .ts sources, tsdown for publishing; checks are tsgo + effect-tsgo diagnostics; oxlint/oxfmt clean is a 0.1 gate. Implementation: [Port the engine to TypeScript and Effect](cssints-djzw) (done: .ts + Effect with call-site errors, perf within ~10%, tsgo + effect-tsgo clean, vp pack, lint/fmt clean), before conditions and tokens, after [Move the monorepo from turbo to Vite+](cssints-ny2w) (done: vp run/lint/fmt/check, bun kept, test cached where possible; lint baseline 1443 errors, fmt ~60 files, plugin-icon has 3 syntax errors)

- [Built-in WebKit-only properties](cssints-6fay), [JSDoc on generated members](cssints-7pv1), [Ship 0.1](cssints-808j): done. Tarballs install into a fresh Vite 8 app (`bun run test:smoke`); npm names free; publish 0.1.0 of both together; LICENSE and README still missing.

- [0.1 docs and demo pass](cssints-gcho): API.md rewritten against the code with a doc test for every code block, README, a demo tour of every feature checked in Chrome. Findings: [Build-time evaluation edge cases](cssints-wigi) (done: unreached sites hoisted, eval-time _cv, located runtime-value error, QueryWrap), [race.mjs flake](cssints-jwdw) (done: harness settle() fix, plugin and model unchanged), [flex/grid/container shorthands](cssints-cmgv), [vp fmt config](cssints-uhu6)

- [Prefer webref property grammars where mdn-data is stale](cssints-h6qk): switch per property by a Chrome-backed rule (47 today: agreement 88.6% to 90.0%, reverse rows 2300 to 1499, budget +0.5%); switching everything would add draft syntax and cost 11-14%. Implementation: [Per-property webref grammars](cssints-pctg)

- [Pending substitution: var() and if() in any property value](cssints-xrzv): var(), env() and if() stand for any run of component values anywhere, and the rest is still checked (stricter than Chrome); +2-3% type budget.

## Not yet specified


- Shorthand vs longhand through sublayers instead of sort order: `_.a.a/_.a.b/_.a.c` per condition layer (15 layers), depth from mdn-data `computed` by leaf-set inclusion (max depth 2; `border` → `border-top` → `border-top-color`, which the direct links miss; exclude `all`). Order-independent, but more layers and DevTools noise. Deferred on 2026-09-29; logical vs physical pairs (`margin-inline-start` vs `margin-left`) stay order-dependent either way.

- Derived tokens (`contrastColor()` in CSS, `derive()` at build time) and JSON token input with generated types (cssints-exof).
- Value helper functions (`css.colorMix(...)`, API.md "Functions"): whether they exist next to typed string parts, and how they are typed.
- Error DX: the type error for a bad typed part lands on the first argument; editor completions inside string literals (arktype `Completion` style); Vite overlay pointing at the call site.
- `cn` conflict resolution ("resolve class order specificity"): what happens with `cn(p(4), pl(2))`.

## Out of scope

- Publishing to npm in this effort (decided 2026-09-30): 0.1 stays packable (`bun run test:smoke`) but unpublished. License is MIT.

- Public plugin API, `frame()`, `surface()` and icons on it: 0.2 (cssints-rq2r, cssints-1xqr).

- `packages/plugin-icon`: not ported to the new engine for 0.1.
- Bundlers other than Vite (the engine is built on the Vite Module Runner).
- A non-compiled runtime mode (styles computed in the browser).

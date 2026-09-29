---
# cssints-vy0o
title: 'Map: cssints 0.1, the docs/API.md library working end to end'
status: todo
type: epic
priority: normal
tags:
    - wayfinder:map
created_at: 2026-09-29T13:28:04Z
updated_at: 2026-09-29T14:34:21Z
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

- [How atomic CSS libraries emit and order CSS in Vite](cssints-wx85): one global sorted sheet (layer, condition, shorthand before longhand, class), filled late in build; per-module CSS cannot order rules inside a layer. Findings: docs/research/css-output.md
- [Engine build cost at scale](cssints-grrd): evaluation is ~90% of plugin time; keeping the cssints library loaded in the runner (clear only app modules) halves it, 500 modules build in 4.7 s instead of 9.7 s. Findings: docs/research/engine-cost.md
- [Public API shape for 0.1](cssints-5dbi): import attribute `with { type: "cssints" }` marks build-time code; camelCase names + p/m/bg; 0.25rem numbers only for spacing; variadic parts; chaining only on `flex()`/`grid()` with prefix-dropped names. Spec: docs/API.md "Authoring surface"; implementation: [Implement the 0.1 authoring surface in the engine](cssints-7fdc), done: sites by attribute (helpers and other packages too), names from the grammar, flex()/grid() chains with an mdn drift test; demo CSS byte-identical
- [Conditions and layers](cssints-kpq1): nesting wrappers `media()` (string, tuple or object form), `container()`, `supports()`, pseudo-class wrappers from mdn; queries checked by the mdn grammar; layer = number of conditions, `_.a` to `_.e`. Spec: docs/API.md; implementation: [Implement conditions and layers](cssints-mjgx)
- [CSS output pipeline](cssints-euf0): one global sorted virtual sheet (layer, condition, shorthand before longhand, class); placeholder filled in `renderChunk`, Vite 8 only; one sheet per app; LightningCSS through Vite with browserslist targets shared with support warnings; longhand beats shorthand by sort order. Implementation: [Implement the global sorted stylesheet](cssints-vzd9)
- [One runtime package](cssints-lo9x): `cssints` is the only runtime (`cx`, `_cv`), `@cssints/variants` deleted; `cx` strings, falsy values and arrays; `cn` build-time only; `cv` takes css.* values. Spec: docs/API.md; implementation: [Implement the single runtime and typed cv](cssints-e2nn), done: variants deleted, cv on css values, demo CSS byte-identical
- [Token model](cssints-o00x): a token is a Typed OM value `var(--x)`; `token.<type>` for every @property syntax type, with the initial value checked by the grammar; named tokens can be set, unnamed ones are private and hashed; one `@property` per token at the top of the sheet; `style()`/`token.set()` static at build time. Spec: docs/API.md; implementation: [Implement tokens](cssints-79xr); follow-up research: [Design-token constraints and math](cssints-kag5)
- [Engine language and Effect scope](cssints-odi9): Effect everywhere (typed errors, laziness, spans), except the sync css.* node builders in user code; .ts sources, tsdown for publishing; checks are tsgo + effect-tsgo diagnostics; oxlint/oxfmt clean is a 0.1 gate. Implementation: [Port the engine to TypeScript and Effect](cssints-djzw), before conditions and tokens

## Not yet specified

- Shorthand vs longhand through sublayers instead of sort order: `_.a.a/_.a.b/_.a.c` per condition layer (15 layers), depth from mdn-data `computed` by leaf-set inclusion (max depth 2; `border` → `border-top` → `border-top-color`, which the direct links miss; exclude `all`). Order-independent, but more layers and DevTools noise. Deferred on 2026-09-29; logical vs physical pairs (`margin-inline-start` vs `margin-left`) stay order-dependent either way.

- Themes: `createTokens` / `createGlobalTheme` from design-token JSON (DTCG 2025.10), after the token model is decided.
- Value helper functions (`css.colorMix(...)`, API.md "Functions"): whether they exist next to typed string parts, and how they are typed.
- JSDoc on the generated functions: syntax, BCD support table and MDN link, as in API.md "Browser Compat".
- Error DX: the type error for a bad typed part lands on the first argument; editor completions inside string literals (arktype `Completion` style); Vite overlay pointing at the call site.
- Publishing: package names (`cssints`, `@cssints/*`), a build step or source exports, versioning.
- `cn` conflict resolution ("resolve class order specificity"): what happens with `cn(p(4), pl(2))`.

## Out of scope

- `packages/plugin-icon`: not ported to the new engine for 0.1.
- Bundlers other than Vite (the engine is built on the Vite Module Runner).
- A non-compiled runtime mode (styles computed in the browser).

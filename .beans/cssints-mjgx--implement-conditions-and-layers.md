---
# cssints-mjgx
title: Implement conditions and layers
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:17:14Z
updated_at: 2026-09-29T16:16:57Z
parent: cssints-vy0o
blocked_by:
    - cssints-euf0
    - cssints-vzd9
    - cssints-djzw
---

## Question

Implement `docs/API.md` "Conditions and layers" (decided in cssints-kpq1). Blocked by the output pipeline decision, because the rule order inside a layer comes from the sorted sheet.

- [x] `media` (string, several strings to a tuple, object to an object), `container`, `supports`, and pseudo-class wrappers from mdn-data `selectors.json`; wrappers nest
- [x] Query strings checked by the twin against `<media-query-list>`, `<container-condition>` and `<supports-condition>` (extract those syntaxes); type-level check with the budget measured
- [x] Layer = condition count, `_.a` to `_.e`; a fifth condition is a build error; class hash includes the condition chain
- [x] Rules emitted under their conditions and layers; fixtures cover nesting, the layer cap, and a bad query
- [x] The demo uses at least one media and one hover

- [x] Seam from cssints-1xqr: reserve the layer `_.k` below `_.a` (`@layer _.k, _.a, …`) and let the sheet builder add a global rule by key, once, into it

## Summary of Changes

- **Grammars** (css-grammar): `extract.mjs` gets one block that adds `<media-query-list>`, `<container-condition>` and `<supports-condition>` with their closures to `syntaxes` in mdn.ts. Sources are @webref/css first (its `<media-condition>` is linear; mdn-data's retries every alternative) and mdn-data where webref has none. Deviations: no `<general-enclosed>` (an unknown feature is an error, not "false"); `<ident>` is `<custom-ident>`; the spec's `<size-feature>` and `<scroll-state-feature>` (mdn-data says `<media-query-list>`); `supports()` takes `( <declaration> )` over the extracted properties (no `selector()`, `font-tech()`); `style()` queries take standard properties only, not custom properties. `query.ts` is the type-level check (`ValidQuery`, `Condition`), `checkQueryNow` / `checkQuery` in check.ts the twin. Both space out `:` and `/` first, so twin-core.ts and the lexer are untouched. css.ts: `Stuck` and `Unexpected` exported, and `NotIdent` also rejects `= < > : /` (an ident cannot start with them; `(width >= )` passed the types).
- **Engine**: `media` (string, tuple, object), `container`, `supports` and 49 pseudo-class wrappers (standard, no arguments, group Selectors; `default` skipped, a reserved word). A wrapper puts a condition in front of the chain of each declaration of its styles; the class hash includes the chain; layer = chain length (`_.a` to `_.e`); a fifth condition is a MacroError at the call site. `const md = css.media(..)`, `const [a, b] = ..`, `const { md } = ..` bind site roots (instrument.ts), so `md(css.p(4))` is a site of its own and the binding itself ships as `null` of the same shape. Rules carry `wrap` (at-rules) and a `cond` key (max min-width in px, then pseudo-class places); the sheet groups a layer's rules by at-rule chain.
- **Seam**: `@layer _.k, _.a, …, _.e;` and `addGlobal(key, css)` (sheet.ts, exported from the plugin): once per key, rendered in `_.k` before `_.a`.
- **Demo**: `md(flexDirection("row"))` on the feature list and hover on buttons and cards.
- **Not changed**: the HMR model. Conditions add no async step (wrappers are synchronous builders, sites and classes flow as before), so runner.qnt is unchanged; race.mjs and mbt are green.

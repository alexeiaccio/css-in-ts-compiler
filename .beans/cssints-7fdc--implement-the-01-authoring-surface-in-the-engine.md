---
# cssints-7fdc
title: Implement the 0.1 authoring surface in the engine
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T13:53:19Z
updated_at: 2026-09-29T14:03:33Z
parent: cssints-vy0o
---

## Question

Make the engine match `docs/API.md` "Authoring surface" (decided in cssints-5dbi). The public types are the separate prototype ticket.

- [x] plugin.mjs: find sites by `with { type: "cssints" }` on any import (cssints, other packages, local helper modules), not by the package name. A build error for a build-time member of cssints imported without the attribute; `cx`/`_cv` stay runtime.
- [x] lib.mjs: names generated from the grammar property list (camelCase of every property in mdn.ts) plus the short set p/pt/pr/pb/pl, m/mt/mr/mb/ml, bg. Remove `items`, `justify` and the hand-written PROPS table.
- [x] Spacing: a bare number is 0.25rem only in padding*, margin*, gap*, inset*. Elsewhere it is `String(n)`, checked by the twin.
- [x] `flex()` / `grid()`: display plus chain methods from short hand-written lists (prefix dropped only for flex-*/grid-*), with a test against mdn-data `appliesto` that fails on drift. Remove nested-children composites and bare-member chains (`css.flex.items`); plain styles do not chain.
- [x] Migrate the fixtures and apps/demo to the new surface; `bun run test` and the demo build pass.

## Summary of Changes

- `plugin.mjs`: `findCssImport` takes every import `with { type: "cssints" }` (any source) as site roots. `import ... from "cssints"` without it may only name `cx`/`_cv`; anything else throws `cssints: <file> imports build-time p from "cssints" without the attribute. Import it as: import { p } from "cssints" with { type: "cssints" }; ...`. The client drops every attribute import and keeps runtime ones untouched. Sites inside functions are no longer hoisted into the module body: they go into an exported `__cssints_hoisted()` that the runner calls only on the module it evaluates, so a helper module (whose css calls use its parameters) loads fine as a dependency. A file with attribute imports but no sites still loses them in the client.
- Names: `PROPS` in `lib.mjs` is derived (camelCase of every key of `@cssints/css-grammar/mdn` `properties`, plus p/pt/pr/pb/pl, m/mt/mr/mb/ml, bg); `items`/`justify` and the table are gone. `extract.mjs` still reads `PROPS`, so its default is now the current grammar set (unchanged output). The 58 hand-written member exports in `macro.mjs` are gone too: named imports cannot be derived at runtime, so the plugin rewrites an attribute import of cssints (in the runner code only) to destructure the `css` Proxy (`const { "p": p } = __css0`). Real exports left: `css`, `cn`, `cv`, `flex`, `grid`, `CSS`, `CSSColorValue`, `CSSUnitValue`, `__site`.
- Spacing: a lone number is `n*0.25rem` only for `padding*`, `margin*`, `inset*`, `gap`, `row-gap`, `column-gap`; elsewhere `String(n)` for the twin (`zIndex(3)` → `z-index:3`).
- Contexts: `flex()`/`grid()` take no arguments, set `display`, and chain only `CONTEXTS` (lib.mjs); unknown method → `cssints: flex() has no .padding(); it chains direction, wrap, ...`; chaining a plain style → `cssints: plain styles do not chain (.m); merge them with cn(...) or cx(...)`. The `flex`/`grid` shorthand properties are shadowed by the contexts. Nested children (`css.flex(css.items(...))`) and bare-member chains are gone; a style passed as a property value is an error. `test/contexts.mjs` checks the lists against mdn-data `appliesto`; besides the listed exceptions it also skips the `grid` shorthand (gridContainers in mdn). Grid chain methods other than gaps/alignment need grammar coverage (cssints-unkt) before they validate.
- Fixtures migrated (risk1-chain is the flex-chain fixture, risk1-vars uses named imports); new `helpers.ts` + `helper-use.ts`, `no-attribute.ts`, `chain-error.ts` (the error ones are grepped for their message in `bun run test`). hmr app, spec harness, perf.mjs, README and apps/demo migrated; demo CSS is byte-identical.

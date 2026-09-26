---
# cssints-iz4o
title: Plugin treats top-level CSS.* constructor calls as style sites
status: completed
type: bug
priority: normal
created_at: 2026-09-26T10:30:07Z
updated_at: 2026-09-26T11:46:45Z
parent: cssints-tmv8
blocked_by:
    - cssints-hdui
---

From cssints-bqy4. In a module that imports `CSS` from `cssints`, `const x = CSS.rem(1)` at top level fails with "site 0 ... did not produce a css.* or cv() value". `plugin.mjs` instrumentation wraps every call rooted in a `cssints` import. `CSS.*` inside a `css.*` call works, and so does `new CSSColorValue(...)`.

Not doing this: skipping constructors would leave `CSS.rem(1)` in client code without its import, or pull `macro.mjs` into the bundle. Instead, constructor calls (`CallExpression` and `NewExpression`) are sites whose replacement is their CSS text.
- [ ] A fixture with a top-level `CSS.rem(1)` token used in a later `css.p(...)`
- [x] Blocked by cssints-hdui only because both edit plugin.mjs (merged first)

Related, lower priority: the type error for a bad typed part is reported on the first argument, not on the offending part.

## Summary of Changes
- `plugin.mjs`: `NewExpression` rooted in a cssints import is a site, like `CallExpression`.
- `macro.mjs` `__site`: a `CSSStyleValue` result is replaced by `JSON.stringify(String(value))`.
- Also fixed a client leak: `fixtures/tokens-typed.ts` (`new CSSColorValue`) used to pass through untouched and import `macro.mjs` into the client. It now ships `export const accent = "#3b82f6"`.
- New fixture `fixtures/typed-top.ts`. All fixtures, the HMR tests in both orders, `spec/race.mjs`, `spec/mbt.mjs` and the `app-react` build pass, with no leak in the bundle.
- Not done: putting the type error on the offending part instead of the first argument (left as a note).

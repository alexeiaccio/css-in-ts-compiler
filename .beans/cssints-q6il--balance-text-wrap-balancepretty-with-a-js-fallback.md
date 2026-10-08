---
# cssints-q6il
title: 'balance(): text-wrap balance/pretty with a JS fallback'
status: completed
type: feature
priority: normal
created_at: 2026-10-08T08:55:58Z
updated_at: 2026-10-08T13:52:33Z
parent: cssints-dk1q
---

## What
`balance()` / `pretty()` members: `text-wrap: balance` and `pretty` natively, text-balancer-style script as the BCD-chosen runtime for older targets.

## Sources
- https://github.com/nytimes/text-balancer
- https://github.com/shuding/react-wrap-balancer

## Todo
- [x] members + runtime
- [x] fixture

## Engine gaps

1. **A runtime cannot ship a script of its own.** `runtimeModule` (packages/cssints/src/delivery.ts) emits only
   `cssints/parent-vars` (for `parentVars`) or `cssints/derived`; any other runtime's module is `export {};`. Repro:
   `scope("x", { "#k": { css: "&{a:b}" }, "#r": { polyfills: ["css.properties.text-wrap.balance"], css: "&{--_j:1}" }, m: { args: [], uses: ["k", "r"] } })`,
   use `m()` with `BROWSERSLIST="safari 17.3"`: `virtual:cssints/runtime/x.r` is `export {};`. Workaround: the runtime is
   the subpath `@cssints/balance/runtime` the app imports; the BCD choice is the fallback CSS (`--balance-js: 1` in
   `@supports not`, only in the sheet when a target lacks the feature), which the script reads. Cost: a missing import is
   silent, since a `css` runtime covers the key everywhere.
2. **A kernel written as styles warns for its own declarations even when a runtime in `uses` polyfills the key.** Repro:
   `"#core": { css: (css) => [css.textWrap("balance")], requires: [...] }` with `polyfills: ["css.properties.text-wrap", "css.properties.text-wrap.balance"]`
   in the member's runtime: `text-wrap: the property in "balance" is not supported by chrome 109 (css.properties.text-wrap)`
   with default targets. Workaround: raw CSS kernels (`&{text-wrap:balance}`) plus an explicit `conflicts` entry, since a
   raw kernel derives none.
3. **A kernel-only member under a condition drops the condition silently.** Repro: `hover(pretty())` gives
   `"_balance-prettyCore"` and the sheet has `._balance-prettyCore{text-wrap:pretty}` unconditionally, no error.
   Documented as a limit in the README.

## Summary of Changes

- `packages/balance` (`@cssints/balance`): `balance()` (raw kernel `text-wrap: balance`, `requires`
  `css.properties.text-wrap.balance`, a runtime entry whose fallback CSS sets `--balance-js: 1` in
  `@supports not (text-wrap:balance)`, a `text-wrap*`/`white-space` conflicts entry) and `pretty()` (`text-wrap: pretty`,
  no requires, no runtime, no warning: degrades to normal wrapping).
- `src/runtime.ts` (`@cssints/balance/runtime`): binary search of the narrowest `max-width` keeping the height,
  rerun on parent resize (ResizeObserver), text/added nodes (MutationObserver) and `document.fonts.ready`; 552 B min+gzip.
- Tests: `test/balance.mjs` (output, no warnings, fallback CSS present for `chrome 110, safari 17.3, firefox 120` and
  absent for modern targets, runtime module empty, conflict), `test/types/balance.ts`, `test/browsers.mjs`
  (`test:browsers`: native, forced runtime incl. resize, blinded control in Chrome, Firefox, WebKit).
- README with example, emitted CSS, browsers, rules, limits.

Deferred: delivery of the script through `virtual:cssints/runtime/*` once the engine supports a plugin script (gap 1);
vertical writing modes; keeping the box width (padding instead of max-width) for centred text.

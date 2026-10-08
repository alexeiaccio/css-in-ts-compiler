---
# cssints-ni5c
title: 'fluid(): fluid typography as a value member'
status: completed
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:12:45Z
parent: cssints-dk1q
---

## What
A value member `fluid(min, max, { from?, to? })` that computes `clamp(min, <slope>vw + <intercept>, max)` at build time, between two viewport (or container) widths. Returns a Typed OM length so it goes only where a length goes.

## Sources
- https://matthiasott.com/notes/compressed-fluid-typography
- https://master.dev/blog/fluid-typography-with-progress/
- https://github.com/barvian/fluid-tailwind (has the WCAG 1.4.4 zoom check: fails when the value cannot reach 200% at 5x zoom)
- https://github.com/Typetura/Typetura (container-based fluid type)

## Shape
- `{ args: ["<length>", "<length>", { "from?": "<length>", "to?": "<length>" }], value }` on a scope `fluid`.
- Defaults for `from`/`to` from a token set if one is given (`$tokens`), else 20rem..80rem.
- Build error when the result fails the 1.4.4 check (fluid-tailwind's rule), with the two widths in the message.
- `cqi` variant: `fluid.container()`.

## Todo
- [x] value member with the clamp math and Typed OM result
- [x] 1.4.4 check as a build error
- [x] fixture + type test
- [x] packages/fluid/README.md section (instead of docs/API.md)

## Engine gaps

Worked around inside packages/fluid; nothing changed in the engine.

1. **A value member takes only a grammar string as `args`.** It has no positional tuple and no trailing options object,
   which call members have. So `fluid(min, max, { from?, to? })` cannot be a value member as written. Workaround: the
   members take four lengths as parts (`"<length [0,∞]> <length [0,∞]> <length [0,∞]> <length [0,∞]>"`), and the
   package exports a plain wrapper that fills in the defaults. Repro:
   `scope("x", { f: { args: ["<length>", { "to?": "<length>" }], value: () => "1px" } })`: `ValueDef.args` is `string`.
2. **A member key must be a name, and a value member has no methods.** `fluid.container()` cannot come from the table:
   the key `"fluid.container"` throws `cssints: fluid: the entry "fluid.container" is not a name`. Workaround: the member
   `fluidContainer`, attached to the wrapper with `Object.assign`. The grammar errors of that member say
   `fluidContainer: unexpected ...`, not `fluid.container`.
3. **A plugin module cannot import a Typed OM class from "cssints".** The docs/API.md "Functions" example
   (`import { CSSColorValue } from "cssints"` in a plugin module) fails in a module outside node_modules:
   `cssints: <file> imports build-time CSSColorValue from "cssints" without the attribute ... (only cx is runtime)`.
   The same applies to `css.clamp`. Repro: the docs example `tint` in a local `.ts` plugin, used from a fixture with
   `with { type: "cssints" }`. Workaround: `CSSStyleValue` from `@cssints/css-grammar/values` (a dependency of the
   package), subclassed as a `clamp()` text, as cssints' own `CSSMathValue` does. The engine has no exported math Typed
   OM class for this.

## Deferred

- Defaults for `from`/`to` from a token set (`$tokens`), and token arguments: a value member gets a token as
  `var(--name)`, which the build cannot compute with.
- A switch to turn off the 1.4.4 check for lengths that are not text (fluid spacing).

## Summary of Changes

- New package `packages/fluid` (`@cssints/fluid`): `fluid(min, max, { from?, to? })` and
  `fluid.container(...)`. Each computes `clamp(min, <slope>vw|cqi ± <intercept>rem, max)` at build time and returns a
  Typed OM length (`CSSStyleValue<"length">`). px and rem only; the defaults are 20rem to 80rem.
- The WCAG 1.4.4 check of fluid-tailwind is a build error at the call. The check is generalized to every width (the
  kinks of the two piecewise-linear curves) and to values that shrink.
- Other build errors: units that are not px or rem, `min` equal to `max`, `from` not below `to`, and bad grammar.
- Tests: test/fluid.mjs runs the fixtures through the engine (output and the errors, with their lines).
  test/types/fluid.ts is the type test, run by the typecheck script.
- README.md documents it in place of a docs/API.md section.

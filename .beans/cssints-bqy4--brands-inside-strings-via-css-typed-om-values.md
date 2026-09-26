---
# cssints-bqy4
title: Brands inside strings via CSS Typed OM values
status: completed
type: feature
priority: normal
created_at: 2026-09-26T08:10:17Z
updated_at: 2026-09-26T10:29:07Z
parent: cssints-tmv8
---

How a token or constructed value (`CSSUnitValue`, `CSSColorValue`) goes inside a string-form CSS value.

## Decision

- API: variadic typed parts joined by a space: `border("1px solid", accent)`, `padding(space.md, CSS.rem(2))`, and still `padding("1rem 2rem")`. Tagged templates are rejected: TS types the `strings` of a tagged template as `TemplateStringsArray` with no literal types, so the recognizer cannot see them.
- Values are CSS Typed OM shaped: minimal classes in the style of the spec (`CSSUnitValue(value, unit)`, `CSSKeywordValue(value)`, `CSSColorValue` for tokens), constructors `CSS.px(4)`, `CSS.rem(1)`, `CSS.percent(50)`, `CSS.number(1)`, and `toString()` serialization. No math, no transforms. The static type carries the CSS value type name as a phantom (`CSS.px(4)` is a length, `CSS.percent(50)` a percentage, a color token `<color>`).
- Type level: a typed value becomes a sentinel token in the joined string (`⟨length⟩`, `⟨color⟩`). It matches a `<type>` node when the node is that type, or a primitive whose set includes it (`⟨length⟩` matches `<length>` and `<length-percentage>`). For a named non-primitive syntax (`<color>`), a `⟨color⟩` sentinel matches before descending. Plain string parts stay literal.
- Runtime twin: no sentinels. At build time the value is known: join the parts with `toString()` and validate the real text with `valid`.

Step 1 finding (tsc 5.9.3 and tsgo 7.0.0-dev, same result):
- tagged template ``tag`1px solid ${accent}` `` with `<const S extends TemplateStringsArray>`: `S` is inferred as plain `TemplateStringsArray`, no literal parts. Rejected, as expected.
- plain template argument ``border(`1px solid ${accent}`)`` with a `const` type parameter: an object interpolation widens to `` `1px solid ${string}` ``, so the token type is lost. It survives only when the token is statically typed as a string (`"⟨color⟩" & brand` gives `` `1px solid ${"⟨color⟩" & {...}}` ``), which lies about the runtime value (an object) and still is not a plain literal. Not usable.

## Checklist

- [x] Step 1: tagged template / template literal check (tsc + tsgo)
- [x] values.ts: Typed OM classes and `CSS.*` constructors
- [x] css.ts: sentinels in `PrimitiveMap`, one line for named syntaxes
- [x] api-typed.ts: variadic `PropertyFn`
- [x] typed cases (types + runtime twin)
- [x] runner: `toDecls` joins parts, `CSS` exported from macro.mjs, fixture
- [x] bench/typed.ts and budget

## Summary of Changes

- `spikes/typelevel/values.ts`: `CSSStyleValue<T>` (phantom `"~type": T`), `CSSUnitValue`, `CSSColorValue`, and `CSS.px/rem/em/percent/number`, all with `toString()`. `CSSKeywordValue` was skipped because nothing needs it yet.
- `spikes/typelevel/api-typed.ts`: `TypedPropertyFn<P>` = `<const A extends readonly (string | CSSStyleValue)[]>(...parts: Check<P, A>)`. `Join<A>` maps each value to `⟨T⟩` and joins the parts with a space. On failure, every part's parameter type becomes the `Valid` message.
- `spikes/typelevel/css.ts` (2 hunks): sentinels in `PrimitiveMap` (`length`, `percentage`, `length-percentage`, `number`), and a named syntax `V` accepts `⟨V⟩` before descending.
- Tests: `cases-typed.ts` (16 rows), `probe-typed.ts` (types, plus two `@ts-expect-error` call sites), `check-typed.ts` (runtime: `toString` join, then `matches`/`valid`).
- Bench: `bench/typed.ts` (20 calls), 136826 tsc / 139150 tsgo. The existing budgets were not rewritten: they grew by at most 0.7% (b100 +0.4%), which is inside the tolerance.
- Runner: `toDecls` joins plain parts with a space (a lone number keeps the spacing scale). `macro.mjs` re-exports `CSS`, `CSSColorValue`, `CSSUnitValue`. New fixture `fixtures/typed.ts` and `fixtures/tokens-typed.ts`.
- Known limit (plugin.mjs, not touched): a top-level `CSS.rem(1)` call in a file that imports `CSS` from `cssints` is treated as a css site and fails. Values inside `css.*` calls work, and so do values built with `new CSSColorValue(...)` in another module.

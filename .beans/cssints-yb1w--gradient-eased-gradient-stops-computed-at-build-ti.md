---
# cssints-yb1w
title: 'gradient(): eased gradient stops computed at build time'
status: completed
type: feature
priority: high
created_at: 2026-10-08T08:55:57Z
updated_at: 2026-10-08T09:16:47Z
parent: cssints-dk1q
---

## What
Value member `gradient(kind, direction, from, to, { easing?, steps? })` that expands an easing curve into N colour stops (in oklab) and returns a `<image>` value.

## Sources
- https://github.com/larsenwork/postcss-easing-gradients
- https://github.com/argyleink/gradient-style (CSS4/5 gradient syntax, interpolation spaces)
- https://gradient.style/ (tab)

## Shape
- `{ args: [...], value }`; easing is a cubic-bezier or a named one from the easings tokens; stops sampled at build time via culori or texel/color (both starred: https://github.com/Evercoder/culori, https://github.com/texel-org/color).

## Todo
- [x] stop sampling + oklab interpolation
- [x] value member, Typed OM image result
- [x] fixture

## Engine gaps

- **No `<image>` Typed OM value, and no base class to make one.** `cssints` exports `CSS`, `CSSColorValue` and
  `CSSUnitValue` only; `CSSStyleValue` is not exported (`import { CSSStyleValue } from "cssints"` is TS2305). A value member
  that returns an image (so the types send it only where an image goes) has to import the base from the internal package:
  `import { CSSStyleValue } from "@cssints/css-grammar/values"` and `class CSSImageValue extends CSSStyleValue<"image">`
  (packages/gradient/src/index.ts). It works because the engine's `instanceof CSSStyleValue` sees the same module; a
  `CSSImageValue` (or `CSSStyleValue`) export from `cssints` would remove the dependency.
- **A value member's type cannot be named in a declaration file.** `export const { x } = scope("x", { x: { args: "<color>",
  value: () => "red" } }).export();` then `vp pack`: TS2742, "The inferred type of 'x' cannot be named without a reference
  to '../node_modules/cssints/src/parts.ts'". Worked around as mise-en-mode does:
  `export const gradient: ReturnType<typeof eased.export>["gradient"] = eased.export().gradient;`.
- **A range on a grammar part is not checked in the types.** With `args: "<integer [2,64]>"`, `x(1)` type-checks and fails
  only at build time (`unexpected "1" ..., expected <integer [2,64]>`). The build is right; the test notes it
  (test/types/gradient.ts, `e6`).
- **Fixtures of a plugin package are linted.** `vp lint packages/gradient` type-checks test/fixtures, which import members
  with invalid arguments on purpose; the ignore list (`inputs` in vite.config.ts) names cssints, icons and mise-en-mode only.
  Worked around with `// @ts-expect-error` above the two fixtures the types reject; adding
  `packages/gradient/test/fixtures/**` there (and to .prettierignore) would be the usual way.

## Summary of Changes

New package `packages/gradient`, `@cssints/gradient`: one value member of `scope("gradient")`,
`gradient(kind, direction, from, to, easing?, stops?)`, returning a `CSSImageValue` (`<image>`).

- `src/stops.ts`: the stop math of postcss-easing-gradients (easing-coordinates): the bezier parameter sampled evenly, x(t)
  the position, y(t) the share of the second colour, clamped to 0..1; `linear`, the `ease*` keywords and `cubic-bezier()`.
- `src/index.ts`: the grammar (`linear | radial | conic` with each one's direction, two colours, an easing, `<integer
  [2,64]>`), checked in the types and at build time; colours mixed with culori in oklab with premultiplied alpha, the inner
  stops as sRGB hex (`#rrggbbaa` when not opaque), the endpoints as written, two decimals at most.
- Token endpoints (and `currentColor`): decided to emit `color-mix(in oklab, from, to N%)` stops at the same positions,
  not to reject: the browser mixes them in the same space. Documented in the README.
- `test/gradient.mjs`: unit check of the stop math, the fixture through the engine (literal, transparent, radial, conic,
  token, currentColor, defaults), build errors with their location (grammar, stops range, argument order, wrong property);
  `test/types/gradient.ts` via `bun run typecheck`.
- README with example, emitted CSS, rules and limits.

Deferred: `steps()` / `linear()` easings, more than two colours, `repeating-*`, a colour interpolation method, and wide-gamut
inner stops (clamped to sRGB; a token keeps the gamut through `color-mix()`).

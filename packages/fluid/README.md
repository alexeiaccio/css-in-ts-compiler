# @cssints/fluid

Fluid lengths for [cssints](../../README.md): `fluid(min, max)` is a length that is `min` on a narrow viewport, `max` on a
wide one, and grows linearly between. The `clamp()` is computed at build time, and a range that breaks text resizing
(WCAG 1.4.4) fails the build. Two value members of `cssints/plugin` `scope()` (`fn({ args, value })`, positional
arguments and an options object). No runtime.

```ts
import { fontSize, padding } from "cssints" with { type: "cssints" };
import { fluid } from "@cssints/fluid" with { type: "cssints" };

// fluid(min, max, { from?, to?, zoom? }): from and to are the widths, 20rem and 80rem when left out
export const title = fontSize(fluid("1rem", "1.5rem"));
export const lead = fontSize(fluid("16px", "24px", { from: "40rem", to: "90rem" }));
// against the inline size of the nearest container instead of the viewport
export const card = padding(fluid.container("1rem", "2rem", { to: "60rem" }));

export const hero = fontSize(fluid("1rem", "4rem")); // build error: fails WCAG 1.4.4
```

```css
._bkcdcr {
  font-size: clamp(1rem, 0.8333vw + 0.8333rem, 1.5rem);
}
._1wkr2lu {
  font-size: clamp(16px, 1vw + 0.6rem, 24px);
}
._ekb8uj {
  padding: clamp(1rem, 2.5cqi + 0.5rem, 2rem);
}
```

## Rules

- **The math.** The slope is `(max - min) / (to - from)` and the intercept `min - slope × from`, written
  `clamp(min, <slope × 100>vw + <intercept>rem, max)`, rounded to 4 decimals. The intercept is in rem, so the value follows
  the user's font size. A `max` below `min` makes a value that shrinks: the bounds are sorted for `clamp()` and the slope is
  negative.
- **Units.** `min`, `max`, `from` and `to` are px or rem, at 16px to the rem; the bounds keep the unit you wrote. Other
  units (`em`, `vw`, `%`, `calc()`, tokens) cannot be computed at build time: the build rejects them (the types check a
  non-negative `<length>`, and a grammar cannot name units).
- **WCAG 1.4.4.** The check of [fluid-tailwind](https://github.com/barvian/fluid-tailwind): at 500% zoom the viewport is a
  fifth as wide and the rem five times larger, and the value must still reach twice its size at 100%, or text cannot be
  resized to 200%. It is checked at every width (at the four kinks of the two curves), and a failure is a build error at
  the call that names the width: `cssints: fluid: 1rem to 4rem between 20rem and 80rem fails WCAG 1.4.4: at 80rem wide,
500% zoom gives 5rem, under twice 4rem; narrow the range of sizes or widen the widths`. A ratio of `max` to `min` up to
  about 2.5 passes with the default widths.
- **A length.** The result is a Typed OM length (`CSSStyleValue<"length">`): it goes where a length goes, in the types,
  and `color(fluid(...))` is an error. It can be an argument of `clamp()`, `min()` and `max()` of cssints.
- **Build errors** (at the call): a unit that is not px or rem, `min` equal to `max`, `from` not below `to`, a failed
  1.4.4 check, and the grammar of the arguments, by position (`fluid.container(2): unexpected "red" in "red", expected
<length>`).

## Limits

- The 1.4.4 check runs on every call unless `{ zoom: false }` is passed, which is for lengths that are not text (a
  padding, a gap): `padding(fluid("1rem", "4rem", { zoom: false }))`.
- `fluid.container()` uses the same check with the container's width in place of the viewport's, which holds when the
  container scales with the viewport.
- No defaults from a token set, and no token as an argument: a token is a `var()`, which the build cannot compute with.

```bash
cd packages/fluid && bun run test   # fixtures through the engine (output, errors), and the type test via bun run typecheck
```

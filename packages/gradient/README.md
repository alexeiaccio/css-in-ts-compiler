# @cssints/gradient

Eased gradients for [cssints](../../README.md): a gradient from one colour to another along an easing curve, expanded into
colour stops at build time, so the fade has no hard edge where a two-stop gradient shows one. It is one value member of
`cssints/plugin` `scope()` and returns an `<image>`, so it goes where an image goes (`backgroundImage`, `maskImage`,
`borderImageSource`). No runtime.

```ts
import { backgroundImage, createTokens } from "cssints" with { type: "cssints" };
import { gradient } from "@cssints/gradient" with { type: "cssints" };

const t = createTokens({ color: { $type: "color", ink: { $value: "#111111" } } });

// gradient(kind, direction, from, to, easing?, stops?)
export const fade = backgroundImage(
  gradient("linear", "to bottom", "#000", "transparent", "ease-in-out", 5),
);
export const glow = backgroundImage(
  gradient("radial", "circle at top", "red", "blue", "cubic-bezier(0.5, 0, 0.5, 1)", 4),
);
export const ink = backgroundImage(
  gradient("linear", "to right", t.color.ink, "white", "ease-in", 4),
);
```

```css
._4we9ve {
  background-image: linear-gradient(
    to bottom,
    #000,
    #000000d7 27.44%,
    #00000080 50%,
    #00000028 72.56%,
    transparent
  );
}
._ba8wye {
  background-image: radial-gradient(circle at top, red, #c44a6f 37.04%, #5348d0 62.96%, blue);
}
._1l9gl59 {
  background-image: linear-gradient(
    to right,
    var(--color-ink),
    color-mix(in oklab, var(--color-ink), white 25.93%) 44.59%,
    color-mix(in oklab, var(--color-ink), white 74.07%) 83.41%,
    white
  );
}
```

## Rules

- **Arguments**, each its own string: `kind` is `linear`, `radial` or `conic`; `direction` is that function's first
  argument, required (`"to bottom"`, `"45deg"`, `"circle at top"`, `"at center"`, `"from 90deg"`); `from` and `to` are
  colours or colour tokens; `easing` is `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out` (the default) or
  `cubic-bezier(x1, y1, x2, y2)`; `stops` is 2 to 64 (13 by default). They are checked in the types and again at build
  time, against one grammar.
- **Stops** are placed as postcss-easing-gradients places them: the curve's parameter `t` is sampled evenly, `x(t)` is the
  position of a stop and `y(t)` the share of `to` in it. A curve that overshoots (`y` outside 0 to 1) is clamped to the two
  colours.
- **Colours** are mixed in oklab with premultiplied alpha, as CSS mixes them, so `transparent` fades the other colour's hue
  and does not grey it. The endpoints are printed as written; the stops between them are sRGB hex (`#rrggbbaa` when not
  opaque). Positions and shares have two decimals at most, so the output is the same on every build.
- **Tokens and `currentColor`.** A token arrives as `var(--name)` and `currentColor` is the element's: neither can be read at
  build time. When an endpoint cannot be, every stop is `color-mix(in oklab, from, to N%)` at the same positions, and the
  browser mixes them. `color-mix()` needs Chrome 111, Safari 16.2, Firefox 113: for older targets the build warns, as it
  does for any value.
- **Errors**, at the call: a part outside the grammar (`gradient: unexpected "steps(4" in "linear to bottom red blue
steps(4)", expected linear | <cubic-bezier-easing-function> | <integer> | end of value`), arguments in the wrong order
  (`cssints: gradient(): "blue" is not an easing (the arguments are kind, direction, from, to, easing?, stops?)`), and a
  gradient where an image does not go (`css.color(gradient(…))`, an error in the types and at build time).

## Limits

- A stop between two literal colours is clamped to sRGB: a wide-gamut endpoint (`color(display-p3 …)`, a vivid `oklch()`)
  keeps its own value at the end, but the colours between are the nearest sRGB ones. Give it as a token to keep the gamut:
  the stops are then `color-mix()`.
- `steps()` and `linear()` easings are not taken, nor an easing token (there is no easing token type), nor a number token
  for `stops`; a `repeating-*` gradient, more than two colours and a colour interpolation method (`in oklch`) are not
  either.
- The parts are joined with a space for the grammar (see "Functions" in the API reference), so `"to", "bottom"` as two
  arguments passes the grammar and is caught only by the argument check; write the direction as one string.

```bash
cd packages/gradient && bun run test        # the stop math, fixtures through the engine (output, errors)
cd packages/gradient && bun run typecheck   # and the type test, test/types/gradient.ts
```

## Credits

The stops follow [postcss-easing-gradients](https://github.com/larsenwork/postcss-easing-gradients) and
[easing-coordinates](https://github.com/larsenwork/easing-coordinates) (MIT, Andreas Larsen): the easing curve sampled
into colour stops. The code is written here; no code is copied. Colours are mixed with [culori](https://culorijs.org)
(MIT, Dan Burzo), a dependency.

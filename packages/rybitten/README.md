# @cssints/rybitten

[RYBitten](https://rybitten.space/) colours for [cssints](../../README.md), computed at build time. RYBitten (by meodai, David Aerne in its
licence; MIT) turns red-yellow-blue coordinates into RGB through a _cube_: the eight corners of a colour model (white, red, yellow,
orange, blue, violet, green, black). It ships 36 of them, from Boutet (1708) and Goethe to Itten, Munsell and Albers, so
the same hue is another colour in each. `color(hue, options)` gives one hex colour, `wheel(steps, options)` and
`shades(hue, lightness, options)` return plain DTCG data (a colour group, steps `"1"` to `"N"`) that you pass to
`createTokens` yourself, and `overrides(group)` turns a group into the override object of `createGlobalTheme`. The package
has no runtime and no `scope()`: like [@cssints/ramp](../ramp/README.md) and the sets of
[@cssints/tokens](../tokens/README.md), a group is data, so it goes under any name, sits beside other tokens in one call,
and its steps get `@property` rules, themes and `check.contrast` from cssints.

```ts
// tokens.ts
import { createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };
import { overrides, shades, wheel } from "@cssints/rybitten";

export const t = createTokens({
  hue: wheel(12, { cube: "itten" }),
  paper: shades(0, [1, 0.96, 0], { cube: "itten", saturation: 0 }),
});

// the paper and the ink swap in the dark
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  paper: overrides(shades(0, [0, 0.04, 1], { cube: "itten", saturation: 0 })),
});
```

```ts
// text.ts
import { bg, check, cn, color } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts";

check.contrast(t.paper._3, t.paper._1, { min: 12 }); // the ink on the paper, light and dark
export const text = cn(color(t.hue._9), bg(t.paper._1));
```

The sheet of `text.ts`:

```css
@property --hue-9 {
  syntax: "<color>";
  inherits: true;
  initial-value: #1699da;
}
@property --paper-1 {
  syntax: "<color>";
  inherits: true;
  initial-value: #fdf6ed;
}
@layer _.k {
  @media (prefers-color-scheme: dark) {
    :root {
      --paper-1: #1d1c1c;
      --paper-2: #1e1d1d;
      --paper-3: #fdf6ed;
    }
  }
}
@layer _.a {
  ._14bfx2y {
    color: var(--hue-9);
  }
  ._1j4wng5 {
    background-color: var(--paper-1);
  }
}
```

## The functions

- **`color(hue, { cube?, saturation?, lightness? })`**: the hex colour of a hue. The hue is degrees on a painter's wheel,
  not the HSL wheel: `0` red, `120` yellow, `240` blue (Itten: `#e32421`, `#f3e600`, `#1699da`), any number, `360` is `0`.
  Saturation is `0` to `1` (default `1`; `0` gives the cube's greys). Lightness is `0` to `1` (default `0.5`): `1` is the
  cube's white and `0` its black, because RYB is subtractive (RYBitten's `invertLightness`). The cube is a key of
  RYBitten's `cubes` map (default `"itten"`) or your own eight corners.
- **`wheel(steps, { from?, cube?, saturation?, lightness? })`**: `steps` hues evenly round the wheel from `from` degrees
  (default `0`): `wheel(12)` is Itten's twelve-part circle, red, red-orange, orange, ... `"1"` to `"12"`.
- **`shades(hue, lightness, { cube?, saturation? })`**: one hue at the lightnesses you list, in that order, `"1"` to
  `"N"` for N values. With `saturation: 0` it is the cube's own grey scale, from its paper white to its ink black.
- **`overrides(group)`**: `{ _1: hex, … }` for `createGlobalTheme`, as cssints reads a key that starts with a digit.

A group is not a contrast ramp: the colours of a cube are what its makers painted, and no ratio is promised. For a
colour that must pass `check.contrast`, use a hue of the wheel as the base of an `@cssints/ramp` contrast ramp, which
finds the step with the ratio you need (the docs site does this for its accent, see below), or check the pair as above.

## Cubes

`cubes` is RYBitten's own map (`import { cubes } from "rybitten/cubes"`): `itten` (the default), `munsell`, `bezold`,
`goethe`, `albers`, `apple90s`, `harris`, `cmy`, ... with title, author, year and reference. The hue `240` in four of them:

| Cube      | Blue      | Paper     | Ink       |
| --------- | --------- | --------- | --------- |
| `itten`   | `#1699da` | `#fdf6ed` | `#1d1c1c` |
| `munsell` | `#3b8fab` | `#e4dac5` | `#2e2c26` |
| `albers`  | `#1161aa` | `#e7ebed` | `#000001` |
| `goethe`  | `#5f9dbf` | `#efebe1` | `#08090d` |

## Limits

- **Pinned.** `rybitten` is a dependency at `1.3.0`: RYBitten's contract does not cover the numbers of a cube, which a
  minor release may refine, so a colour can move with an upgrade (the tests pin Itten's corners).
- **Errors are thrown** when the module is evaluated, so they are build errors: a cube that is not in the map
  (`@cssints/rybitten: no cube "nope" in RYBitten's cubes`), a hue that is not a number, a saturation or lightness outside
  0..1, `steps` that is not a whole number from 1.
- **sRGB hex only.** A cube holds sRGB corners, so the colours are in sRGB (trilinear interpolation stays inside the
  cube), and a hex is what `check.contrast` reads exactly and the types accept cheaply.
- **No harmonies.** A complement is `hue + 180`, a triad `+ 120`: `color(h + 180)`, or the steps of a `wheel(3)`.
- **The editor shows `` `#${string}` ``.** A value is computed when the module runs, so its type is a hex string, not the
  literal (as for @cssints/ramp). The steps are known (`t.hue._13` of a twelve-step wheel is a type error).
- **Type cost.** A step is a `` `#${string}` `` token like a step of @cssints/ramp: the whole type test (a wheel of twelve, a
  run of four, their overrides in a theme) is 0.19 M instantiations in tsgo, as many as the type test of ramp.
- **No runtime.** A hue picked in the browser needs one of the steps built ahead (the docs site builds a theme per step of
  a twelve-hue wheel and switches them with an attribute) or `rybitten` itself in the page, which this package does not ship.

## Credits

Colour maths and the historical cubes are [RYBitten](https://github.com/meodai/RYBitten) by meodai (David Aerne; MIT), a
dependency of this package, whose licence is reproduced in LICENSE here. The cubes
cite their historical sources: see RYBitten's README.

```bash
cd packages/rybitten && bun run test        # the colours and the errors, then a module through the engine (check.contrast passes, a hue on paper fails)
cd packages/rybitten && bun run typecheck   # the type test (test/types/rybitten.ts)
```

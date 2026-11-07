# @cssints/gamut

Gamut and contrast colour maths for [cssints](../../README.md), computed at build time. `fit` returns the nearest colour a
gamut can show, `readable` a text colour that reaches a WCAG 2 contrast ratio on a background, and `tones` a lightness
scale of one colour as DTCG data for `createTokens`. The package has no runtime, no DOM and no `scope()` member: like
[@cssints/ramp](../ramp/README.md), its values are computed when the module is evaluated and are data after that, so they
go under any token group and get `@property` rules, themes and `check.contrast` from cssints.

The idea is [gamutant](https://github.com/noscripting/gamutant)'s: a gamut and contrast library that needs no JavaScript.
This is the same set of decisions, made once for a design's colours instead of per element in CSS, with the colour maths
of [culori](https://culorijs.org).

```ts
// tokens.ts
import { bg, check, cn, color, createTokens } from "cssints" with { type: "cssints" };
import { fit, readable, tones } from "@cssints/gamut";

export const t = createTokens({
  bg: { $type: "color", $value: "#ffffff" },
  ink: { $type: "color", $value: readable("#ffffff") }, // #767676, 4.54:1
  blue: tones("#2563eb", 9),
  vivid: { $type: "color", $value: fit("oklch(0.7 0.4 150)") }, // #00be58: inside sRGB
});

check.contrast(t.ink, t.bg, { min: 4.5 });
export const text = cn(color(t.ink), bg(t.bg));
```

The sheet of that file:

```css
@layer _.k, _.a, _.b, _.c, _.d, _.e;
@property --bg {
  syntax: "<color>";
  inherits: true;
  initial-value: #ffffff;
}
@property --blue-1 {
  syntax: "<color>";
  inherits: true;
  initial-value: #e7effd;
}
/* … --blue-2 to --blue-8 … */
@property --blue-9 {
  syntax: "<color>";
  inherits: true;
  initial-value: #000211;
}
@property --ink {
  syntax: "<color>";
  inherits: true;
  initial-value: #767676;
}
@property --vivid {
  syntax: "<color>";
  inherits: true;
  initial-value: #00be58;
}
@layer _.a {
  ._od79qs {
    color: var(--ink);
  }
  ._q77new {
    background-color: var(--bg);
  }
}
```

## The maths

Every colour is read and written in OKLCH, a perceptual space: lightness `l` from 0 to 1, chroma `c` from 0 (grey) up,
hue `h` in degrees. Two operations on it do the work:

- **The most chroma sRGB holds** at a lightness and hue, `maxChroma(l, h)`: a bisection of 24 steps, the lower bound, so
  the colour it yields is inside the gamut and never a clipped one. A colour's _relative chroma_ is its chroma over that
  maximum: `1` is as vivid as sRGB goes at that lightness and hue, and a grey is `0`.
- **The WCAG 2 contrast ratio** of two colours: culori's `wcagLuminance` of each clipped to sRGB, then
  `(L1 + 0.05) / (L2 + 0.05)` for the lighter and the darker, from 1 to 21, not rounded. It is the maths of
  `check.contrast`.

sRGB results are hex, the 8-bit rounding of an in-gamut colour. A Display P3 result is `color(display-p3 r g b)`: a hex
cannot hold a colour sRGB cannot show.

## `fit(color, options?)`

The nearest colour the target gamut can show, in the target's syntax.

```ts
fit("oklch(0.7 0.4 150)"); // #00be58: sRGB by default
fit("oklch(0.7 0.4 150)", { target: "display-p3" }); // color(display-p3 0 0.7683 0.2674)
fit("oklch(0.7 0.4 150)", { method: "clip" }); // #00d600: the channels clipped, not the chroma
fit("#2563eb"); // #2563eb: already in sRGB, unchanged
fit("color(display-p3 1 0 0)"); // #ff3428: the nearest sRGB red
```

- **`target`**: `"srgb"` (default) or `"display-p3"`.
- **`method: "chroma"`** (default): hold the lightness and the hue, take the largest chroma the target holds at them
  (bisection, 24 steps). The colour is the most saturated one of that hue the gamut can show at that lightness, so a blue
  that P3 holds stays vivid instead of turning muddy.
- **`method: "clip"`**: keep the RGB channels and hold each to 0..1. Closer to how a browser shows an out-of-gamut colour,
  and further from the original in hue and lightness.
- **A no-op inside the gamut**: a colour the target already holds comes back as the same colour, in the target's syntax
  (a hex for sRGB, `color(display-p3 …)` for P3), whatever the method.

## `readable(bg, options?)`

A text colour with at least `ratio` WCAG 2 contrast on `bg` (4.5 by default, body text): the background's hue and its
chroma relative to the sRGB maximum, with the lightness nearest the background that passes, searched by bisection on the
hex it outputs (32 steps). A colour with no hue (white, grey) gives a neutral text colour.

| Background | `toward` | Result    | Ratio |
| ---------- | -------- | --------- | ----- |
| `#ffffff`  | `black`  | `#767676` | 4.54  |
| `#111111`  | `white`  | `#7c7c7c` | 4.52  |
| `#2563eb`  | `white`  | `#e8f0fd` | 4.51  |
| `#f5f5f4`  | `black`  | `#545353` | 7.03  |
| `#808080`  | `black`  | `#242424` | 3.93  |
| `#808080`  | `white`  | `#fefefe` | 3.92  |

- **`ratio`**: from 1 to 21; default 4.5 (`3` is large text and borders, `7` is AAA).
- **`toward`**: `"black"` (darker than the background), `"white"` (lighter), or `"auto"` (default: the side with more
  room, which is darker on a light background and lighter on a dark one). The result is always a hex colour.
- **By little**: the colour nearest the background that passes, within an 8-bit step, so the ratio is not far above the
  target. It is measured on the hex it outputs, so `check.contrast(readable(bg), bg, { min: ratio })` passes.

## `tones(color, count)`

`count` tones of one colour as a DTCG colour group for `createTokens`: OKLCH lightness from 0.95 down to 0.10, evenly,
lightest first, steps `"1"` to `"N"`. The hue is held and the chroma keeps the colour's share of the sRGB maximum at each
lightness, so every tone is in sRGB by construction.

```ts
tones("#2563eb", 9);
```

| 1         | 2         | 3         | 4         | 5         | 6         | 7         | 8         | 9         |
| --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| `#e7effd` | `#b5ccf8` | `#83a9f3` | `#5084ef` | `#1a5ae8` | `#1041ac` | `#072973` | `#02123f` | `#000211` |

`tones("#eab308", 5)`: `#ffedc6`, `#d4a206`, `#866502`, `#3f2e00`, `#050300`. `tones(c, 1)` is the `0.95` tone alone.
The steps are read as `t.blue._1` … `t.blue._9` in code (`_`, as cssints reads a key that starts with a digit), and as
`--blue-1` … `--blue-9` in CSS.

## Browser support

The package runs at build time, in Node (22 and later): no browser, no DOM, nothing shipped to the client. What it writes
is plain colour values:

- **Hex** is understood by every browser, and `readable` and `tones` give only hex.
- **`color(display-p3 r g b)`** (a `fit` result for the P3 target) needs the `color()` function: Safari 10+, Chrome 111+,
  Firefox 113+. On an sRGB display it is shown clipped to sRGB; a wide-gamut display shows the colour the maths chose.
- **`@property` and `check.contrast`** see a P3 colour as its sRGB clip, as WCAG 2 is defined on sRGB, so a P3 pair is
  checked at the sRGB colour, like cssints's own contrast maths.

## Limits

- **Errors are thrown** when the module is evaluated, so they are build errors: a colour culori cannot read
  (`@cssints/gamut: the colour "banana" is not a colour`) or a translucent one (`… is translucent`), a count that is not
  a whole number from 1, a ratio outside 1..21, and a ratio no lightness reaches on that background
  (`ratio 21 is out of reach on #808080: at most 5.32 (black)`). A mid-grey background leaves little room on either side;
  ratio 21 needs white or black.
- **Hex is 8-bit around the hue.** The tone and the text colour keep the hue in the maths, and the hex rounds it: within a
  degree where the chroma is at least about 0.1, and by more where the chroma is thinner (at 0.02 chroma an 8-bit colour
  is a handful of RGB levels, so a dark yellow at lightness 0.10 is about 4° off). The lightness of a tone stays within
  an 8-bit step of its target.
- **Specificity of the ratio**: a `readable` colour meets its ratio against that background only. On another background
  or in a theme, call `readable` with that one, under the same condition, as ramp's contrast mode does.
- **WCAG 2 only**, not APCA. A WCAG 2 pass is not an APCA pass, especially for light text on dark.
- **sRGB for `tones` and `readable`.** P3 is a `fit` target only: a P3 token would be checked by `check.contrast` as its
  sRGB clip, and a `color()` value walks the colour grammar in the types where a hex is cheap. A base outside sRGB is read
  with its share of chroma capped at the gamut.
- **The editor shows `#${string}`.** `readable` and a tone's value are computed when the module runs, so their type is
  `` `#${string}` ``, not the literal hex. The steps of `tones` are known, though: `t.blue._10` of a nine-tone scale is a
  type error, and the build checks the values.

```bash
cd packages/gamut && bun run test        # the maths, then a token file through the engine (@property rules, check.contrast)
cd packages/gamut && bun run typecheck   # the type test (test/types/gamut.ts)
```

## Credits

The idea, a gamut and contrast library that needs no JavaScript, is [gamutant](https://github.com/noscripting/gamutant)'s
(MIT). The chroma relative to the sRGB gamut is [nutelch](https://github.com/meodai/nutelch)'s idea (MIT, David Aerne),
as in [@cssints/ramp](../ramp/README.md). The colour maths is [culori](https://culorijs.org) (MIT, Dan Burzo), a
dependency. No code is copied.

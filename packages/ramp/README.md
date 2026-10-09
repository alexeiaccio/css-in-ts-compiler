# @cssints/ramp

OKLCH colour ramps for [cssints](../../README.md), computed at build time. `ramp(base, options)` returns plain DTCG data
(a colour group, steps `"1"` to `"N"`, each a hex colour in sRGB) that you pass to `createTokens` yourself, and
`overrides(ramp)` turns a ramp into the override object of `createGlobalTheme`. The package has no runtime and no
`scope()`: like the sets of [@cssints/tokens](../tokens/README.md), a ramp is data, so it goes under any group name, sits
beside other tokens in one call, and its steps get `@property` rules, themes and `check.contrast` from cssints.

```ts
// tokens.ts
import { createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };
import { overrides, ramp } from "@cssints/ramp";

const ratios = [1.2, 1.5, 3, 4.5, 7] as const;

export const t = createTokens({
  bg: { $type: "color", $value: "#ffffff" },
  blue: ramp("#2563eb", { mode: "contrast", ratios, background: "#ffffff" }),
  gray: ramp("#6b7280", { mode: "lightness", steps: 9 }),
});

// the same ratios on the dark background, under the same condition as it
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  bg: "#111111",
  blue: overrides(ramp("#2563eb", { mode: "contrast", ratios, background: "#111111" })),
});
```

```ts
// text.ts
import { bg, check, cn, color } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts";

check.contrast(t.blue._3, t.bg, { min: 3 }); // borders, large text
check.contrast(t.blue._4, t.bg, { min: 4.5 }); // body text, light and dark
export const text = cn(color(t.blue._4), bg(t.bg));
```

The sheet of `text.ts`:

```css
@property --bg {
  syntax: "<color>";
  inherits: true;
  initial-value: #ffffff;
}
@property --blue-4 {
  syntax: "<color>";
  inherits: true;
  initial-value: #356fec;
}
@layer _.k {
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #111111;
      --blue-1: #041e59;
      --blue-2: #092d7c;
      --blue-3: #1855db;
      --blue-4: #3d76ed;
      --blue-5: #719df2;
    }
  }
}
@layer _.a {
  ._1od4w7v {
    color: var(--blue-4);
  }
  ._q77new {
    background-color: var(--bg);
  }
}
```

## Modes

Every step keeps the base's OKLCH hue and its chroma _relative to the sRGB gamut_ (nutelch's idea): the base's chroma
over the most chroma sRGB holds at the base's lightness and hue. A step at another lightness takes the same share of the
most sRGB holds there, so a vivid base stays vivid near its hue's cusp, thins out towards white and black, and every step
is in sRGB by construction (the hex is the 8-bit rounding of an in-gamut colour, never a clipped one). A grey base gives a
neutral ramp. The base itself need not be a step.

- **`{ mode: "lightness", steps, lightness? }`**: `steps` colours spaced evenly in OKLCH lightness, from
  `lightness[0]` to `lightness[1]` (default `[0.97, 0.25]`, lightest first). `#2563eb` with 9 steps: `#f1f5fe`,
  `#c6d8f9`, `#9cbbf5`, `#719df2`, `#467cee`, `#1a59e6`, `#1143b2`, `#092f81`, `#041b53`.
- **`{ mode: "contrast", ratios, background }`** (Leonardo's idea): one step per ratio, in the order given. A step's
  lightness is searched (bisection, on the hex it outputs) for the colour nearest the background whose WCAG 2 ratio
  against it is at or above the target. The steps go darker on a light background and lighter on a dark one (the side
  with more room). `#2563eb` with `[1.2, 1.5, 3, 4.5, 7]`:

  | Background | 1              | 2              | 3              | 4              | 5              |
  | ---------- | -------------- | -------------- | -------------- | -------------- | -------------- |
  | `#ffffff`  | `#e1ebfc` 1.20 | `#bfd3f9` 1.51 | `#6593f0` 3.00 | `#356fec` 4.52 | `#164ecc` 7.00 |
  | `#111111`  | `#041e59` 1.20 | `#092d7c` 1.50 | `#1855db` 3.02 | `#3d76ed` 4.50 | `#719df2` 7.02 |

The numbers are deterministic: the same base and options give the same hex on every machine (no randomness, a fixed
number of bisection steps).

## Contrast

What a contrast ramp promises, exactly:

- **Each step `i` has `ratio(step, background) >= ratios[i]`**, with the ratio computed as `check.contrast` computes it:
  culori's `wcagLuminance` of each colour clipped to sRGB, `(L1 + 0.05) / (L2 + 0.05)`, not rounded. It is measured on
  the hex the step outputs, so `check.contrast(t.blue._4, t.bg, { min: 4.5 })` passes when `t.bg` holds the same
  `background`. The search only keeps colours that pass, so this does not rest on the search converging.
- **By little.** The step is the passing colour nearest the background along the ramp, within an 8-bit step: in the tests
  every step of 8 bases on 4 backgrounds is below `ratio * 1.02`. So a check held to more than the step was made for
  fails: `check.contrast(t.blue._4, t.bg, { min: 4.6 })` is
  `contrast 4.52 is below 4.6: blue.4 #356fec on bg #ffffff, in the default values`, and the same in the dark theme
  (4.50). Check each step at its own ratio.
- **Against that background only.** A ratio holds for the `background` the ramp was made for. On another background
  (a theme), make a ramp for it with the same ratios and set both under the same condition or selector, as above;
  `check.contrast` then checks each step against the theme's background.
- **Lightness ramps promise no ratio**; check the pairs you use.
- **WCAG 2 only**, not APCA. A WCAG 2 pass is not an APCA pass, especially for light text on dark.

## Limits

- **Errors are thrown** when the module is evaluated, so they are build errors: a base or background that is not a
  colour (`@cssints/ramp: the base "banana" is not a colour`) or is translucent, `steps` that is not a whole number from
  1, a lightness outside 0..1, and a ratio out of 1..21 or out of reach on the background
  (`ratio 21 is out of reach on #111: at most 18.88 (white)`). A mid-grey background leaves little room on either side.
- **Monotone for sorted ratios.** Ascending ratios give steps moving away from the background, but the ramp does not sort
  them for you. The lightness is OKLCH lightness, not a luminance: two hues at one lightness have different ratios.
- **sRGB only.** A P3 variant (`color(display-p3 …)`) is not shipped: `check.contrast` clips a colour to sRGB, so a P3
  step would be checked as another colour than the one shown, and a `color()` value walks the colour grammar in the types
  (thousands of instantiations a token) where a hex is cheap. A base outside sRGB is read with its share of chroma capped
  at the gamut.
- **The editor shows `#${string}`.** A step's value is computed when the module runs, so its type is `` `#${string}` ``,
  not the literal hex (hover shows ``Token<"color", true, `#${string}`>``). Its type is still a colour token, the steps are
  known (`t.blue._6` of a five-ratio ramp is a type error), and the build checks the values.
- **Type cost** (tsgo, one file per row):

  | Call                                             | Instantiations | Check time |
  | ------------------------------------------------ | -------------- | ---------- |
  | `color("red")` (the baseline)                    | 0.16 M         | 0.09 s     |
  | 10 ramps of 10 steps (100 tokens)                | 0.15 M         | 0.09 s     |
  | 100 ramps of 10 steps (1,000 tokens)             | 0.16 M         | 0.10 s     |
  | the same 1,000 tokens and a theme of all of them | 0.24 M         | 0.13 s     |

  A step costs about 10 instantiations as a token (every value has the one type `` `#${string}` ``), about 80 as a theme
  override, so a ramp is as cheap as the hex sets of @cssints/tokens.

```bash
cd packages/ramp && bun run test        # the ramp maths, then a fixture through the engine (check.contrast passes, a tight pair fails)
cd packages/ramp && bun run typecheck   # the type test (test/types/ramp.ts)
```

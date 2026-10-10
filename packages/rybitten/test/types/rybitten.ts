// Groups through createTokens and createGlobalTheme as user code types them: the steps are colour tokens `_1`..`_N`, the
// overrides of a group fit a theme of the same steps, and a step that is not there is an error.
import { check, color, createGlobalTheme, createTokens, media, padding } from "cssints";

import { color as ryb, overrides, shades, wheel } from "../../src/index.ts";
import type { Hex, Keys } from "../../src/index.ts";

const t = createTokens({
  bg: { $type: "color", $value: "#ffffff" },
  space: { $type: "dimension", md: { $value: "16px" } },
  hue: wheel(12, { cube: "albers" }),
  paper: shades(0, [1, 0.9, 0.1, 0], { saturation: 0 }),
  one: { $type: "color", $value: ryb(30) },
});
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  hue: overrides(wheel(12, { cube: "munsell" })),
  paper: overrides(shades(0, [0, 0.1, 0.9, 1], { saturation: 0 })),
});
check.contrast(t.paper._4, t.paper._1, { min: 7 });

export const a = [color(t.hue._1), color(t.hue._12), color(t.paper._4), color(t.one)];
export const keys: Keys<3> = "3";
export const hex: Hex = overrides(wheel(1))._1;

// @ts-expect-error twelve hues
export const e1 = color(t.hue._13);
// @ts-expect-error four lightnesses
export const e2 = color(t.paper._5);
// @ts-expect-error a colour is not a length
export const e3 = padding(t.hue._1);
// @ts-expect-error a wheel of seven has _5 to _7, which the four lightnesses of paper do not
createGlobalTheme(t.paper, ".x", overrides(wheel(7)));
// @ts-expect-error 4 is not a step of 3
export const e4: Keys<3> = "4";

import { createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };
import { overrides, shades, wheel } from "@cssints/rybitten";

// A painter's wheel (red, yellow, blue) instead of the HSL one: wheel() gives twelve hues, shades() a ramp of one hue.
export const t = createTokens({
  hue: wheel(12, { cube: "itten" }),
  paper: shades(0, [1, 0.96, 0], { cube: "itten", saturation: 0 }),
});

// the paper and the ink swap in the dark
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  paper: overrides(shades(0, [0, 0.04, 1], { cube: "itten", saturation: 0 })),
});

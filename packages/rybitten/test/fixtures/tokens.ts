import { createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };
import { color, overrides, shades, wheel } from "@cssints/rybitten";

export const t = createTokens({
  hue: wheel(4),
  paper: shades(0, [1, 0.96, 0], { cube: "itten", saturation: 0 }),
  brand: { $type: "color", $value: color(240, { cube: "munsell" }) },
});

// the same wheel in another cube, under the same condition as the dark paper
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  hue: overrides(wheel(4, { cube: "munsell" })),
  paper: overrides(shades(0, [0, 0.04, 1], { cube: "itten", saturation: 0 })),
});

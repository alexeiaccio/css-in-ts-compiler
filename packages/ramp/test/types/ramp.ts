// Ramps through createTokens and createGlobalTheme as user code types them: the steps are colour tokens `_1`..`_N`, the
// overrides of a ramp fit a theme of the same steps, and a step that is not there is an error.
import { check, color, createGlobalTheme, createTokens, media, padding } from "cssints";

import { overrides, ramp } from "../../src/index.ts";
import type { Hex, Keys } from "../../src/index.ts";

const ratios = [1.2, 1.5, 3, 4.5, 7] as const;
const t = createTokens({
  bg: { $type: "color", $value: "#ffffff" },
  space: { $type: "dimension", md: { $value: "16px" } },
  blue: ramp("#2563eb", { mode: "contrast", ratios, background: "#ffffff" }),
  gray: ramp("#6b7280", { mode: "lightness", steps: 12 }),
  inline: ramp("#16a34a", { mode: "contrast", ratios: [3, 4.5], background: "#000" }),
});
createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  bg: "#111111",
  blue: overrides(ramp("#2563eb", { mode: "contrast", ratios, background: "#111111" })),
});
check.contrast(t.blue._4, t.bg, { min: 4.5 });

export const a = [color(t.blue._1), color(t.blue._5), color(t.gray._12), color(t.inline._2)];
export const keys: Keys<3> = "3";
export const hex: Hex = overrides(ramp("#000", { mode: "lightness", steps: 1 }))._1;

// @ts-expect-error five ratios, five steps
export const e1 = color(t.blue._6);
// @ts-expect-error twelve steps
export const e2 = color(t.gray._13);
// @ts-expect-error a colour is not a length
export const e3 = padding(t.blue._1);
// @ts-expect-error a ramp of seven steps has _6 and _7, which the five steps of blue do not
createGlobalTheme(t.blue, ".x", overrides(ramp("#000", { mode: "lightness", steps: 7 })));
// @ts-expect-error contrast needs ratios
ramp("#000", { mode: "contrast", background: "#fff" });
// @ts-expect-error a mode
ramp("#000", { steps: 3 });
// @ts-expect-error 4 is not a step of 3
export const e4: Keys<3> = "4";

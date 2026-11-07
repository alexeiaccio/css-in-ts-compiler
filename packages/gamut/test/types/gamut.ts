// The tones of a colour through createTokens as user code types them: the steps are colour tokens `_1`..`_N`, and a step
// that is not there is an error. `fit` and `readable` return a colour as text: a hex for readable, either syntax for fit.
import { color, createTokens } from "cssints";

import { fit, readable, tones } from "../../src/index.ts";
import type { Hex, Keys, Tones } from "../../src/index.ts";

const t = createTokens({
  bg: { $type: "color", $value: "#ffffff" },
  blue: tones("#2563eb", 5),
  gray: tones("#6b7280", 12),
});

export const a = [color(t.blue._1), color(t.blue._5), color(t.gray._12)];
export const text: Hex = readable("#ffffff");
export const textAt: Hex = readable("#111111", { ratio: 7, toward: "white" });
export const srgb: string = fit("color(display-p3 1 0 0)");
export const p3: string = fit("color(display-p3 1 0 0)", { target: "display-p3", method: "clip" });
export const keys: Keys<3> = "3";
export const group: Tones<2> = tones("#2563eb", 2);

// @ts-expect-error five tones have no sixth step
export const e1 = color(t.blue._6);
// @ts-expect-error twelve tones
export const e2 = color(t.gray._13);
// @ts-expect-error three tones have no fourth step name
export const e3: Keys<3> = "4";
// @ts-expect-error fit's target is a gamut it can fit into
fit("#000", { target: "rec2020" });
// @ts-expect-error a ratio is a number
readable("#000", { ratio: "4.5" });
// @ts-expect-error a count is a number
tones("#000", "5");

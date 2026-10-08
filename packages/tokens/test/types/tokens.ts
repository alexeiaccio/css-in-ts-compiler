// The sets through createTokens and createGlobalTheme as user code types them: each set within TypeScript's limits, its
// tokens typed (a colour is not a length), radix's dark overrides checked against the light tokens.
import {
  color,
  createGlobalTheme,
  createTokens,
  fontWeight,
  lineHeight,
  media,
  padding,
  transitionTimingFunction,
  boxShadow,
} from "cssints";

import { easings } from "../../src/easings.ts";
import { flexoki } from "../../src/flexoki.ts";
import * as op from "../../src/open-props.ts";
import { dark, darkAlpha, light, lightAlpha } from "../../src/radix.ts";
import { reasonableColors } from "../../src/reasonable-colors.ts";

const o = createTokens({
  ...op.colors,
  size: op.sizes,
  radius: op.radii,
  border: op.borderSizes,
  weight: op.fontWeights,
  leading: op.lineHeights,
});
export const a = [
  color(o.blue._7),
  padding(o.size._3, o.size._000),
  fontWeight(o.weight._7),
  lineHeight(o.leading._00),
  boxShadow(op.shadows.shadow2),
  boxShadow(op.shadowsDark.innerShadow1),
  transitionTimingFunction(op.easings.easeElasticInOut3),
];
// @ts-expect-error engine gap (README "Limits"): the types take linear() up to 9 stops, the build takes this one
export const e0 = transitionTimingFunction(op.easings.easeSpring3);
// @ts-expect-error a colour is not a length
export const e1 = padding(o.blue._7);
// @ts-expect-error no such step
export const e2 = color(o.blue._13);

const dm = media("(prefers-color-scheme: dark)");
const rx = createTokens(light);
const rxa = createTokens(lightAlpha);
createGlobalTheme(rx, dm, dark);
createGlobalTheme(rxa, dm, darkAlpha);
export const b = [color(rx.blue._11), color(rxa.blueA._3), color(rxa.blackA._12)];
// @ts-expect-error an override is of the token's type
createGlobalTheme(rx, ".x", { blue: { _1: "1px" } });
// @ts-expect-error the alpha scales are their own set
createGlobalTheme(rx, ".x", darkAlpha);

export const c = [
  color(createTokens({ flexoki }).flexoki.red._600),
  color(createTokens(reasonableColors).azure._3),
  transitionTimingFunction(easings.easeOutBack),
];

// The sets through createTokens and createGlobalTheme as user code types them: each set within TypeScript's limits, its
// tokens typed (a colour is not a length), radix's dark overrides checked against the light tokens.
import {
  color,
  createGlobalTheme,
  createTokens,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  media,
  padding,
  transitionTimingFunction,
  boxShadow,
} from "cssints";

import { flexoki } from "../../src/flexoki.ts";
import { madoromi } from "../../src/madoromi.ts";
import * as op from "../../src/open-props.ts";
import { dark, darkAlpha, light, lightAlpha } from "../../src/radix.ts";
import { reasonableColors } from "../../src/reasonable-colors.ts";

const o = createTokens({
  ...op.colors,
  size: op.sizes,
  space: op.remSizes,
  fluid: op.fluidSizes,
  content: op.contentSizes,
  header: op.headerSizes,
  relative: op.relativeSizes,
  radius: op.radii,
  border: op.borderSizes,
  text: op.fontSizes,
  fluidText: op.fluidFontSizes,
  tracking: op.letterSpacings,
  weight: op.fontWeights,
  leading: op.lineHeights,
  ease: op.easings,
  shadow: op.shadows,
});
createGlobalTheme(o.shadow, media("(prefers-color-scheme: dark)"), op.shadowsDark);
export const a = [
  color(o.blue._7),
  padding(o.size._3, o.space._000),
  padding(o.fluid._3, o.content._2),
  fontSize(o.text._2),
  fontSize(o.fluidText._1),
  letterSpacing(o.tracking._1),
  fontWeight(o.weight._7),
  lineHeight(o.leading._00),
  boxShadow(o.shadow.shadow2),
  boxShadow(o.shadow.innerShadow1),
  transitionTimingFunction(o.ease.easeElasticInOut3),
];
// springs and bounces are linear() with up to 44 stops: the types take them
export const e0 = createTokens({ spring: op.springs });
// @ts-expect-error an easing function is not a shadow
export const e3 = boxShadow(o.ease.easeOut3);
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
// the solid and alpha scales in one call: 744 tokens, within TypeScript's limits
const all = createTokens({ ...light, ...lightAlpha });
createGlobalTheme(all, dm, { ...dark, ...darkAlpha });
// @ts-expect-error an override is of the token's type
createGlobalTheme(rx, ".x", { blue: { _1: "1px" } });
// @ts-expect-error the alpha scales are their own set
createGlobalTheme(rx, ".x", darkAlpha);

// madoromi: one flavour as tokens, another as a theme as it is (DTCG leaves)
const mr = createTokens({ madoromi: madoromi.akiHiru });
createGlobalTheme(mr.madoromi, dm, madoromi.akiYoru);
createGlobalTheme(mr, "[data-madoromi]", { madoromi: { kami: "#fff", ansi: { black: "#000" } } });
export const d = [
  color(mr.madoromi.sumi),
  color(mr.madoromi.roles.keyword),
  color(mr.madoromi.ansi.brightWhite),
];
// @ts-expect-error no such colour (the names are ASCII: hyoshi, not hyōshi)
export const e4 = color(mr.madoromi.hyōshi);
// @ts-expect-error a colour is not a length
export const e5 = padding(mr.madoromi.kami);

export const c = [
  color(createTokens({ flexoki }).flexoki.red._600),
  color(createTokens(reasonableColors).azure._3),
  transitionTimingFunction(o.ease.easeCubicOut),
  color(all.blueA._3),
];

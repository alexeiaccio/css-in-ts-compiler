// colorMix(), min(), max() and clamp(): tokens are arguments, the result is a part of a property of its type.
import type { CSSColorValue, CSSStyleValue } from "@cssints/css-grammar/values";
import * as css from "cssints";

const t = css.createTokens({
  color: { $type: "color", accent: { $value: "oklch(62% 0.19 259)" } },
  space: { $type: "dimension", md: { $value: "16px" } },
});

export const mixed: css.Style = css.color(css.colorMix("oklab", t.color.accent, "black 15%"));
export const polar: css.Style = css.color(css.colorMix("oklch longer hue", "red", "blue 30%"));
export const typed: CSSColorValue = css.colorMix("srgb", "red", "blue");
// @ts-expect-error not a colour space
css.colorMix("rgb", "red", "blue");
// @ts-expect-error a length is not a colour
css.colorMix("oklab", t.space.md, "red");
// a share over 100% is the build's (the types do not read ranges)
// @ts-expect-error two colours, not three
css.colorMix("oklab", "red", "blue", "green");
// @ts-expect-error a colour is not a length
css.width(css.colorMix("oklab", "red", "blue"));

// a length unless an argument says otherwise
export const l: css.Style = css.padding(css.clamp(t.space.md, "2vw", "2rem"));
export const mn: css.Style = css.maxWidth(css.min("48rem", "100%", t.space.md));
export const mx: css.Style = css.width(css.max(t.space.md, 4));
export const n: css.Style = css.opacity(css.clamp<"number">(0, 0.5, 1));
export const len: CSSStyleValue<"length"> = css.min("1rem");
// @ts-expect-error a length is not a colour
css.color(css.min("1rem", "2rem"));
// @ts-expect-error a number is not a length
css.width(css.clamp<"number">(0, 1, 2));
// @ts-expect-error a colour token is not a length
css.min(t.space.md, t.color.accent);
// @ts-expect-error the first typed argument decides: a colour, then a length
css.min(t.color.accent, t.space.md);
// @ts-expect-error clamp takes three
css.clamp("1rem", "2rem");

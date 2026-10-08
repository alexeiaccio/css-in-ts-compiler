// The css functions as calls: tokens, numbers, strings and other calls as parts; operators are string parts.
import type { CSSStyleValue } from "@cssints/css-grammar/values";
import * as css from "cssints";

const t = css.createTokens({
  color: { $type: "color", accent: { $value: "oklch(62% 0.19 259)" }, bg: { $value: "white" } },
  space: { $type: "dimension", md: { $value: "16px" } },
  time: { $type: "duration", fast: { $value: "100ms" } },
  scale: { $type: "number", ratio: { $value: 1.5 } },
});

// math: the kind of the result is the kind of the arguments
export const mul: css.Style = css.width(css.calc(t.space.md, "*", 2));
export const sum: CSSStyleValue<"length"> = css.calc(
  t.space.md,
  "+",
  "0.5rem",
  "+",
  t.space.md,
  "/",
  2,
);
export const pct: css.Style = css.width(css.calc("100%", "-", t.space.md));
export const prec: css.Style = css.padding(css.calc("1rem", "+", 2, "*", t.space.md));
export const ratio: CSSStyleValue<"number"> = css.calc(t.scale.ratio, "*", 2);
export const div: CSSStyleValue<"number"> = css.calc(t.space.md, "/", "1rem");
export const mn: css.Style = css.maxWidth(css.min("48rem", "100%", t.space.md));
export const mx: css.Style = css.width(css.max(t.space.md, "4px"));
export const cl: css.Style = css.padding(css.clamp("1rem", "2vw", css.calc(t.space.md, "*", 2)));
export const op: css.Style = css.opacity(css.clamp(0, 0.5, 1));
export const rd: css.Style = css.width(css.round("up", t.space.md, "4px"));
export const sn: CSSStyleValue<"number"> = css.sin("30deg");
export const at: CSSStyleValue<"angle"> = css.atan2(t.space.md, "1rem");
export const time: css.Style = css.transitionDuration(css.calc(t.time.fast, "*", 2));
// @ts-expect-error a length and a time cannot be added
css.calc(t.space.md, "+", t.time.fast);
// @ts-expect-error a length times a length is not a length
css.calc(t.space.md, "*", t.space.md);
// @ts-expect-error a number cannot be divided by a length
css.calc(2, "/", t.space.md);
// @ts-expect-error a colour is not a number or a dimension
css.calc(t.color.accent, "*", 2);
// @ts-expect-error min takes one kind
css.min(t.space.md, t.time.fast);
// @ts-expect-error a length is not a colour
css.color(css.min("1rem", "2rem"));
// @ts-expect-error a number is not a length
css.width(css.calc(2, "*", 3));
// @ts-expect-error a length is not an opacity
css.opacity(css.calc(t.space.md, "*", 2));

// any other function: the parts are checked against its grammar, the result is a part where that grammar is
export const ld: css.Style = css.color(css.lightDark("white", t.color.bg));
export const mixed: css.Style = css.color(css.colorMix("in oklab", t.color.accent, "black 15%"));
export const polar: css.Style = css.color(css.colorMix("in oklch longer hue", "red", "blue 30%"));
export const nested: css.Style = css.color(
  css.lightDark(css.rgb(255, 0, 0), css.oklch(0.7, 0.1, 200, "/", 0.5)),
);
export const grad: css.Style = css.backgroundImage(
  css.linearGradient("to right", t.color.accent, "red 50%", "blue"),
);
export const bez: css.Style = css.transitionTimingFunction(css.cubicBezier(0.1, 0.7, 1, 0.1));
export const rot: css.Style = css.transform(css.translateFn(t.space.md, 0), css.rotateFn("10deg"));
export const img: css.Style = css.backgroundImage(css.url('"a.png"'));
export const rgbValue: CSSStyleValue<"rgb()"> = css.rgb(255, 0, 0);
// @ts-expect-error not a colour space
css.colorMix("in rgb", "red", "blue");
// @ts-expect-error a length is not a colour
css.lightDark("white", t.space.md);
// @ts-expect-error two colours
css.lightDark("white");
// @ts-expect-error a gradient is not a colour
css.color(css.linearGradient("red", "blue"));
// @ts-expect-error a colour is not a length
css.width(css.rgb(1, 2, 3));
// @ts-expect-error no such unit
css.rgb(255, 0, "banana");

// var(): the token's type, the fallback checked as a value of it
export const v: css.Style = css.padding(css.var(t.space.md, "4px"));
export const v2: css.Style = css.color(css.var(t.color.accent));
// @ts-expect-error a length is not a colour
css.color(css.var(t.space.md));
// @ts-expect-error the fallback is a length
css.padding(css.var(t.space.md, "red"));
// @ts-expect-error a name is not a token
css.var("--space-md");

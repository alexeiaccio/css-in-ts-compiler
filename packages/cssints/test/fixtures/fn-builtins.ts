import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  color: { $type: "color", accent: { $value: "oklch(62% 0.19 259)" }, bg: { $value: "white" } },
  space: { $type: "dimension", md: { $value: "16px" }, sm: { $value: "8px" } },
});

export const a = css.color(css.colorMix("in oklab", t.color.accent, "black 15%"));
export const b = css.color(css.colorMix("in oklch longer hue", "red 30%", t.color.accent));
export const c = css.maxWidth(css.min("48rem", "100%"));
export const d = css.padding(css.clamp(t.space.md, "2vw", "2rem"));
export const e = css.opacity(css.clamp(0, 0.5, 1));
export const f = css.width(css.max(t.space.md, "10vw"));
export const g = css.width(css.calc(t.space.md, "*", 2));
export const h = css.gap(css.calc(t.space.md, "+", t.space.sm, "/", 2));
export const i = css.color(css.lightDark("white", t.color.bg));
export const j = css.color(css.oklch(0.7, 0.1, 200, "/", 0.5));
export const k = css.backgroundImage(css.linearGradient("to right", t.color.accent, "red 50%", "blue"));
export const l = css.padding(css.var(t.space.sm, "4px"));
export const m = css.transform(css.translateFn(t.space.md, 0), css.rotateFn("10deg"));
export const n = css.transitionTimingFunction(css.cubicBezier(0.1, 0.7, 1, 0.1));
export const o = css.color(css.rgb(255, 0, 0));
export const p = css.width(css.calc(css.min(t.space.md, "50%"), "-", "1rem"));
export const q = css.backgroundImage(css.url('"a.png"'));

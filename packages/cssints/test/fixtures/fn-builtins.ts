import * as css from "cssints" with { type: "cssints" };

const t = css.createTokens({
  color: { $type: "color", accent: { $value: "oklch(62% 0.19 259)" } },
  space: { $type: "dimension", md: { $value: "16px" } },
});

export const a = css.color(css.colorMix("oklab", t.color.accent(), "black 15%"));
export const b = css.color(css.colorMix("oklch longer hue", "red 30%", t.color.accent()));
export const c = css.maxWidth(css.min("48rem", "100%"));
export const d = css.padding(css.clamp(t.space.md(), "2vw", "2rem"));
export const e = css.opacity(css.clamp<"number">(0, 0.5, 1));
export const f = css.width(css.max(t.space.md(), "10vw"));

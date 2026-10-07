import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
  hue: { $type: "number", accent: { $value: 345 } },
  radius: {
    $type: "dimension",
    sm: { $value: "4px" },
    md: { $value: "8px" },
    lg: { $value: "calc({radius.md} * 2)" },
  },
  color: {
    $type: "color",
    accent: { $value: "oklch(0.6 0.2 {hue.accent})" },
    hover: { $value: "color-mix(in oklab, {color.accent}, black 15%)" },
    soft: { $value: "#eee" },
  },
}, (path) => ["refs", ...path].join("-"));

// a whole-value reference, and one inside a value; the hue is set in the same theme
css.createGlobalTheme(t, ".square", { radius: { md: "{radius.sm}" } });
css.createGlobalTheme(t, ".dim", {
  hue: { accent: 12 },
  color: { accent: "oklch(0.7 0.1 {hue.accent})", soft: "{color.accent}" },
});

export const box = css.cn(css.bg(t.color.hover), css.p(t.radius.lg), css.color(t.color.soft));

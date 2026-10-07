import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
  color: {
    $type: "color",
    accent: { $value: "#2563eb" },
    hover: { $value: "color-mix(in oklab, {color.accent}, black 15%)" },
    ring: { $value: "oklch(from {color.hover} l c h / 50%)" },
  },
  space: { $type: "dimension", md: { $value: "16px" }, lg: { $value: "calc({space.md} * 2)" } },
});

// a theme sets the source; every token derived from it is declared again under the theme
css.createGlobalTheme(t, ".brand", { color: { accent: "#db2777" } });

export const button = css.cn(css.bg(t.color.hover()), css.outlineColor(t.color.ring()), css.p(t.space.lg()));

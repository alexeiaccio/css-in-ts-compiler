import * as css from "cssints" with { type: "cssints" };

// root.hue.accent is read by the others and used by no class: the derived tokens and the theme need its @property rule
export const t = css.createTokens({
  root: {
    hue: { $type: "number", accent: { $value: 345 } },
    color: {
      $type: "color",
      accent: { $value: "oklch(0.6 0.2 {root.hue.accent})" },
      soft: { $value: "oklch(0.9 0.05 {root.hue.accent})" },
      hover: { $value: "oklch(0.5 0.2 {root.hue.accent})" },
    },
  },
});
css.createGlobalTheme(t, ".dim", { root: { color: { hover: "oklch(0.7 0.18 {root.hue.accent})" } } });

export const card = css.cn(
  css.bg(t.root.color.soft()),
  css.color(t.root.color.accent()),
  css.outlineColor(t.root.color.hover()),
);

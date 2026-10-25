import * as css from "cssints/clay" with { type: "cssints" };

// no direction: CSS's default, `to bottom` (180deg), top to bottom
export const vertical = css.backgroundImage("linear-gradient(rgb(27 32 38), rgb(21 25 30))");
// `to right` is 90deg; a hex colour, a name and an rgb() with commas are colours too, spread evenly
export const right = css.backgroundImage("linear-gradient(to right, #fff, red, rgb(0, 0, 0))");
// an angle, and two stops that are not the ends: they keep their offsets
export const angled = css.backgroundImage("linear-gradient(45deg, red 25%, blue 75%)");
// given and missing offsets: red 10, green halfway to 40 (25), blue 40, white at the end (100)
export const given = css.backgroundImage("linear-gradient(180deg, red 10%, green, blue 40%, white)");
// a theme changes a stop's colour: the literals a token stands for are per theme
export const t = css.createTokens({
  color: {
    $type: "color",
    panel: { $value: "rgb(27 32 38)" },
    deep: { $value: "rgb(21 25 30)" },
  },
});
css.createGlobalTheme(t, "light", { color: { panel: "white", deep: "rgb(240 243 246)" } });
export const themed = css.backgroundImage(
  `linear-gradient(180deg, ${t.color.panel}, ${t.color.deep})`,
);
// a state overrides the whole gradient, stops and all
export const card = css.cn(vertical, css.hover(angled));
// a gradient beside a declaration: the layout and the colour are printed, the gradient is not
export const panelled = css.cn(
  css.width(336),
  css.bg("rgb(23 27 32)"),
  css.borderRadius(12),
  vertical,
);

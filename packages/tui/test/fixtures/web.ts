import * as css from "cssints" with { type: "cssints" };

// web tokens with the names of theme.ts's terminal tokens (--color-bg, --color-fg), in the same build (cssints-0s1z)
export const w = css.createTokens({
  color: { $type: "color", bg: { $value: "#ffffff" }, fg: { $value: "#111111" } },
});
css.createGlobalTheme(w, ".dark", { color: { bg: "#000000" } });
export const box = css.cn(css.bg(w.color.bg), css.color(w.color.fg));

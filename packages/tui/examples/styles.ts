import * as css from "cssints/tui" with { type: "cssints" };

export const t = css.createTokens({
  color: {
    $type: "color",
    bg: { $value: "#1e1e2e" },
    fg: { $value: "#cdd6f4" },
    muted: { $value: "#7f849c" },
    accent: { $value: "#89b4fa" },
    hover: { $value: "color-mix(in oklab, {color.bg}, white 12%)" },
  },
});
css.createGlobalTheme(t, "light", {
  color: { bg: "#eff1f5", fg: "#4c4f69", muted: "#8c8fa1", accent: "#1e66f5" },
});

export const screen = css.cn(
  css.flexDirection("column"),
  css.width("100%"),
  css.height("100%"),
  css.p(1, 2),
  css.gap(1),
  css.bg(t.color.bg),
);
export const list = css.cn(
  css.flexDirection("column"),
  css.width(32),
  css.border("rounded", t.color.muted),
);
export const item = css.cn(
  css.width("100%"),
  css.p(0, 1),
  css.cursor("pointer"),
  css.hover(css.bg(t.color.hover)),
  css.active(css.bg(t.color.accent)),
);
export const label = css.cn(css.color(t.color.fg), css.hover(css.fontWeight("bold")));
export const help = css.cn(css.color(t.color.muted), css.fontStyle("italic"));

import * as css from "cssints/tui" with { type: "cssints" };

export const t = css.createTokens({
  color: {
    $type: "color",
    bg: { $value: "#1e1e2e" },
    fg: { $value: "#cdd6f4" },
    accent: { $value: "#89b4fa" },
    hover: { $value: "color-mix(in oklab, {color.bg}, white 10%)" },
  },
});
css.createGlobalTheme(t, "light", { color: { bg: "#eff1f5", fg: "#4c4f69", accent: "#1e66f5" } });

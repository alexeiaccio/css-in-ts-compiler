import * as css from "cssints" with { type: "cssints" };

export const t = css.createTokens({
  radius: { $type: "dimension", sm: { $value: "4px" } },
  color: {
    $type: "color",
    bg: { $value: "#fff" },
    fg: { $value: "#000" },
    alias: { $value: "{color.bg}" },
  },
}, (path) => ["type", ...path].join("-"));
css.createGlobalTheme(t, ".x", { color: { bg: "{radius.sm}" } });

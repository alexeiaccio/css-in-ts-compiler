// a user's looks: 12 calls over a 14-token set, with references and aspects
import { createGlobalTheme, createTokens } from "cssints";

const t = createTokens({
  color: {
    $type: "color",
    bg: { $value: "#ffffff" },
    fg: { $value: "#111827" },
    accent: { $value: "oklch(62% 0.19 259)" },
    muted: { $value: "#6b7280" },
    edge: { $value: "color-mix(in oklab, {color.bg}, black 10%)" },
    link: { $value: "{color.accent}" },
  },
  typography: {
    size: { $type: "dimension", $value: "16px" },
    lead: { $type: "dimension", $value: "20px" },
    weight: { $type: "fontWeight", $value: 400 },
  },
  space: { sm: { $type: "dimension", $value: "8px" }, md: { $type: "dimension", $value: "16px" } },
  hue: { $type: "number", accent: { $value: 259 } },
});

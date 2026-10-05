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
const g = (sel: string) => `[data-mode="${sel}"]` as const;
createGlobalTheme(t, g("dark"), { color: { bg: "#0b0b0f", fg: "#f3f4f6" }, typography: { size: "18px" } }, {});
createGlobalTheme(t, g("dark"), { color: { bg: "#101018", accent: "oklch(70% 0.1 200)" } });
createGlobalTheme(t, g("dark"), { color: { fg: "#fff", link: "{color.fg}" } });
createGlobalTheme(t, g("light"), { color: { bg: "#fff" } });
createGlobalTheme(t, g("sepia"), { color: { bg: "#f4ecd8", fg: "#5b4636", muted: "#8a7560" } });
createGlobalTheme(t, g("sepia"), { typography: { size: "20px", lead: "24px", weight: 500 } });
createGlobalTheme(t, g("com.alice.midnight"), { color: { bg: "#0a0a12", edge: "{color.muted}" } });
createGlobalTheme(t, g("hero"), { color: { bg: "#123456" } });
createGlobalTheme(t, g("roomy"), { space: { sm: "12px", md: "24px" } });
createGlobalTheme(t, g("roomy"), { space: { md: "32px" }, typography: { size: "19px" } });
createGlobalTheme(t, g("hue"), { hue: { accent: 12 } });
createGlobalTheme(t, g("x"), { color: { edge: "color-mix(in oklab, {color.fg}, white 20%)" } });

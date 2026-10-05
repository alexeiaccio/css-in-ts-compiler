// a user's looks: 12 calls over a 14-token set, with references and aspects
import { createTokens } from "cssints";
import { look } from "./out/mise-en-mode.js";

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
look(t, "dark", "app", { color: { bg: "#0b0b0f", fg: "#f3f4f6" }, typography: { size: "18px" } });
look(t, "dark", "author", { color: { bg: "#101018", accent: "oklch(70% 0.1 200)" } });
look(t, "dark", "viewer", { color: { fg: "#fff", link: "{color.fg}" } });
look(t, "light", "app", { color: { bg: "#fff" } });
look(t, "sepia", "app", { color: { bg: "#f4ecd8", fg: "#5b4636", muted: "#8a7560" } });
look(t, "sepia", "viewer", { typography: { size: "20px", lead: "24px", weight: 500 } });
look(t, "com.alice.midnight", "author", { color: { bg: "#0a0a12", edge: "{color.muted}" } });
look(t, "hero", "author", { color: { bg: "#123456" } }, { scope: "article.post" });
look(t, "roomy", "app", { space: { sm: "12px", md: "24px" } });
look(t, "roomy", "viewer", { space: { md: "32px" }, typography: { size: "19px" } });
look(t, "hue", "app", { hue: { accent: 12 } });
look(t, "x", "app", { color: { edge: "color-mix(in oklab, {color.fg}, white 20%)" } });

import { createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };

export const t = createTokens({
  color: {
    $type: "color",
    page: { $value: "#f3f4f6" },
    surface: { $value: "#ffffff" },
    text: { $value: "#111827" },
    accent: { $value: "#1d4ed8" },
  },
  space: { $type: "dimension", md: { $value: "16px" } },
});

createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  color: { page: "#0b0b0f", surface: "#171923", text: "#f3f4f6", accent: "#93c5fd" },
});

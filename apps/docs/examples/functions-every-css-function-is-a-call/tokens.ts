import { createTokens } from "cssints" with { type: "cssints" };

export const t = createTokens({
  color: {
    $type: "color",
    accent: { $value: "oklch(62% 0.19 259)" },
    bg: { $value: "#ffffff" },
    ink: { $value: "#0f172a" },
  },
  space: { $type: "dimension", sm: { $value: "8px" }, md: { $value: "16px" } },
  time: { $type: "duration", fast: { $value: "150ms" } },
});

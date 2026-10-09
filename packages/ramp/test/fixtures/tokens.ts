import { createGlobalTheme, createTokens, media } from "cssints" with { type: "cssints" };
import { overrides, ramp } from "@cssints/ramp";

const ratios = [1.2, 1.5, 3, 4.5, 7] as const;

export const t = createTokens({
  bg: { $type: "color", $value: "#ffffff" },
  blue: ramp("#2563eb", { mode: "contrast", ratios, background: "#ffffff" }),
  gray: ramp("#6b7280", { mode: "lightness", steps: 5 }),
});

createGlobalTheme(t, media("(prefers-color-scheme: dark)"), {
  bg: "#111111",
  blue: overrides(ramp("#2563eb", { mode: "contrast", ratios, background: "#111111" })),
});

import { bg, check, cn, color, createTokens } from "cssints" with { type: "cssints" };

import { fit, readable, tones } from "../../src/index.ts";

export const t = createTokens({
  bg: { $type: "color", $value: "#ffffff" },
  ink: { $type: "color", $value: readable("#ffffff") },
  blue: tones("#2563eb", 9),
  vivid: { $type: "color", $value: fit("oklch(0.7 0.4 150)") },
});

check.contrast(t.ink, t.bg, { min: 4.5 });

export const text = cn(color(t.ink), bg(t.bg));

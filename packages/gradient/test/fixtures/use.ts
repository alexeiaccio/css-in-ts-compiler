import { backgroundImage, createTokens, maskImage } from "cssints" with { type: "cssints" };
import { gradient } from "@cssints/gradient" with { type: "cssints" };

const t = createTokens({ color: { $type: "color", ink: { $value: "#111111" } } });

export const fade = backgroundImage(
  gradient("linear", "to bottom", "#000", "transparent", "ease-in-out", 5),
);
export const scrim = backgroundImage(
  gradient("linear", "180deg", "oklch(0% 0 0 / 0.8)", "transparent"),
);
export const glow = backgroundImage(
  gradient("radial", "circle at top", "red", "blue", "cubic-bezier(0.5, 0, 0.5, 1)", 4),
);
export const sweep = maskImage(
  gradient("conic", "from 90deg", "black", "transparent", "linear", 3),
);
export const token = backgroundImage(
  gradient("linear", "to right", t.color.ink, "white", "ease-in", 4),
);
export const edge = backgroundImage(
  gradient("linear", "to top", "currentColor", "transparent", "ease-out", 3),
);

import { cn } from "cssints";
import type { Style } from "cssints/plugin";

import { font } from "../../src/index.ts";

const body = font("Atkinson Hyperlegible", { provider: "fontsource", weights: [400, 700] });
const brand = font("Brand", {
  provider: "fs",
  files: ["src/fonts/brand.woff2"],
  fallback: "serif",
});

export const family: Style = body.family();
export const trimmed = cn(body.family(), body.trim(), brand.trim({ lineHeight: 1.5 }));
export const text = body.trim({ lineHeight: "1.25" });

// @ts-expect-error a line height is a number, not a length
export const px = body.trim({ lineHeight: "24px" });
// @ts-expect-error not a number
export const tall = body.trim({ lineHeight: "tall" });
// @ts-expect-error family() takes nothing
export const arg = body.family("serif");

// @ts-expect-error a provider that does not exist
font("Inter", { provider: "google" });
// @ts-expect-error fs takes files
font("Brand", { provider: "fs", dir: "src/fonts" });
// @ts-expect-error a generic family with metrics
font("Inter", { provider: "fontsource", fallback: "cursive" });
// @ts-expect-error a weight is a number
font("Inter", { provider: "fontsource", weights: ["bold"] });

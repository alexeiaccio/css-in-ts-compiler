import { check, createGlobalTheme } from "cssints" with { type: "cssints" };
import { dark, darkAlpha, light } from "@cssints/tokens/radix";

import { t, ta } from "./radix-tokens.ts";

createGlobalTheme(t.radix, ".dark", dark);
createGlobalTheme(ta.radix, ".dark", darkAlpha);

// Radix tunes step 11 for APCA, not WCAG 2: these step-11 pairs are below 4.5 (README "Contrast").
const below = new Set([
  "amber 11/2",
  "green 11/2",
  "jade 11/2",
  "orange 11/1",
  "orange 11/2",
  "teal 11/1",
  "teal 11/2",
  "yellow 11/1",
  "yellow 11/2",
]);
for (const scale of Object.keys(light) as (keyof typeof light)[]) {
  const s = t.radix[scale];
  for (const [fg, bg, pair] of [
    [s._12, s._1, "12/1"],
    [s._12, s._2, "12/2"],
    [s._11, s._1, "11/1"],
    [s._11, s._2, "11/2"],
  ] as const)
    check.contrast(fg, bg, { min: below.has(`${scale} ${pair}`) ? 4 : 4.5 });
}

import { cn, createTokens } from "cssints" with { type: "cssints" };

import { brand, icon, look, ring, tint, webkitFontSmoothing } from "./scope-kit" with { type: "cssints" };

export const a = ring().width("thin").color("red");
export const b = cn(ring().width(2).plain(), webkitFontSmoothing("none"));
export const c = ring().color(brand.color.accent);
export const d = tint("red", "10%");
export const e = icon("home");
export const l = look("red", brand, { color: { accent: "blue" } }, { size: "2px", in: "viewer" });
export const m = look("red", brand, { color: { accent: "green" } });

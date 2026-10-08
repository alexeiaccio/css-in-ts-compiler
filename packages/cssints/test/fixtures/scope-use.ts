import { borderWidth, cn, color, createTokens, outlineColor } from "cssints" with { type: "cssints" };

import { alive, brand, edged, icon, look, loose, ring, shade, tint, webkitFontSmoothing } from "./scope-kit" with { type: "cssints" };

export const a = ring().width("thin").color("red");
export const b = cn(ring().width(2).plain(), webkitFontSmoothing("none"));
export const c = ring().color(brand.color.accent);
export const d = tint("red", "10%");
export const e = icon("home");
export const f = shade("red", { by: "20%", dark: true });
export const g = shade("red");
export const l = look("red", brand, { color: { accent: "blue" } }, { size: "2px", in: "viewer" });
export const m = look("red", brand, { color: { accent: "green" } });
export const n = alive().color("red");
export const o = edged().color("red");
export const q = cn(loose().color("red"), outlineColor("blue"));
export const r = cn(ring(), color("red"), edged(), borderWidth("1px"));

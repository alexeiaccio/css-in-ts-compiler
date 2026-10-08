import { cn, color } from "cssints" with { type: "cssints" };

import { body, brand } from "./defs.ts" with { type: "cssints" };

export const a = body.family();
export const b = cn(body.family(), color("red"));
export const c = body.trim();
export const d = body.trim({ lineHeight: 1.5 });
export const e = brand.family();

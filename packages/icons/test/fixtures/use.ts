import { cn, width } from "cssints" with { type: "cssints" };

import { brand, mdi } from "./defs.ts" with { type: "cssints" };

export const a = mdi("home");
export const b = cn(mdi("home"), width("2em"));
export const c = brand("star");
export const d = brand("logo");
export const e = mdi("home-outline");

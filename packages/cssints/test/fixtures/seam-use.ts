import { cn, p } from "cssints" with { type: "cssints" };

import { mdi } from "./seam-defs" with { type: "cssints" };
import { box } from "./seam-kit" with { type: "cssints" };

export const a = box().width("2px");
export const b = cn(box().width("2px"), p(4), box().width("2px"));
export const c = mdi("home");
export const d = mdi("star");

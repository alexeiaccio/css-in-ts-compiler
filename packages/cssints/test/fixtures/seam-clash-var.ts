import { cn } from "cssints" with { type: "cssints" };

import { box, ring } from "./seam-kit" with { type: "cssints" };

export const a = cn(box().width("2px"), ring().width("1px"));

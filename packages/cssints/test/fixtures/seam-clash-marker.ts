import { cn } from "cssints" with { type: "cssints" };

import { box, chip } from "./seam-kit" with { type: "cssints" };

export const a = cn(box().width("2px"), chip().width("1px"));

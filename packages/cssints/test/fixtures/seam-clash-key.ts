import { cn } from "cssints" with { type: "cssints" };

import { box, boxOther } from "./seam-kit" with { type: "cssints" };

export const a = cn(box().width("2px"), boxOther().width("1px"));

import { cn } from "cssints" with { type: "cssints" };

import { chip, chipA } from "./seam-kit" with { type: "cssints" };

export const a = cn(chip().width("2px"), chipA().width("1px"));

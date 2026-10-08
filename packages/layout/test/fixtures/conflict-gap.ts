import { cn, rowGap } from "cssints" with { type: "cssints" };
import { autoGrid } from "@cssints/layout" with { type: "cssints" };

export const a = cn(autoGrid(), rowGap("1rem"));

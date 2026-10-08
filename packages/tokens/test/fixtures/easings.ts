import { cn, transitionTimingFunction } from "cssints" with { type: "cssints" };
import { easings } from "@cssints/tokens/easings";

export const slide = cn(transitionTimingFunction(easings.easeOutBack));

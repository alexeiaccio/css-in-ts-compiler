import { animationDuration, cn } from "cssints" with { type: "cssints" };
import { reveal } from "@cssints/reveal" with { type: "cssints" };

export const a = cn(reveal().preset("fade-in"), animationDuration("1s"));

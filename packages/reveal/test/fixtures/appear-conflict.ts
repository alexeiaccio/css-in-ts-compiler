import { animationDuration, cn } from "cssints" with { type: "cssints" };
import { appear } from "@cssints/reveal" with { type: "cssints" };

export const a = cn(appear().preset("fade-in"), animationDuration("1s"));

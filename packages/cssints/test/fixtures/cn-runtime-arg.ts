import { cn, p } from "cssints" with { type: "cssints" };

// a runtime value goes in the condition, never in the style's own argument
export const Box = (n: number, on: boolean) => cn(p(2), on && p(n));

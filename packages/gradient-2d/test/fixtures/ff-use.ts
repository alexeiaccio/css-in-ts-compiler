import { cn } from "cssints" with { type: "cssints" };
import { freeformGradient, meshGradient } from "../../src/index.ts" with { type: "cssints" };

export const hero = freeformGradient("red top left, gold 4 60% 40%, yellow bottom right");
export const srgb = freeformGradient("in srgb, red 20% 30%, blue right 10%");
export const token = freeformGradient("var(--accent) 10% 10%, blue bottom right");
export const both = cn(hero, meshGradient("red, blue; green, yellow"));

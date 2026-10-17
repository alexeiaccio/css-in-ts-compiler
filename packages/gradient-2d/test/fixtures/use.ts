import { cn, color } from "cssints" with { type: "cssints" };
import { meshGradient } from "../../src/index.ts" with { type: "cssints" };

export const hero = meshGradient("red, blue; green, yellow");
export const grid = meshGradient(
  "in oklab, red, green, blue; yellow, white, black; cyan, magenta, #888",
);
export const token = meshGradient("var(--accent), blue; green, yellow");
export const both = cn(hero, color("red"));

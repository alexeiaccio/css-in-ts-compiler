import { meshGradient } from "../../src/index.ts";

export const a: string = meshGradient("red, blue; green, yellow");
export const b: string = meshGradient(
  "in oklab, red, green, blue; yellow, white, black; cyan, magenta, #888",
);
// @ts-expect-error the argument is the spec's text, a string
export const e1 = meshGradient(1);
// @ts-expect-error one argument
export const e2 = meshGradient("red, blue; green, yellow", "in oklab");
// @ts-expect-error a call takes its argument
export const e3 = meshGradient();

import { freeformGradient } from "../../src/index.ts";

export const a: string = freeformGradient("red top left, gold 4 60% 40%, yellow bottom right");
export const b: string = freeformGradient("in srgb, var(--accent) 10% 10%, blue bottom right");
// @ts-expect-error the argument is the spec's text, a string
export const e1 = freeformGradient(1);
// @ts-expect-error one argument
export const e2 = freeformGradient("red top left, blue bottom right", "in oklab");
// @ts-expect-error a call takes its argument
export const e3 = freeformGradient();

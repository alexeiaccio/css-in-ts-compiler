import { cn, animation, color } from "cssints" with { type: "cssints" };
import { m as a } from "./sc-around-a.ts" with { type: "cssints" };
import { m as b } from "./sc-around-b.ts" with { type: "cssints" };
export const x = cn(a(), animation("none"), color("red"));
export const y = b();

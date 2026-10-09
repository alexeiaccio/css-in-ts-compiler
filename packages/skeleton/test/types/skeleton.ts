import { cn } from "cssints";
import type { Style } from "cssints/plugin";

import { skeleton } from "../../src/index.ts";

export const a: Style = skeleton();
export const b = cn(skeleton().radius("8px"), skeleton().radius("50%"));
export const c = skeleton().color("oklch(90% 0 0)").highlight("white").radius("calc(1rem + 2px)");
// @ts-expect-error a radius is not negative
export const e1 = skeleton().radius("-4px");
// @ts-expect-error not a colour
export const e2 = skeleton().color("4px");
// @ts-expect-error not a colour
export const e3 = skeleton().highlight("bright");
// @ts-expect-error a method is used once
void skeleton().radius("1px").radius;
// @ts-expect-error no such method
void skeleton().duration;

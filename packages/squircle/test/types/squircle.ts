import { cn } from "cssints";
import type { Style } from "cssints/plugin";

import { squircle } from "../../src/index.ts";

export const a: Style = squircle();
export const b = cn(squircle().radius("24px"), squircle().radius("50%"));
export const c = squircle().radius("calc(1rem + 4px)");
// @ts-expect-error a radius is not negative
export const e1 = squircle().radius("-4px");
// @ts-expect-error not a length
export const e2 = squircle().radius("red");
// @ts-expect-error a method is used once
void squircle().radius("1px").radius;
// @ts-expect-error no such method
void squircle().smoothing;

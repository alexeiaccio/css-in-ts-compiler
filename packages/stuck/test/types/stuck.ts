import { cn, color, hover } from "cssints";

import { sticky, stuck } from "../../src/index.ts";

export const a: string = sticky().top("0");
export const b = cn(sticky().bottom(2).left("10%"), color("blue"));
export const c: string = stuck(color("red"), hover(color("black")));
export const d: string = stuck("bottom")(color("green"));
// @ts-expect-error not a length
export const e1 = sticky().top("red");
// @ts-expect-error a method is used once
export const e2 = sticky().top("0").top("1px");
// @ts-expect-error no such side
export const e3 = stuck("middle")(color("red"));
// @ts-expect-error styles, not a string
export const e4 = stuck("red", color("red"));
// @ts-expect-error a sticky chains its insets only
export const e5 = sticky().inset("0");

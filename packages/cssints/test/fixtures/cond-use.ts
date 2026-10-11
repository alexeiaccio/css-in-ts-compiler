import { cn, cv, focusVisible, hover, p } from "cssints" with { type: "cssints" };

import { dark, lg, md } from "./cond-helpers" with { type: "cssints" };

export const a = cn(p(2), md(p(4)), lg(hover(p(6))), dark(cn(p(1), focusVisible(p(3)))));
export const button = cv({ base: cn(p(2), hover(p(3))), variants: { size: { lg: md(p(5)) } } });
export const runtime = (on: boolean) => cn(on && md(p(7)));

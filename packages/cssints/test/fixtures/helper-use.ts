
import { cn, p, sx } from "cssints" with { type: "cssints" };
import { stack, surface, tabletUp } from "./helpers" with { type: "cssints" };
import { brand } from "./tokens";

export const a = stack(2);
export const b = surface(brand);
export const runtime = (on: boolean) => cn(stack(4), on && surface("white"));
export const overridden = cn(surface("white"), p(0));
export const sidebar = tabletUp(() => sx().inlineSize("12rem"));

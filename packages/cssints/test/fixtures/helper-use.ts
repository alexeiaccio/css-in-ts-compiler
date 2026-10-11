
import { cn } from "cssints" with { type: "cssints" };
import { stack, surface } from "./helpers" with { type: "cssints" };
import { brand } from "./tokens";

export const a = stack(2);
export const b = surface(brand);
export const runtime = (on: boolean) => cn(stack(4), on && surface("white"));

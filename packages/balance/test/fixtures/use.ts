import { cn, color, hover } from "cssints" with { type: "cssints" };
import { balance, pretty } from "@cssints/balance" with { type: "cssints" };

export const title = balance();
export const lead = pretty();
export const both = cn(balance(), color("red"), hover(color("blue")));

import { cn, color, hover } from "cssints" with { type: "cssints" };
import { sticky, stuck } from "@cssints/stuck" with { type: "cssints" };

export const bar = sticky().top("0");
export const foot = cn(sticky().bottom(2).left("10%"), color("blue"));
export const title = stuck(color("red"));
export const link = cn(color("gray"), stuck("bottom")(color("green"), hover(color("black"))));

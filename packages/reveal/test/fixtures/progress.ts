import { blockSize, cn, color } from "cssints" with { type: "cssints" };
import { progress } from "@cssints/reveal" with { type: "cssints" };

export const bar = cn(progress(), blockSize("3px"), color("tomato"));
export const side = cn(
  progress().axis("y").timeline("scroll(nearest)").range("entry 0% cover 100%"),
  blockSize("40px"),
);

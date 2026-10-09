import { cn, hover, height, width } from "cssints" with { type: "cssints" };
import { skeleton } from "@cssints/skeleton" with { type: "cssints" };

export const a = skeleton();
export const b = cn(
  skeleton().radius("50%").color("#ddd").highlight("#eee"),
  width("4rem"),
  height("4rem"),
);
export const c = cn(skeleton(), hover(skeleton().highlight("white")));

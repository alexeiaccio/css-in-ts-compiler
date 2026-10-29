import { cn, hover } from "cssints" with { type: "cssints" };
import { appear } from "@cssints/reveal" with { type: "cssints" };

export const fade = appear();
export const slide = appear()
  .preset("slide-in-up")
  .range("entry 50% exit 0%")
  .duration("600ms")
  .easing("linear")
  .inOut();
export const card = cn(appear().preset("blur-in"), hover(appear().duration("1s")));

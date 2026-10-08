import { cn, color, hover } from "cssints" with { type: "cssints" };
import { reveal } from "@cssints/reveal" with { type: "cssints" };

export const fade = reveal();
export const slide = reveal()
  .preset("slide-in-up")
  .range("entry 0% entry 100%")
  .duration("500ms")
  .easing("linear");
export const card = cn(reveal().preset("blur-in"), color("red"), hover(reveal().duration("1s")));

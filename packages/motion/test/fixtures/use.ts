import { cn, color, hover } from "cssints" with { type: "cssints" };
import { motion } from "@cssints/motion" with { type: "cssints" };

export const fade = motion().preset("fade-in");
export const slide = motion()
  .preset("slide-in-up")
  .duration("500ms")
  .delay("100ms")
  .easing("linear");
export const exit = cn(motion().preset("blur-out"), color("red"), hover(motion().duration("1s")));

import { cn, hover, media, token } from "cssints";
import { ring } from "./out/ring.js";
const w = token.length("3px", "ring-w");
export const calls = [
  ring(), ring().width("1px"), ring().color("red"), ring().width("2px").color("#123"),
  ring().color("oklch(60% 0.2 20)").width("calc(1px + 1px)"), ring().width(w), ring().width(w).color("red"),
  cn(ring().width("1px"), hover(ring().width("3px"))), cn(ring(), media("(width >= 40rem)")(ring().width("4px"))),
  ring().color("currentColor"), ring().width("0"), ring().color("transparent"), ring().width("1rem").color("blue"),
  ring().width("2px"), ring().color("black"), ring().width("5px"), ring().color("white"), ring().width(w).color("red"),
  ring().color("hsl(10 20% 30%)"), ring().width("1em"),
];

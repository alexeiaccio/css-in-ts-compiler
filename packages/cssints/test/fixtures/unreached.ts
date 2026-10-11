import { color, cn, p } from "cssints" with { type: "cssints" };

const gap = 4;
const off = false && p(gap);
let taken;
if (off) {
  taken = p(gap + 1);
} else {
  taken = color("red");
}
export const arm = gap > 9 ? p(gap + 2) : color("blue");
export const both = cn(off, taken, arm);

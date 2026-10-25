// chain() as user code writes it: twelve chains of five properties. The same declarations as `cn(flex(), bg("red"), ...)`
// cost 264_798 (tsc) and 275_791 (tsgo) on the 2026-10-25 measurement, so a chain is about 3% dearer than the cn() form.
import { chain } from "cssints" with { type: "cssints" };

export const a1 = chain().flex().bg("red").p(4).gap(2).fontSize("1rem");
export const a2 = chain().grid().p(1).gap(1).color("red").opacity(0.5);
export const a3 = chain().display("block").p(2).bg("blue").gap(3).m(1);
export const a4 = chain().padding("1rem").pl("2rem").bg("green").gap(1).pt(2);
export const a5 = chain().flex().flex(1).p(3).bg("black").gap(4).mr(2);
export const a6 = chain().p(1).border("1px solid").bg("white").gap(5).width("100%");
export const a7 = chain().flex().bg("red").p(4).gap(2).fontSize("1rem");
export const a8 = chain().grid().p(1).gap(1).color("red").opacity(0.5);
export const a9 = chain().display("block").p(2).bg("blue").gap(3).m(1);
export const a10 = chain().padding("1rem").pl("2rem").bg("green").gap(1).pt(2);
export const a11 = chain().flex().flex(1).p(3).bg("black").gap(4).mr(2);
export const a12 = chain().p(1).border("1px solid").bg("white").gap(5).width("100%");

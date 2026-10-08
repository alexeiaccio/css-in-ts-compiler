import { p } from "cssints" with { type: "cssints" };

const gap = 4;
export const Box = (name: string) => [name, p(Math.max(gap, 2)), p(gap > 3 ? 8 : 9)];

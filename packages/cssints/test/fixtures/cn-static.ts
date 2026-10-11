import { cn, hover, media, p } from "cssints" with { type: "cssints" };

const md = media("(width >= 40rem)");
const dev = false;

// everything is known at build time: one class string, no runtime call and no import of the runtime
export const a = cn(p(2), md(p(4)), hover(p(3)), dev && p(9));

import { cn, p, hover, media } from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };

export const a = frame().radius("24px").padding(2).border("2px").margin(1);
export const b = cn(frame().padding("1em"), media("(width >= 40rem)")(frame().padding(6)));
export const c = cn(frame().radius("8px"), hover(frame().radius("2px")));

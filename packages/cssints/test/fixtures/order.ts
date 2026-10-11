import { border, borderColor, cn, p, pl } from "cssints" with { type: "cssints" };

// Either order in cn: the longhand wins, since the sheet puts the shorthand first.
export const a = cn(pl(2), p(4));
export const b = cn(p(4), pl(2));
export const c = cn(borderColor("red"), border("1px solid"));

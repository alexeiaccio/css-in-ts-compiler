import { cx } from "cssints";
import { border, borderColor, p, pl } from "cssints" with { type: "cssints" };

// Either order in cx: the longhand wins, since the sheet puts the shorthand first.
export const a = cx(pl(2), p(4));
export const b = cx(p(4), pl(2));
export const c = cx(borderColor("red"), border("1px solid"));

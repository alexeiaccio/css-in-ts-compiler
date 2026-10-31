// The lists of plug-list.ts: two and three of one property in one cn() are one class with the joined value, and two
// different conditions keep both (a list under another condition is another alternative, not an appendix).
import { cn, media } from "cssints" with { type: "cssints" };

import { list } from "./plug-list" with { type: "cssints" };

export const one = cn(list("a"), list("b"));
export const three = cn(list("a"), list("b"), list("c"));
export const apart = cn(
  media("(width >= 40rem)")(list("a")),
  media("(width >= 60rem)")(list("b")),
);

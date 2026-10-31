import { cn } from "cssints" with { type: "cssints" };

import { list, plain } from "./plug-list" with { type: "cssints" };

export const bad = cn(list("a"), plain("b"));

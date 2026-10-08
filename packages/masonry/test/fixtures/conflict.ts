import { cn, display } from "cssints" with { type: "cssints" };
import { masonry } from "@cssints/masonry" with { type: "cssints" };

export const a = cn(masonry().gap(2), display("grid"));

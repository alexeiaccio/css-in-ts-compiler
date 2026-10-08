import { cn, display } from "cssints" with { type: "cssints" };
import { stack } from "@cssints/layout" with { type: "cssints" };

export const a = cn(stack().gap(2), display("grid"));

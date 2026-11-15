import { cn, display } from "cssints" with { type: "cssints" };
import { pointer } from "@cssints/reveal" with { type: "cssints" };

export const across = pointer();
export const down = cn(pointer().axis("y"), display("block"));

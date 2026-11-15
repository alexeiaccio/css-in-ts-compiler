import { cn } from "cssints" with { type: "cssints" };
import { pointer } from "@cssints/reveal" with { type: "cssints" };

// One box across and one down: the pointer's fraction of each, which is the whole of pointer() until a browser ships it.
export const across = pointer();
export const down = cn(pointer().axis("y"));

import { cn, position } from "cssints" with { type: "cssints" };
import { sticky } from "@cssints/stuck" with { type: "cssints" };

export const a = cn(sticky().top("0"), position("relative"));

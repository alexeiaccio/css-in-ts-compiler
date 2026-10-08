import { cn, cornerTopLeftShape } from "cssints" with { type: "cssints" };
import { squircle } from "@cssints/squircle" with { type: "cssints" };

export const a = cn(squircle(), cornerTopLeftShape("bevel"));

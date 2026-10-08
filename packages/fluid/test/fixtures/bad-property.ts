import { color } from "cssints" with { type: "cssints" };
import { fluid } from "@cssints/fluid" with { type: "cssints" };

// @ts-expect-error a length is not a colour, in the types too
export const a = color(fluid("1rem", "2rem"));

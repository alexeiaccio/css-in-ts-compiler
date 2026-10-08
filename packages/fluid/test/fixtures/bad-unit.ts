import { fontSize } from "cssints" with { type: "cssints" };
import { fluid } from "@cssints/fluid" with { type: "cssints" };

// @ts-expect-error em cannot be computed, in the types too
export const a = fontSize(fluid("1em", "2em"));

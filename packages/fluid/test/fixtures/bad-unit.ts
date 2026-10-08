import { fontSize } from "cssints" with { type: "cssints" };
import { fluid } from "@cssints/fluid" with { type: "cssints" };

// a length to the types: em cannot be computed at build time
export const a = fontSize(fluid("1em", "2em"));

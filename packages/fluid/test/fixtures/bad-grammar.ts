import { fontSize } from "cssints" with { type: "cssints" };
import { fluid } from "@cssints/fluid" with { type: "cssints" };

// @ts-expect-error not a length, in the types too
export const a = fontSize(fluid.container("1rem", "red"));

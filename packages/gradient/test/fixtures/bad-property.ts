import { color } from "cssints" with { type: "cssints" };
import { gradient } from "@cssints/gradient" with { type: "cssints" };

// @ts-expect-error the types reject it too
export const a = color(gradient("linear", "to bottom", "red", "blue"));

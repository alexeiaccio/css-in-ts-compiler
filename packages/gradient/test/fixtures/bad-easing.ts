import { backgroundImage } from "cssints" with { type: "cssints" };
import { gradient } from "@cssints/gradient" with { type: "cssints" };

// @ts-expect-error the types reject it too
export const a = backgroundImage(gradient("linear", "to bottom", "red", "blue", "steps(4)"));

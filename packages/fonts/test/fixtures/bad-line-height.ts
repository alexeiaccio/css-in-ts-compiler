import { body } from "./defs.ts" with { type: "cssints" };

// @ts-expect-error not a number: the types reject it, and so does the build
export const a = body.trim({ lineHeight: "tall" });

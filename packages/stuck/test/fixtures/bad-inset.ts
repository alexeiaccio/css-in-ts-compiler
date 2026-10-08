import { sticky } from "@cssints/stuck" with { type: "cssints" };

// @ts-expect-error not a length
export const a = sticky().top("red");

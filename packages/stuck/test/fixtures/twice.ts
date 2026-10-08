import { sticky } from "@cssints/stuck" with { type: "cssints" };

// @ts-expect-error a method is used once
export const a = sticky().top("0").top("1px");

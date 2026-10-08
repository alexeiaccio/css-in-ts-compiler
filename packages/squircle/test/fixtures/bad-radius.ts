import { squircle } from "@cssints/squircle" with { type: "cssints" };

// @ts-expect-error a radius is not negative
export const a = squircle().radius("-4px");

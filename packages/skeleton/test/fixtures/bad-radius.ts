import { skeleton } from "@cssints/skeleton" with { type: "cssints" };

// @ts-expect-error a radius is not negative
export const a = skeleton().radius("-4px");

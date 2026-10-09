import { skeleton } from "@cssints/skeleton" with { type: "cssints" };

// @ts-expect-error not a colour
export const a = skeleton().color("4px");

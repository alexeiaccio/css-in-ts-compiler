import { color } from "cssints" with { type: "cssints" };
import { stuck } from "@cssints/stuck" with { type: "cssints" };

// @ts-expect-error not a side
export const a = stuck("middle")(color("red"));

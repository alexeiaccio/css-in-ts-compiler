import { bg, cn, hover } from "cssints" with { type: "cssints" };
import { squircle } from "@cssints/squircle" with { type: "cssints" };

export const a = squircle();
export const b = cn(squircle().radius("24px"), bg("tomato"), hover(squircle().radius("2rem")));

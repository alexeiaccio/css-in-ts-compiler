import { color, firstThatWorks } from "cssints/widely-available" with { type: "cssints" };
export const a = color(firstThatWorks("red", "contrast-color(red)"));

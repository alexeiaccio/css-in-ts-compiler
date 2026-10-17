import { color } from "cssints" with { type: "cssints" };
import { colorNames } from "@cssints/color-names" with { type: "cssints" };

// "orange-red" has two colour words, so it is in both sectors
export const red = color(colorNames.red("orange-red"));
export const orange = color(colorNames.orange("orange-red"));

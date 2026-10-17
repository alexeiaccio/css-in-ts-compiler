import { bg, color, cn } from "cssints" with { type: "cssints" };
import { colorNames, named } from "@cssints/color-names" with { type: "cssints" };

export const tag = cn(color(named("tangerine")), bg(named("midnight-blue")));
export const flag = color(colorNames.red("ferrari-red"));
export const both = color(colorNames.orange("orange-red"));
export const grey = color(colorNames.neutral("abalone"));
export const brown = color(colorNames.brown("chocolate"));
export const listGreen = color(named("green"));
export const css = color("green");

import { color, padding } from "cssints";

import { colorNames, named } from "../../src/index.ts";

export const a = color(named("tangerine"));
export const b = color(named("100-mph"));
export const c = color(named("rosé"));
export const d = color(colorNames.red("ferrari-red"));
export const e = color(colorNames.orange("orange-red"));
export const f = color(colorNames.neutral("abalone"));
export const g = color(colorNames.brown("chocolate"));
export const h = color(colorNames.green("green"));

// @ts-expect-error not a name of the list
export const i1 = color(named("tangerin"));
// @ts-expect-error "abalone" is neutral, not red
export const i2 = color(colorNames.red("abalone"));
// @ts-expect-error a number is not a name
export const i3 = color(named(1));
// @ts-expect-error a colour is not a length
export const i4 = padding(named("tangerine"));

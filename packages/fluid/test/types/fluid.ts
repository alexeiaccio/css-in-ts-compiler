import { color, fontSize, padding } from "cssints";

import { fluid, type Fluid } from "../../src/index.ts";

export const title: Fluid = fluid("1rem", "1.5rem");
export const wide = fluid("16px", "24px", { from: "40rem", to: "90rem" });
export const card = fluid.container("1rem", "2rem", { to: "60rem" });
export const a = fontSize(title);
export const b = padding(card);

// @ts-expect-error not a length
export const e1 = fluid("1rem", "red");
// @ts-expect-error em cannot be computed at build time
export const e2 = fluid("1em", "2em");
// @ts-expect-error a width is a length
export const e3 = fluid.container("1rem", "2rem", { from: "wide" });
// @ts-expect-error no such option
export const e4 = fluid("1rem", "2rem", { start: "20rem" });
// @ts-expect-error a length is not a colour
export const e5 = color(fluid("1rem", "2rem"));
// @ts-expect-error two lengths at least
export const e6 = fluid("1rem");

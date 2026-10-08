import { cn, fontSize, padding } from "cssints" with { type: "cssints" };
import { fluid } from "@cssints/fluid" with { type: "cssints" };

export const title = fontSize(fluid("1rem", "1.5rem"));
export const wide = fontSize(fluid("16px", "24px", { from: "40rem", to: "90rem" }));
export const card = cn(padding(fluid.container("1rem", "2rem", { from: "20rem", to: "60rem" })));
export const shrink = fontSize(fluid("2rem", "1.5rem"));
export const low = fontSize(fluid("1rem", "1.25rem", { from: "40rem", to: "60rem" }));
export const tight = fontSize(fluid("2rem", "3rem", { from: "60rem", to: "80rem" }));
export const gap = padding(fluid("1rem", "4rem", { zoom: false }));

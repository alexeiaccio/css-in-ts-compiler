import { cn, p, token } from "cssints";
import type { Style } from "cssints/plugin";

import { masonry } from "../../src/index.ts";

const space = token.length("24px", "space-md");

export const plain: Style = masonry();
export const wall = cn(masonry().columns("12rem").gap(4), p(2));
export const tokens = masonry().gap(space).columns(token.length("16rem", "col"));

// @ts-expect-error not a length
export const e1 = masonry().gap("red");
// @ts-expect-error a column width is a length, not a percentage
export const e2 = masonry().columns("50%");
// @ts-expect-error a lone number is a spacing step in gap only
export const e3 = masonry().columns(4);
// @ts-expect-error a method is used once
void masonry().gap(1).gap;
// @ts-expect-error masonry chains its own methods only
void masonry().min;

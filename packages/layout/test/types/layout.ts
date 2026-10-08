import { cn, p, token } from "cssints";
import type { Style } from "cssints/plugin";

import { autoGrid, cluster, cover, sidebar, stack, switcher } from "../../src/index.ts";

const space = token.length("24px", "space-md");

export const plain: Style = stack();
export const page = cn(stack().gap(4), p(2));
export const toolbar = cluster().gap(space).justify("space-between").align("baseline");
export const aside = sidebar().side("right").width("20rem").content("60%").gap(2);
export const buttons = switcher().threshold("30rem").gap(1);
export const hero = cover().minHeight("100dvh").gap("2rem");
export const cards = autoGrid().min("16rem").gap(space);

// @ts-expect-error not a length
export const e1 = stack().gap("red");
// @ts-expect-error a method is used once
void stack().gap(1).gap;
// @ts-expect-error the keywords of justify-content, not shorthands
export const e3 = cluster().justify("between");
// @ts-expect-error left or right
export const e4 = sidebar().side("top");
// @ts-expect-error content is a percentage
export const e5 = sidebar().content("20rem");
// @ts-expect-error a threshold is not a percentage
export const e6 = switcher().threshold("50%");
// @ts-expect-error a primitive chains its own methods only
void autoGrid().justify;

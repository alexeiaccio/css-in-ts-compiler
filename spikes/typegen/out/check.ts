import type { padding, width, border, alignItems, gap, color } from "./properties";
type Args<T extends unknown[]> = T;
declare function p(...a: Args<padding>): string;
declare function w(...a: Args<width>): string;
declare function b(...a: Args<border>): string;
declare function ai(...a: Args<alignItems>): string;
declare function g(...a: Args<gap>): string;
declare function c(...a: Args<color>): string;
declare const red: import("./values").ColorValue;
p("1rem"); p("1rem", "2%"); p(0, "1px", "2px", "3px");
w("auto"); w("100px"); ai("first", "baseline"); ai("safe", "center"); g("1rem", "normal"); b("1px", "solid", red); c(red);
// @ts-expect-error not a length (note: "1 rem" passes, TS `${number}` tolerates trailing whitespace; lightningcss catches it at build)
p("one rem");
// @ts-expect-error five values
p("1px", "1px", "1px", "1px", "1px");
// @ts-expect-error raw color string is not ColorValue
c("red");
// @ts-expect-error wrong keyword
w("fit");

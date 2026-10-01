// firstThatWorks: every value is checked for the property, and a bad one puts the error on that part (the
// firstThatWorks call), with the message of the declaration that has it. Each call is split over lines so
// `@ts-expect-error` (the next line only) proves the place.
import {
  border,
  color,
  firstThatWorks,
  flex,
  minHeight,
  p,
  padding,
  token,
  transition,
} from "cssints" with { type: "cssints" };
import { CSS, CSSColorValue } from "@cssints/css-grammar/values";

const brand = token.color("#0057b8", "brand");
const gap = token.length("16px", "gap");

export const ok = [
  minHeight(firstThatWorks("100dvh", "100vh")),
  color(firstThatWorks("oklch(55% 0.18 250)", "#0057b8")),
  color(firstThatWorks("oklch(55% 0.18 250)", brand, "red")),
  color(firstThatWorks(new CSSColorValue("#fff"), "var(--x)")),
  padding(firstThatWorks(CSS.px(1), "1rem")),
  padding("1rem", firstThatWorks("2dvh", "2vh")),
  padding(firstThatWorks("1px 2px", gap), "3px"),
  border("1px", firstThatWorks("solid", "dashed"), "red"),
  transition("opacity", firstThatWorks("0.2s", "1s")),
  flex().gap(firstThatWorks("1dvh", "1vh")),
];
export const held = firstThatWorks("100dvh", "100vh");
export const viaVariable = minHeight(held);

minHeight(
  // @ts-expect-error the wanted value is bad
  firstThatWorks("100dvhh", "100vh"),
);
minHeight(
  // @ts-expect-error the fallback is bad
  firstThatWorks("100dvh", "100vhh"),
);
minHeight(
  // @ts-expect-error the third value is bad
  firstThatWorks("100dvh", "100vh", "red"),
);
color(
  // @ts-expect-error a length is no colour
  firstThatWorks("oklch(55% 0.18 250)", "1px"),
);
padding(
  "1rem",
  // @ts-expect-error the fallback is bad in the declaration it is in
  firstThatWorks("2dvh", "red"),
);
padding(
  // @ts-expect-error a colour is no length
  firstThatWorks(brand, "1px"),
  "1rem",
);
border(
  "1px",
  // @ts-expect-error a fallback inside several parts is the whole declaration with each value
  firstThatWorks("solid red", "solud red"),
);
padding(
  // @ts-expect-error one fallback per declaration
  firstThatWorks("1px", "2px"),
  firstThatWorks("3px", "4px"),
);
// @ts-expect-error one value is no fallback
firstThatWorks("100dvh");
// @ts-expect-error a number is no value of a fallback
firstThatWorks("100dvh", 1);
// @ts-expect-error a fallback is not a Typed OM value: it fits no typed position
token.length(firstThatWorks("1px", "2px"));
// @ts-expect-error a style is no value
minHeight(firstThatWorks("100dvh", p(1)));

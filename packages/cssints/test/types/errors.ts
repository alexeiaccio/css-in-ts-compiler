// Where the type error of a bad part lands: on that argument, with the message of the whole value. Each call is
// split over lines so `@ts-expect-error` (which covers the next line only) proves the place: an error anywhere else
// leaves the directive unused and the error itself standing.
import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import {
  border,
  boxShadow,
  flex,
  grid,
  gridArea,
  margin,
  padding,
  transition,
} from "cssints" with { type: "cssints" };
import type { Valid } from "@cssints/css-grammar/css";
import { CSS, CSSColorValue } from "@cssints/css-grammar/values";

const accent = new CSSColorValue("#3b82f6");

padding(
  "2px",
  // @ts-expect-error the second part is the bad one
  "red",
);
padding(
  // @ts-expect-error the first part is the bad one
  "red",
  "2px",
);
border(
  "1px",
  // @ts-expect-error the middle part
  "solud",
  "red",
);
border(
  "1px",
  "solid",
  // @ts-expect-error the last part
  "nope",
);
padding(
  "1px",
  "2px",
  "3px",
  "4px",
  // @ts-expect-error a fifth part is one too many
  "5px",
);
padding(
  "1px 2px",
  // @ts-expect-error a part of several tokens counts as one
  "red",
);
padding(
  "var(--a)",
  // @ts-expect-error a var() stands for anything, the rest is still checked
  "red",
);
margin(
  CSS.px(1),
  // @ts-expect-error a typed part before it
  "red",
);
padding(
  "1px",
  // @ts-expect-error a colour is not a length
  accent,
);
padding(
  // @ts-expect-error a colour is not a length
  accent,
  "1px",
);
gridArea(
  "a",
  // @ts-expect-error the value ends too soon: the last part
  "/",
);
css.transition(
  "opacity",
  "0.2s",
  // @ts-expect-error a timing function
  "bad",
);
boxShadow(
  "0 0 1px",
  "red",
  // @ts-expect-error a third part that is no shadow part
  "bad",
);
// @ts-expect-error a shorthand with a bad part, no layout context
flex("1", "sideways").direction("column");
grid(
  "auto / 1fr",
  // @ts-expect-error a bad part of the shorthand
  "nope",
);
grid(
  // @ts-expect-error the message names "auto" (the furthest point of the alternatives), and so does the place
  "auto",
  "nope",
);
flex(
  "1",
  "1",
  // @ts-expect-error a bad part of the shorthand
  "red",
);
export const ok = cx(padding("1px", "2px"), border("1px", "solid", accent), transition("a", "1s"));

css.media(
  "(width >= 40rem)",
  // @ts-expect-error the second query is the bad one
  "(width >= )",
);
css.media(
  // @ts-expect-error the first query is the bad one
  "(width >= )",
  "(width >= 40rem)",
);

// A keyword in the wrong case stays an error, and the message says the canonical spelling.
type Said<V, K extends string> = V extends `${string}${K}${string}` ? true : false;
export const caseRed: Said<Valid<"color", "RED">, '("RED" is red in CSS; write "red")'> = true;
export const caseSystem: Said<
  Valid<"color", "accentcolor">,
  '("accentcolor" is AccentColor in CSS; write "AccentColor")'
> = true;
export const caseLater: Said<
  Valid<"border", "1px SOLID red">,
  '("SOLID" is solid in CSS; write "solid")'
> = true;
// a word that is no keyword of the property gets no such line
export const caseNone: Said<Valid<"border", "1px solud">, "in CSS; write"> = false;
export const caseValid: Valid<"color", "red"> = "red";

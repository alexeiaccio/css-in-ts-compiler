// What user code sees of the property members: `tsgo -p tsconfig.json` checks this file (`bun run typecheck`).
import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import {
  alignItems,
  animationName,
  bg,
  border,
  color,
  flexGrow,
  fontFamily,
  gap,
  inset,
  margin,
  marginTop,
  opacity,
  p,
  padding,
  paddingLeft,
  pl,
  transform,
  transition,
  width,
  zIndex,
} from "cssints" with { type: "cssints" };
import type { Style } from "cssints";
import { CSS, CSSColorValue } from "@cssints/css-grammar/values";

const accent = new CSSColorValue("#3b82f6");
declare const n: number;
declare const on: boolean;

// A shorthand, a colour, a keyword list, a function value, a typed part: valid.
export const ok: Style[] = [
  padding("1rem 2rem"),
  padding("1rem", "2rem"),
  padding(CSS.rem(1), CSS.rem(2)),
  padding("1rem", CSS.percent(10)),
  border("1px solid", accent),
  border("1px solid #e5e7eb"),
  color("rebeccapurple"),
  color(accent),
  bg("#eee"),
  css.bg("rgb(0 0 0 / 50%)"),
  alignItems("center"),
  margin("auto"),
  width("min-content"),
  transition("all 0.2s"),
  transform("translateX(1px) rotate(1deg)"),
  fontFamily("system-ui, sans-serif"),
  animationName("fade"),
];

// The short names are the properties they stand for.
export const short: Style[] = [
  p("1rem"),
  pl("8ch"),
  paddingLeft("8ch"),
  css.pt("1rem"),
  css.mb("auto"),
];

// A lone number: a spacing step in padding*, margin*, gap*, inset*; a CSS <number> elsewhere.
export const numbers: Style[] = [
  p(4),
  p(-2),
  pl(4),
  marginTop(2),
  gap(2),
  css.rowGap(1),
  inset(0),
  p(n),
  flexGrow(1),
  opacity(0.5),
  zIndex(3),
  opacity(n),
];

// A member is a class string: className, cx, cn, and a string.
export const cls: string = p(1);
export const joined: string = cx(p(1), color("red"), on && bg("red"), [width("1px")]);
export const merged: Style = css.cn(p(1), color("red"));

// @ts-expect-error a keyword that is not in the grammar
color("nope");
// @ts-expect-error a length needs its unit
width(100);
// @ts-expect-error a step is one number: two are joined into "1 2"
p(1, 2);
// @ts-expect-error the second part is wrong
padding("1rem", "foo");
// @ts-expect-error a shorthand takes at most four parts
padding("1px", "2px", "3px", "4px", "5px");
// @ts-expect-error a colour is not a length
padding(accent);
// @ts-expect-error a property takes a value
padding();
// @ts-expect-error a number is not a keyword
alignItems(1);
// @ts-expect-error a member gives a class string, not a plain one
export const plain: Style = "padding: 1rem";
// @ts-expect-error a style is not a value
padding(p(1));

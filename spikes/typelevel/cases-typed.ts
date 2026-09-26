// Typed-part rows: probe-typed.ts checks them with the types (sentinels), check-typed.ts with the runtime (toString).
import { CSS, CSSColorValue } from "./values.ts";

const accent = new CSSColorValue("#3b82f6");
export const typedCases = [
  ["padding", ["1rem 2rem"], true], ["padding", [CSS.rem(1), CSS.rem(2)], true], ["padding", ["1rem", CSS.percent(10)], true],
  ["border", ["1px solid", accent], true], ["border", [accent, "2px"], true], ["border", [CSS.px(1), "solid", accent], true],
  ["width", [CSS.percent(50)], true], ["opacity", [CSS.number(0.5)], true], ["color", [accent], true], ["gap", [CSS.em(1), "normal"], true],

  ["border", ["1px solid", CSS.px(2)], false], ["padding", [accent], false], ["padding", ["1rem 2rem 3rem 4rem", CSS.px(1)], false],
  ["width", [CSS.number(1)], false], ["border", [accent, accent], false], ["color", [CSS.percent(1)], false],
] as const;

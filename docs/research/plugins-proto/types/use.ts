/* oxlint-disable */
import { CSS } from "../../../../packages/css-grammar/src/values.ts";
import { context, method, property, style } from "./plugin.ts";

// a plugin author's build-time module
const len = "<length [0,∞]>" as const;
export const frame = context("frame", {
  radius: method({ grammar: len, emit: (v) => [["--_r", v]] }),
  padding: method({ grammar: len, emit: (v) => [["--_p", v]] }),
  border: method({ grammar: len, emit: (v) => [["--_b", v]] }),
  margin: method({ grammar: len, emit: (v) => [["--_m", v]] }),
});
export const surface = context("surface", {
  color: method({ grammar: "<color>", emit: (v) => [["--_k", v]] }),
  lighten: method({ grammar: "<number [0,1]>", emit: (v) => [["--_d", v]] }),
});
export const webkitFontSmoothing = property(
  "-webkit-font-smoothing",
  "auto | none | antialiased | subpixel-antialiased",
);
export const icon = style("icon", "<string>", () => ({ __cssints: [], markers: [], kernels: [] }));

// app code
frame().radius("8px").padding(CSS.rem(1)).border("1px").margin("0");
frame().radius(CSS.px(4));
surface().color("#2b3a67").lighten("0.06");
webkitFontSmoothing("antialiased");
icon('"mdi:home"');

// @ts-expect-error a percentage is not a <length>
frame().radius("10%");
// @ts-expect-error a method is used once
frame().radius("1px").radius("2px");
// @ts-expect-error not an option of the grammar
webkitFontSmoothing("smooth");
// @ts-expect-error not a number
surface().lighten("x");
// ranges are not checked by the types (css.ts), the twin rejects surface().lighten("2") at build time
// @ts-expect-error not a context method
frame().gap("1px");

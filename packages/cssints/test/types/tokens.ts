// What user code sees of tokens: `tsgo -p tsconfig.json` checks this file (`bun run typecheck`).
import { border, color, padding } from "@cssints/css-grammar/api-typed";
import * as css from "cssints" with { type: "cssints" };
import { token } from "cssints" with { type: "cssints" };

const blue = css.token.color("blue", "color-primary");
const gap = token.length("16px", { var: "gap", inherit: false });
const muted = css.token.color("#6b7280");
const steps = token.number("3", "steps");
const span = token.lengthPercentage("50%", "span");
const turn = token.angle("0.25turn", "turn");
const list = token.transformList("translateX(1px) rotate(1deg)", "moves");
const ident = token.customIdent("slide");
export const all = [blue, gap, muted, steps, span, turn, list, ident];

// A token is a Typed OM value: a typed part of its type, or the one part of a single-part property.
border("1px solid", blue);
color(blue);
color(muted);
padding(gap, gap);
// @ts-expect-error a length is not a colour
color(gap);
// @ts-expect-error a colour is not a length
padding(blue);
// @ts-expect-error a border has one colour
border(blue, blue);

// The initial value is checked against the type's grammar.
// @ts-expect-error not a colour
css.token.color("blu");
// @ts-expect-error a length needs its unit
token.length("12", "gap");
// @ts-expect-error not a percentage
token.percentage("50px");
// @ts-expect-error a name is a string or { var, inherit }
token.color("blue", 3);
// @ts-expect-error inherit is a boolean
token.color("blue", { var: "x", inherit: "no" });

// token.set() takes a token with a name and a value of its type; style() takes styles and set() results.
export const themed: Record<string, string> = css.style(
  css.color(blue),
  css.token.set(blue, "red"),
  token.set(gap, "2rem"),
  token.set(steps, "4"),
);
// @ts-expect-error a private token cannot be set
css.token.set(muted, "red");
// @ts-expect-error not a colour
css.token.set(blue, "1rem");
// @ts-expect-error not a length
token.set(gap, "red");
// @ts-expect-error style takes styles, not numbers
css.style(1);

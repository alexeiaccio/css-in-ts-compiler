// The value functions of cssints itself, `css.colorMix` and `css.min`, `css.max`, `css.clamp`: a part of a property whose
// arguments can be tokens, which a template string cannot be in the types. Build time only: the call is replaced by its text.
import { CSSColorValue, CSSStyleValue } from "@cssints/css-grammar/values";

import { fn } from "./author.ts";
import { COLOR_MIX } from "./grammars.ts";

// ponytail: stands in for the spec's CSSMathMin, CSSMathMax and clamp, holds the text of a math function.
class CSSMathValue<T extends string> extends CSSStyleValue<T> {
  readonly value: string;
  constructor(value: string) {
    super();
    this.value = value;
  }
  override toString() {
    return this.value;
  }
}

/** `color-mix(in <space>, a, b)` as a `<color>`; the grammar checks the parts, tokens included. */
export const colorMix = fn(
  COLOR_MIX,
  ([space, a, b, ...more]) => {
    if (b === undefined || more.length)
      throw new Error("cssints: colorMix() takes a colour space and two colours");
    return new CSSColorValue(`color-mix(in ${space}, ${a}, ${b})`);
  },
  "colorMix",
);

// The arguments are text (a token is its `var(--name)`); the declaration that takes the result checks the whole value.
const math =
  (name: string) =>
  (...values: unknown[]) =>
    new CSSMathValue(`${name}(${values.map(String).join(", ")})`);
export const min = math("min");
export const max = math("max");
export const clamp = math("clamp");

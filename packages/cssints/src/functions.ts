// The value functions of cssints itself, `css.colorMix` and `css.min`, `css.max`, `css.clamp`: a part of a property whose
// arguments can be tokens, which a template string cannot be in the types. Build time only: the call is replaced by its text.
import { CSSColorValue, CSSStyleValue } from "@cssints/css-grammar/values";

import { COLOR_MIX } from "./grammars.ts";
import { scope } from "./scope-engine.ts";

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

// A value member of a scope of its own, like a plugin's: the engine is the library, so it is not the typed `scope()` of
// "cssints/plugin" (that one finds the engine once macro.ts has registered it, after this module loads).
const own = scope("cssints-fn", {
  colorMix: {
    args: COLOR_MIX,
    value: ([space, a, b, ...more]: string[]) => {
      if (b === undefined || more.length)
        throw new Error("cssints: colorMix() takes a colour space and two colours");
      return new CSSColorValue(`color-mix(in ${space}, ${a}, ${b})`);
    },
  },
}) as { export(): { colorMix: unknown } };

/** `color-mix(in <space>, a, b)` as a `<color>`; the grammar checks the parts, tokens included. */
export const { colorMix } = own.export();

// The arguments are text (a token is its `var(--name)`); the declaration that takes the result checks the whole value.
const math =
  (name: string) =>
  (...values: unknown[]) =>
    new CSSMathValue(`${name}(${values.map(String).join(", ")})`);
export const min = math("min");
export const max = math("max");
export const clamp = math("clamp");

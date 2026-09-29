// CSS Typed OM shaped values (https://drafts.css-houdini.org/css-typed-om/), only what the spike needs.
// `T` is a phantom: the CSS value type name the recognizer sees as a `⟨T⟩` sentinel (api-typed.ts).
export class CSSStyleValue<T extends string = string> {
  declare readonly "~type": T;
}

export class CSSUnitValue<T extends string = string> extends CSSStyleValue<T> {
  readonly value: number;
  readonly unit: string;
  constructor(value: number, unit: string) {
    super();
    this.value = value;
    this.unit = unit;
  }
  override toString() {
    return `${this.value}${this.unit === "percent" ? "%" : this.unit === "number" ? "" : this.unit}`;
  }
}

// ponytail: stands in for the spec's CSSColorValue subclasses (CSSRGB, CSSOKLCH...), holds any <color> text.
export class CSSColorValue extends CSSStyleValue<"color"> {
  readonly value: string;
  constructor(value: string) {
    super();
    this.value = value;
  }
  override toString() {
    return this.value;
  }
}

const unit = <T extends string>(u: string) => (v: number) => new CSSUnitValue<T>(v, u);
export const CSS = {
  px: unit<"length">("px"),
  rem: unit<"length">("rem"),
  em: unit<"length">("em"),
  percent: unit<"percentage">("percent"),
  number: unit<"number">("number"),
};

//#region src/values.d.ts
export declare class CSSStyleValue<T extends string = string> {
  readonly "~type": T;
}
export declare class CSSUnitValue<T extends string = string> extends CSSStyleValue<T> {
  readonly value: number;
  readonly unit: string;
  constructor(value: number, unit: string);
  toString(): string;
}
export declare class CSSColorValue extends CSSStyleValue<"color"> {
  readonly value: string;
  constructor(value: string);
  toString(): string;
}
export declare class CSSImageValue extends CSSStyleValue<"image"> {
  readonly value: string;
  constructor(value: string);
  toString(): string;
}
export declare const CSS: {
  px: (v: number) => CSSUnitValue<"length">;
  rem: (v: number) => CSSUnitValue<"length">;
  em: (v: number) => CSSUnitValue<"length">;
  percent: (v: number) => CSSUnitValue<"percentage">;
  number: (v: number) => CSSUnitValue<"number">;
};
//#endregion
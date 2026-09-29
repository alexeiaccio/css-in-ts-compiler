// Variadic property functions: string parts and Typed OM values, joined by a space.
// A value is seen by the recognizer as one sentinel token `⟨type⟩` (css.ts PrimitiveMap and the named-syntax branch).
import type { Valid } from "./css";
import type { properties } from "./mdn";
import type { CSSStyleValue } from "./values";

type Part = string | CSSStyleValue;
type Text<P> = P extends string ? P : P extends CSSStyleValue<infer T> ? `⟨${T}⟩` : never;
export type Join<A extends readonly Part[]> = A extends readonly [
  infer H,
  ...infer R extends readonly Part[],
]
  ? R extends readonly []
    ? Text<H>
    : `${Text<H>} ${Join<R>}`
  : "";
// On failure every part's parameter type becomes the Valid message, so the error lands on the first argument.
type Check<P extends keyof typeof properties, A extends readonly Part[]> =
  Valid<P, Join<A>> extends infer V ? (V extends Join<A> ? A : { [K in keyof A]: V }) : never;
export type TypedPropertyFn<P extends keyof typeof properties> = <const A extends readonly Part[]>(
  ...parts: Check<P, A>
) => string;

export declare const padding: TypedPropertyFn<"padding">;
export declare const margin: TypedPropertyFn<"margin">;
export declare const width: TypedPropertyFn<"width">;
export declare const gap: TypedPropertyFn<"gap">;
export declare const border: TypedPropertyFn<"border">;
export declare const color: TypedPropertyFn<"color">;
export declare const opacity: TypedPropertyFn<"opacity">;
export declare const fontSize: TypedPropertyFn<"font-size">;

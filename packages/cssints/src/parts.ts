// The parts of a call (`padding("1rem", "2px")`) and how they are checked against a grammar, for a property (types.ts)
// and for what a plugin defines (plugin-types.ts). Types only.
import type { FurthestIn, Hint, ValidIn } from "@cssints/css-grammar/css";
import type { properties } from "@cssints/css-grammar/mdn";
import type { CSSStyleValue } from "@cssints/css-grammar/values";

/** A value part: a string, a Typed OM value, or a lone number (the spacing scale in spacing properties). */
export type Part = string | number | CSSStyleValue;
/** What every member returns: a class string. It is a string (`className`, `cx`), but only members make one. */
export type Style = string & { readonly __cssints: "style" };

// A part is text for the recognizer; a Typed OM value is the sentinel `⟨type⟩` (css.ts). A lone number is a spacing
// step (`⟨length⟩`) in the properties lib.ts scales, and a CSS <number> everywhere else. A style is no value.
type Text<P> = P extends Style
  ? "⟨style⟩"
  : P extends string
    ? P extends ""
      ? "⟨empty⟩"
      : P
    : P extends number
      ? `${P}`
      : P extends CSSStyleValue<infer T>
        ? `⟨${T}⟩`
        : never;
type Join<A extends readonly Part[]> = A extends readonly [
  infer H,
  ...infer R extends readonly Part[],
]
  ? R extends readonly []
    ? Text<H>
    : `${Text<H>} ${Join<R>}`
  : "";
type Spacing = "padding" | "margin" | "inset" | "gap" | "row-gap" | "column-gap";
// `Sp` says whether a lone number is the spacing scale: true, or the name of a property (decided only when a call
// has one number, so that declaring a property costs nothing).
type Value<Sp extends boolean | string, A extends readonly Part[]> = A extends readonly [number]
  ? Sp extends true | Spacing | `${Spacing}-${string}`
    ? "⟨length⟩"
    : Join<A>
  : Join<A>;
// On failure the bad part's parameter type becomes the Valid message, so the error lands on that argument: the
// first part whose end is at or past the furthest point the grammar reached (`Furthest`, the start of the bad token).
type Bad<
  A extends readonly Part[],
  Pre extends string,
  Seen extends string = "",
  I extends 0[] = [],
> = A extends readonly [infer H, ...infer R extends readonly Part[]]
  ? (Seen extends "" ? Text<H> : `${Seen} ${Text<H>}`) extends infer J extends string
    ? J extends `${Pre}${string}`
      ? `${I["length"]}`
      : Bad<R, Pre, J, [...I, 0]>
    : never
  : "0";
/**
 * The parameters of a call with parts `A`, checked against grammar `G` (called `Label` in the message; `Sp`: a lone
 * number is the spacing scale). `A` itself when valid, else the message on the bad argument.
 */
export type CheckIn<
  Label extends string,
  G extends string,
  Sp extends boolean | string,
  A extends readonly Part[],
> =
  ValidIn<Label, G, Value<Sp, A>> extends infer V
    ? V extends Value<Sp, A>
      ? A
      : A extends readonly []
        ? [value: V]
        : Locate<Label, G, A, V, Value<Sp, A>>
    : never;
type Locate<
  Label extends string,
  G extends string,
  A extends readonly Part[],
  V,
  S extends string,
> =
  FurthestIn<G, S> extends infer F extends string
    ? S extends `${infer Pre}${F}`
      ? {
          [K in keyof A]: K extends Bad<A, Pre>
            ? V | Hint<Label, A[K] extends string ? A[K] : never>
            : A[K];
        }
      : { [K in keyof A]: V }
    : never;
export type Check<P extends keyof typeof properties, A extends readonly Part[]> = CheckIn<
  P,
  (typeof properties)[P],
  P,
  A
>;

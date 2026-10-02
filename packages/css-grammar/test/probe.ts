import type { cases } from "./cases";
import type { MatchesValue, Valid } from "../src/css";
import type { properties } from "../src/mdn";
type P = typeof properties;
type Check<C> = {
  [K in keyof C]: C[K] extends readonly [infer N extends keyof P, infer S extends string, infer E]
    ? MatchesValue<P[N], S> extends E
      ? true
      : [N, S]
    : never;
};
type Failed = Exclude<Check<typeof cases>[number], true>;
// On a mismatch the error names the [property, value] pairs that disagree with the table.
export const probe: [Failed] extends [never] ? true : Failed = true;

// A CSS-wide keyword is a value of every property: Valid gives the value back; another case does not pass.
export const wide: [Valid<"color", "inherit">, Valid<"font-family", "revert-layer">] = [
  "inherit",
  "revert-layer",
];
// @ts-expect-error the keyword in another case is not a value
export const wideCase: Valid<"color", "INHERIT"> = "INHERIT";

import type { cases } from "./cases";
import type { Matches } from "./css";
import type { properties } from "./mdn";
type P = typeof properties;
type Check<C> = { [K in keyof C]: C[K] extends readonly [infer N extends keyof P, infer S extends string, infer E] ? (Matches<P[N], S> extends E ? true : [N, S]) : never };
type Failed = Exclude<Check<typeof cases>[number], true>;
// On a mismatch the error names the [property, value] pairs that disagree with the table.
export const probe: [Failed] extends [never] ? true : Failed = true;

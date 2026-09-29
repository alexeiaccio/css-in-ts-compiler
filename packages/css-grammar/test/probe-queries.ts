import type { queryCases } from "./cases-queries";
import type { ValidQuery } from "../src/query";
type Check<C> = {
  [K in keyof C]: C[K] extends readonly [
    infer N extends "media" | "container" | "supports",
    infer S extends string,
    infer E,
  ]
    ? (ValidQuery<N, S> extends S ? true : false) extends E
      ? true
      : [N, S]
    : never;
};
type Failed = Exclude<Check<typeof queryCases>[number], true>;
// On a mismatch the error names the [kind, query] pairs that disagree with the table.
export const probe: [Failed] extends [never] ? true : Failed = true;

import { border, padding } from "../src/api-typed";
import type { Join } from "../src/api-typed";
import type { typedCases } from "./cases-typed";
import type { Matches } from "../src/css";
import type { properties } from "../src/mdn";
import { CSS, CSSColorValue } from "../src/values";
type P = typeof properties;
type Check<C> = { [K in keyof C]: C[K] extends readonly [infer N extends keyof P, infer A extends readonly any[], infer E] ? (Matches<P[N], Join<A>> extends E ? true : [N, Join<A>]) : never };
type Failed = Exclude<Check<typeof typedCases>[number], true>;
export const probeTyped: [Failed] extends [never] ? true : Failed = true;

// the call sites: inference through the variadic parameter, and the error lands on a part
const accent = new CSSColorValue("#3b82f6");
border("1px solid", accent);
padding("1rem 2rem");
padding(CSS.rem(1), CSS.rem(2));
// @ts-expect-error a length where the color goes
border("1px solid", CSS.px(2));
// @ts-expect-error a color in padding
padding(accent);

// node check.ts — runtime twin against the same table as probe.ts, plus what only the runtime catches.
import { deepStrictEqual, match, throws } from "node:assert/strict";

import { cases, runtimeOnly } from "./cases.ts";
import { properties } from "../src/mdn.ts";
import { matches, valid } from "../src/twin.ts";

const p: Record<string, string> = properties;
deepStrictEqual(cases.filter(([n, s, e]) => matches(p[n]!, s) !== e), []);
deepStrictEqual(runtimeOnly.filter(([n, s]) => matches(p[n]!, s)), []);

const err = (n: string, s: string) => {
  try {
    valid(n, s);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error(`${n}: "${s}" passed`);
};
match(err("border", "1px solud"), /unexpected "solud" .* expected <line-style> \| <color> \| end of value$/);
match(err("padding", "1rem 2rem 3rem 4rem 5rem"), /unexpected "5rem" .* expected end of value$/);
match(err("padding", "-1rem"), /expected .*<length-percentage \[0,∞\]>/);
match(err("border-radius", "1rem /"), /unexpected end/);
throws(() => valid("nope", "1px"), /no grammar/);
for (const [n, s] of [["border", "1px solud"], ["padding", "1rem 2rem 3rem 4rem 5rem"], ["padding", "-1rem"], ["display", "flex flex"], ["width", "fit"], ["border-radius", "1rem /"]] as const)
  console.log(err(n, s));
console.log(`ok: ${cases.length} shared cases, ${runtimeOnly.length} runtime-only`);

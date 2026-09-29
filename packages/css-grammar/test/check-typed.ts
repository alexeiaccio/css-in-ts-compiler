// node check-typed.ts — runtime twin of probe-typed.ts: parts joined with toString(), then the same `matches`.
import { deepStrictEqual, match } from "node:assert/strict";

import { typedCases } from "./cases-typed.ts";
import { properties } from "../src/mdn.ts";
import { matches, valid } from "./sync.ts";
import { CSS } from "../src/values.ts";

const p: Record<string, string> = properties;
deepStrictEqual(typedCases.filter(([n, parts, e]) => matches(p[n]!, parts.join(" ")) !== e).map(([n, parts]) => [n, parts.join(" ")]), []);
try {
  valid("border", ["1px solid", CSS.px(2)].join(" "));
  throw new Error("passed");
} catch (e) {
  match((e as Error).message, /unexpected "2px"/);
  console.log((e as Error).message);
}
console.log(`ok: ${typedCases.length} typed cases`);

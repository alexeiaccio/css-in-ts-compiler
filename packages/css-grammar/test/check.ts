// node check.ts — runtime twin against the same table as probe.ts, plus what only the runtime catches.
import { deepStrictEqual, doesNotMatch, match, throws } from "node:assert/strict";

import { cases, runtimeOnly } from "./cases.ts";
import { checkDeclarationNow, checkValueNow } from "../src/check.ts";
import { properties } from "../src/mdn.ts";
import { matches, valid } from "./sync.ts";

const p: Record<string, string> = properties;
deepStrictEqual(
  cases.filter(([n, s, e]) => matches(p[n]!, s) !== e),
  [],
);
deepStrictEqual(
  runtimeOnly.filter(([n, s]) => matches(p[n]!, s)),
  [],
);

const err = (n: string, s: string) => {
  try {
    valid(n, s);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error(`${n}: "${s}" passed`);
};
match(
  err("border", "1px solud"),
  /unexpected "solud" .* expected <line-style> \| <color> \| end of value$/,
);
match(err("padding", "1rem 2rem 3rem 4rem 5rem"), /unexpected "5rem" .* expected end of value$/);
match(err("padding", "-1rem"), /expected .*<length-percentage \[0,∞\]>/);
match(err("border-radius", "1rem /"), /unexpected end/);
// keywords and function names are canonical case only; the message says the spelling
match(err("color", "RED"), /^color: unexpected "RED" in "RED" \("RED" is red in CSS; write "red"\), expected/);
match(err("color", "accentcolor"), /write "AccentColor"\)/);
match(err("border", "1px SOLID red"), /\("SOLID" is solid in CSS; write "solid"\)/);
match(err("color", "RGB(1 2 3)"), /\("RGB\(\)" is rgb\(\) in CSS; write "rgb\(\)"\)/);
doesNotMatch(err("border", "1px solud"), /in CSS/);
doesNotMatch(err("padding", "AUTO"), /in CSS/);

throws(() => valid("nope", "1px"), /no grammar/);
// a plugin's grammar: the label is what the message calls it; a custom property has any value
throws(
  () => checkValueNow("frame.radius", "<length [0,∞]>", "red"),
  /frame\.radius: unexpected "red" in "red", expected <length>$/,
);
checkValueNow("frame.radius", "<length [0,∞]>", "4px");
deepStrictEqual(checkDeclarationNow("--_r", "anything at all", true), []);
for (const [n, s] of [
  ["border", "1px solud"],
  ["padding", "1rem 2rem 3rem 4rem 5rem"],
  ["padding", "-1rem"],
  ["display", "flex flex"],
  ["width", "fit"],
  ["border-radius", "1rem /"],
] as const)
  console.log(err(n, s));
console.log(`ok: ${cases.length} shared cases, ${runtimeOnly.length} runtime-only`);

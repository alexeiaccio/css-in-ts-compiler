// node check-queries.ts — runtime twin of probe-queries.ts, plus the messages.
import { deepStrictEqual, match } from "node:assert/strict";

import { queryCases } from "./cases-queries.ts";
import { checkQuery } from "./sync.ts";

const ok = (k: "media" | "container" | "supports", q: string) => {
  try {
    checkQuery(k, q);
    return true;
  } catch (e) {
    return (e as Error).message;
  }
};
deepStrictEqual(
  queryCases.filter(([k, q, e]) => (ok(k, q) === true) !== e).map(([k, q]) => [k, q]),
  [],
);
const err = (k: "media" | "container" | "supports", q: string) => String(ok(k, q));
match(
  err("media", "screen and min-width > 40rem"),
  /^@media: unexpected "min-width" in "screen and min-width > 40rem"/,
);
match(err("supports", "(display: grdi)"), /^@supports: unexpected "grdi" in "\(display: grdi\)"/);
match(err("container", "sidebar (width < 30rem"), /^@container: unexpected end/);
console.log(`ok: ${queryCases.length} query cases`);
console.log(err("media", "screen and min-width > 40rem"));

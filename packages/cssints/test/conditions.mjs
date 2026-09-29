// Conditions: the wrappers and their names, layers by condition count, the cap and bad-query errors located at their
// call, and the order of the rules in the sheet. Run: node conditions.mjs
import assert from "node:assert/strict";

import { createServer } from "vite";

import { hashClass, minWidth, PROPS, PSEUDOS } from "../src/lib.ts";
import cssints from "../src/plugin.ts";

// Names: pseudo-class wrappers are the simple standard pseudo-classes, and clash with no property.
assert.deepEqual(
  Object.keys(PSEUDOS).filter((n) => n in PROPS),
  [],
);
assert.ok(["hover", "focusVisible", "firstChild", "disabled"].every((n) => n in PSEUDOS));
assert.ok(!["default", "before", "nthChild", "host"].some((n) => n in PSEUDOS));
assert.ok(PSEUDOS.hover.rank < PSEUDOS.focus.rank && PSEUDOS.focus.rank < PSEUDOS.active.rank);

// min-width in px, narrow first; what cannot be read stays 0 (the order of its text).
const widths = [
  ["(width >= 40rem)", 640],
  ["(min-width: 640px)", 640],
  ["(width > 30em)", 480],
  ["screen and (min-width: 40rem) and (min-width: 50rem)", 800],
  ["(width >= 40rem), print", 0],
  ["not (width >= 40rem)", 0],
  ["(prefers-color-scheme: dark)", 0],
  ["sidebar (width < 30rem)", 0],
];
for (const [q, w] of widths) assert.equal(minWidth(q), w, q);

// The class hash includes the chain.
const plain = hashClass(["padding", "1rem"]);
const under = (...texts) =>
  hashClass(["padding", "1rem", texts.map((text) => ({ text, rank: 0 }))]);
assert.notEqual(plain, under(":hover"));
assert.notEqual(under("@media (width >= 40rem)"), under("@media (width >= 60rem)"));
assert.notEqual(
  under("@media (width >= 40rem)", ":hover"),
  under(":hover", "@media (width >= 40rem)"),
);

const root = import.meta.dirname;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const sheet = (f) => plugins[0].api.sheet([`${root}/${f}`]);

// Errors are located at the call site: the one that breaks the cap, the bad query.
const failure = async (f) => {
  try {
    await client.transformRequest(`/${f}`);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};
let e = await failure("fixtures/cond-cap.ts");
assert.match(e.message, /at most 4 conditions .*has 5: @media \(width >= 40rem\) > .* > :hover/);
assert.deepEqual({ line: e.loc.line, column: e.loc.column }, { line: 6, column: 19 });
e = await failure("fixtures/cond-query.ts");
assert.match(e.message, /^@media: unexpected "min-width" in "screen and min-width > 40rem"/);
assert.deepEqual({ line: e.loc.line, column: e.loc.column }, { line: 4, column: 18 });

// Layers by condition count, and the order inside a layer: hover first, then narrow before wide.
await client.transformRequest("/fixtures/conditions.ts");
const css = sheet("fixtures/conditions.ts");
const pos = (s) => {
  const i = css.indexOf(s);
  assert.ok(i >= 0, `${s} missing in\n${css}`);
  return i;
};
assert.ok(pos("@layer _.a {") < pos("@layer _.b {") && pos("@layer _.b {") < pos("@layer _.c {"));
assert.ok(pos("padding:0.5rem") < pos("@layer _.b {"));
assert.ok(pos(":hover{background-color:#eee}") < pos("@media (width >= 40rem)"));
assert.ok(pos("@media (width >= 40rem)") < pos("@media (width >= 60rem)"));
assert.ok(pos("@layer _.c {") < pos(":hover{background-color:#ddd}"));
assert.equal(css.match(/@media \(width >= 40rem\) \{/g).length, 2); // one block per chain per layer
console.log("conditions: names, order, hash, cap and query errors ok");

await server.close();
process.exit(0);

// cn() with runtime arguments: what is known at build time merges, the rest goes to the runtime's `__cx` with the classes
// it replaces. Run: node cn-runtime.mjs
import assert from "node:assert/strict";

import { createServer } from "vite";

import { hashClass } from "../src/lib.ts";
import cssints from "../src/plugin.ts";
import { _cx } from "../src/runtime.ts";

const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null },
  plugins: cssints(),
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
const fails = async (f) =>
  client.transformRequest(`/fixtures/${f}`).then(
    () => "",
    (e) => e.message,
  );

// nothing at runtime: one string, no import
const fixed = await code("cn-static.ts");
assert.ok(!fixed.includes("__cx") && !fixed.includes("runtime.ts"), fixed);

// run the compiled functions on the real runtime
const mixed = await code("cn-runtime.ts");
assert.match(mixed, /^import \{ _cx as __cx \} from /);
const out = {};
// oxlint-disable-next-line typescript/no-implied-eval -- the compiled module is the thing under test
new Function("__cx", "out", mixed.replace(/^import .*\n/, "").replaceAll("export const ", "out."))(
  _cx,
  out,
);
const c = (prop, value, ...conds) =>
  hashClass([prop, value, conds.length ? conds.map((text) => ({ text, rank: 0 })) : undefined]);
const p2 = c("padding", "0.5rem");
const p4 = c("padding", "1rem");
const red = c("background-color", "red");
const set = (s) => s.split(" ").sort();
// a runtime shorthand replaces the static one while it is on, and only then
assert.deepEqual(set(out.a(true, { class: "x y" })), set(`${red} ${p4} x y`));
assert.deepEqual(set(out.a(false, {})), set(`${p2} ${red}`));
// a later static argument wins over an earlier runtime one
assert.deepEqual(set(out.d(true)), set(`${p2} legacy`));
// a runtime-only call joins its values
assert.equal(out.e({ class: "k" }, false), "k x");
// another condition is another class: nothing is replaced
const hover = c("padding", "0.75rem", ":hover");
assert.ok(out.c(true, false).includes(hover) === false, "hover:p-4 replaces hover:p-3");
assert.ok(out.c(false, false).includes(hover));

// a style whose own argument is a runtime value stays an error; properties that overlap are an error
assert.match(await fails("cn-runtime-arg.ts"), /must be known at build time: `n` is not defined/);
assert.match(await fails("cn-runtime-overlap.ts"), /padding-inline and padding-left overlap/);

// cn from an export group has runtime arguments too, and cx is gone from the groups as well
const grouped = await code("cn-group-runtime.ts");
assert.match(grouped, /^import \{ _cx as __cx \} from /);
assert.match(grouped, /__cx\(\[\["_\w+", "_\w+"\]\], "_\w+", on && "_\w+", props\.class\)/);
assert.match(
  await fails("cx-gone-group.ts"),
  /imports cx from "cssints\/widely-available", which is gone/,
);

// cx is gone, imported with the attribute or without
for (const f of ["cx-gone.ts", "cx-gone-attr.ts"])
  assert.match(
    await fails(f),
    /imports cx from "cssints", which is gone: cn\(\.\.\.\) takes runtime values/,
  );

await server.close();

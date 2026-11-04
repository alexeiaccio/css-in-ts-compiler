// Pseudo-elements: the wrappers that join the element itself — `::before`, `::after`, `::placeholder`, `::selection`, the
// rest of the standard set — their place in the chain (innermost, after every state), the sheet they print, and the error the
// other order is. Run: node pseudo-elements.mjs
import assert from "node:assert/strict";

import { createServer } from "vite";

import { PSEUDOS } from "../src/lib.ts";
import cssints from "../src/plugin.ts";

// Names: every standard pseudo-element without arguments is a wrapper, and only `::marker` needed the `Element` suffix
// (`marker` is a property); functional ones (`::part()`, `::highlight()`, `::view-transition-group()`) are not wrappers.
for (const name of [
  "before",
  "after",
  "placeholder",
  "selection",
  "firstLine",
  "backdrop",
  "markerElement",
])
  assert.ok(PSEUDOS[name]?.element === true, `${name} is a pseudo-element wrapper`);
assert.ok(!["nthChild", "part", "highlight", "host", "default"].some((n) => n in PSEUDOS));
assert.ok(PSEUDOS.before.rank > PSEUDOS.active.rank, "an element sorts after every pseudo-class");
assert.equal(PSEUDOS.before.text, "::before");
assert.equal(PSEUDOS.markerElement.text, "::marker");

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
const failure = async (f) => {
  try {
    await client.transformRequest(`/${f}`);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};

// The sheet: the element joins the class, and a state sits before it.
await client.transformRequest("/fixtures/pseudo-elements.ts");
const css = sheet("fixtures/pseudo-elements.ts");
const pos = (s) => {
  const i = css.indexOf(s);
  assert.ok(i >= 0, `${s} missing in\n${css}`);
  return i;
};
assert.match(css, /\._[\w-]+::before\{[^}]*content:"•"/u);
assert.match(css, /\._[\w-]+:hover::before\{[^}]*background-color:#eee/u);
assert.match(css, /\._[\w-]+\[aria-invalid="true"\]::after\{[^}]*content:"!"/u);
assert.match(css, /\._[\w-]+::placeholder\{[^}]*color:#888/u);
assert.match(css, /\._[\w-]+::selection\{[^}]*background-color:#ff0/u);
assert.match(css, /@media \(width >= 40rem\) \{\s*\._[\w-]+::before\{[^}]*display:block/u);
assert.match(css, /\._[\w-]+::marker\{[^}]*color:#999/u);
// two conditions (a state and the element) put the rule in the second layer, as every pair does
assert.ok(pos("@layer _.b {") >= 0);
assert.ok(css.indexOf(":hover::before") > css.indexOf("@layer _.b {"));

// The other order is an error at the call that added the outer condition, and it names the selector that would print.
const e = await failure("fixtures/pseudo-order.ts");
assert.match(e.message, /::before joins the element itself, so :hover has to wrap it/u);
assert.match(e.message, /\.k:hover::before/u);

console.log("pseudo-elements: names, place in the chain, the sheet and the order error ok");

await server.close();
process.exit(0);

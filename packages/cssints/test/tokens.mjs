// Tokens: names, private variables, the checks of initial values and of uses, errors located at their call.
// Run: node tokens.mjs
import assert from "node:assert/strict";

import { TOKEN_TYPES } from "@cssints/css-grammar/token";
import { matches } from "@cssints/css-grammar/twin-core";
import { createServer } from "vite";

import cssints from "../src/plugin.ts";

// Every probe is a literal of its type.
for (const [kind, { syntax, probes }] of Object.entries(TOKEN_TYPES))
  for (const p of probes) assert.ok(matches(`<${syntax}>`, p), `${kind}: ${p}`);

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
const failure = async (f) => {
  try {
    await client.transformRequest(`/${f}`);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};

// A named token is var(--name); a private one is --_<hash of file and site>, the same on every run.
const code = (await client.transformRequest("/fixtures/tokens-named.ts")).code;
assert.match(code, /export const blue = "var\(--color-primary\)";/);
assert.match(code, /export const gap = "var\(--gap\)";/);
assert.match(code, /export const muted = "var\(--_[0-9a-f]{8}\)";/);
assert.equal(code.match(/export const muted = "var\((--_[0-9a-f]{8})\)"/)[1], "--_aa6d0a79");
assert.ok(!/\bcss\.|token\./.test(code), "a module of tokens ships strings only");

// A bad initial value and a token where another type goes: errors at the call.
let e = await failure("fixtures/token-bad.ts");
assert.match(e.message, /^cssints: token.color\(\) initial value "blu" is not a <color>/);
assert.deepEqual({ line: e.loc.line, column: e.loc.column }, { line: 3, column: 20 });
e = await failure("fixtures/token-misuse.ts");
assert.match(
  e.message,
  /^color: unexpected "1px" in "1px", expected <color> \("var\(--gap-misuse\)" is checked as "1px"/,
);
assert.deepEqual({ line: e.loc.line, column: e.loc.column }, { line: 5, column: 19 });

console.log("tokens: names, private variables, initial values and uses checked");
await server.close();
process.exit(0);

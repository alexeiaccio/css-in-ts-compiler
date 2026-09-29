// Tokens: names, private variables, the checks of initial values and of uses, errors located at their call.
// Run: node tokens.mjs
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

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

// @property: at the top of the sheet, outside the layers, once per token however many modules have it.
await client.transformRequest("/fixtures/tokens-use.ts");
const ids = ["tokens-named.ts", "tokens-use.ts"].map((f) => `${root}/fixtures/${f}`);
const css = plugins[0].api.sheet(ids);
const props = css.match(/@property [^\n]*\n/g);
assert.equal(props.length, 3, css); // --color-primary, --gap and the private one
assert.equal(css.match(/@property --color-primary/g).length, 1, css);
assert.ok(css.indexOf("@property") < css.indexOf("@layer _.a {"), css);
assert.ok(
  css.indexOf('@property --gap{syntax:"<length>";inherits:false;initial-value:1rem}') > 0,
  css,
);
// a module that only uses a token of another has its @property too
assert.ok(plugins[0].api.sheet([ids[1]]).includes("@property --color-primary"));

// A clash is an error at the second declaration: another initial value, or inherits.
await client.transformRequest("/fixtures/tokens-clash-a.ts");
await client.transformRequest("/fixtures/tokens-clash-a.ts"); // the same rule again is fine
for (const f of ["b", "c"]) {
  e = await failure(`fixtures/tokens-clash-${f}.ts`);
  assert.match(
    e.message,
    /^cssints: --color-clash is already declared with another @property, in fixtures\/tokens-clash-a.ts/,
  );
  assert.equal(e.id, `${root}/fixtures/tokens-clash-${f}.ts`);
  assert.deepEqual({ line: e.loc.line, column: e.loc.column }, { line: 4, column: 17 });
}

// Dev: a changed initial value updates the sheet.
const tmp = mkdtempSync(join(root, ".tmp-tokens-"));
const file = join(tmp, "hmr.ts");
const write = (v) =>
  writeFileSync(
    file,
    `import * as css from "cssints" with { type: "cssints" };\nexport const t = css.token.color("${v}", "hmr-token");\n`,
  );
const SHEET = "\0virtual:cssints.css";
const served = async () =>
  JSON.parse((await client.transformRequest(SHEET)).code.match(/const __vite__css = (".*")/)[1]);
try {
  write("red");
  await client.transformRequest(`/${tmp.split("/").pop()}/hmr.ts`);
  assert.match(await served(), /@property --hmr-token\{[^}]*initial-value:red\}/);
  write("blue");
  server.watcher.emit("change", file);
  await sleep(300);
  await client.transformRequest(`/${tmp.split("/").pop()}/hmr.ts`);
  const after = await served();
  assert.match(after, /@property --hmr-token\{[^}]*initial-value:blue\}/);
  assert.equal(after.match(/@property --hmr-token/g).length, 1, after);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log("tokens: @property in the sheet, deduplicated, clashes located, edits reach the sheet");
await server.close();
process.exit(0);

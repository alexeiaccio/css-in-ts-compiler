// @cssints/balance through the engine: the kernel and pretty's class, the fallback CSS for targets that lack
// `text-wrap: balance` (and none for those that have it), no warning either way, the runtime module, the conflict.
// Run: node test/balance.mjs (it runs itself again for the targets, as packages/fonts' test does)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

const root = `${import.meta.dirname}/fixtures`;
const mode = process.argv[2];
const warnings = [];
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${root}/${f}`]);
const flat = (css) => css.replace(/\s+/g, " ").trim();

const use = await code("use.ts");
const out = flat(sheet("use.ts"));
const runtime = (await client.transformRequest("virtual:cssints/runtime/balance.script")).code;
const FALLBACK = "@supports not (text-wrap:balance){._balance-core{--balance-js:1}}";

// with any targets: the kernel, no warning (the runtime covers text-wrap and text-wrap.balance; pretty is raw CSS)
assert.ok(out.includes("._balance-core{text-wrap:balance}"), out);
assert.deepEqual(warnings, []);
// the runtime module imports the script (which reads the flag of the fallback CSS) only for targets that lack balance
// (the default ones have Firefox 115 ESR), and is empty for the others
if (mode === "native") assert.equal(runtime, "export {};");
else assert.match(runtime, /^import "[^"]*balance\/src\/runtime\.ts";/);

if (mode) {
  // native: every target has balance, so no fallback CSS; old: a target without it gets the flag
  assert.equal(out.includes(FALLBACK), mode === "old", out);
  await server.close();
  console.log(`balance (${mode} targets) ok`);
  process.exit(0);
}

console.log(sheet("use.ts"));
assert.match(use, /export const title = "_balance-core";/);
assert.match(use, /export const both = "_balance-core _\w+ _\w+";/);
assert.match(use, /export const lead = "_balance-prettyCore";/);
assert.ok(out.includes("._balance-prettyCore{text-wrap:pretty}"), out);
assert.ok(use.includes("virtual:cssints/runtime/balance.script"), use);

// derived conflict: balance() sets text-wrap, so text-wrap and its longhands and white-space meet it
await assert.rejects(
  code("conflict.ts"),
  /balance: kernel core sets text-wrap \(this style also sets text-wrap\)/,
);
await assert.rejects(
  code("conflict-white-space.ts"),
  /balance: kernel core sets text-wrap \(this style also sets white-space\)/,
);
// pretty()'s raw kernel: an explicit conflicts entry
await assert.rejects(
  code("conflict-pretty.ts"),
  /balance: it sets text-wrap \(this style also sets text-wrap-style\)/,
);
// a condition cannot wrap a kernel's marker: an error, not a pretty() that applies everywhere
await assert.rejects(
  code("condition.ts"),
  /cssints: :hover wraps _balance-prettyCore, the marker of kernel balance\.prettyCore, with no declaration of its own/,
);

await server.close();
for (const [m, targets] of [
  ["native", "chrome 130, safari 18, firefox 130"],
  ["old", "chrome 110, safari 17.3, firefox 120"],
])
  console.log(
    execFileSync(process.execPath, [import.meta.filename, m], {
      env: { ...process.env, BROWSERSLIST: targets },
      encoding: "utf8",
    }).trim(),
  );
console.log("balance ok");
process.exit(0);

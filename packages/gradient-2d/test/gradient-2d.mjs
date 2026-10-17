// @cssints/gradient-2d through the engine: the kernel with both branches, the member's custom properties and its data, the
// fallback (the average colour, none for a token), the runtime module (empty when no browserslist target has a key the
// runtime polyfills), and the build errors. Run: node test/gradient-2d.mjs (it runs itself again for two sets of targets).
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
const runtime = (await client.transformRequest("virtual:cssints/runtime/gradient2d.script")).code;

// the kernel: the fallback, then the native function under @supports
assert.ok(
  out.includes(
    "._gradient2d-core{background-image:var(--gradient2d-fallback);background-repeat:no-repeat;background-size:100% 100%}@supports (background-image:mesh-gradient(red,blue;green,yellow)){._gradient2d-core{background-image:var(--gradient2d-native)}}",
  ),
  out,
);
assert.deepEqual(warnings, []);

if (mode) {
  // the runtime is in the build when a target lacks the key (every tracked browser does), and empty when none is tracked
  if (mode === "untracked") assert.equal(runtime, "export {};");
  else assert.match(runtime, /^import "[^"]*gradient-2d\/src\/runtime\.ts";/);
  assert.ok(out.includes("@supports (background-image:mesh-gradient"), out);
  await server.close();
  console.log(`gradient-2d (${mode} targets) ok`);
  process.exit(0);
}

console.log(out);
assert.match(runtime, /^import "[^"]*gradient-2d\/src\/runtime\.ts";/);
assert.ok(use.includes("virtual:cssints/runtime/gradient2d.script"), use);

// the member: its class holds the native function, the average fallback and the data. A rule's body is read quote-aware,
// since the data is a CSS string with braces in it.
const bodies = new Map(
  [...out.matchAll(/\.(_[\w-]+)\{((?:"(?:[^"\\]|\\.)*"|[^"}])*)\}/g)].map((m) => [m[1], m[2]]),
);
const decl = (prop, list) => {
  for (const c of list) {
    const m = new RegExp(`${prop}:("(?:[^"\\\\]|\\\\.)*"|[^}]*)`).exec(bodies.get(c) ?? "");
    if (m) return m[1];
  }
  return undefined;
};
const hero = /export const hero = "(_gradient2d-core [^"]+)";/.exec(use)?.[1];
assert.ok(hero, use);
const classes = hero.split(" ");
assert.equal(decl("--gradient2d-native", classes), "mesh-gradient(red, blue; green, yellow)");
assert.match(
  decl("--gradient2d-fallback", classes),
  /^linear-gradient\(#[0-9a-f]{6}, #[0-9a-f]{6}\)$/,
);
// the data reads back as the points: a JSON string inside a CSS string, the runtime's two parses
const data = JSON.parse(JSON.parse(decl("--gradient2d-data", classes)));
assert.deepEqual(data, {
  space: "oklab",
  rows: [
    [
      [1, 0, 0, 1],
      [0, 0, 1, 1],
    ],
    [
      [0, 0.502, 0, 1],
      [1, 1, 0, 1],
    ],
  ],
});

// a token colour: the browser resolves it, so the first paint has no average
const token = /export const token = "(_gradient2d-core [^"]+)";/.exec(use)?.[1].split(" ");
assert.ok(token, use);
assert.equal(decl("--gradient2d-fallback", token), "none");
assert.ok(decl("--gradient2d-data", token)?.includes("var(--accent)"));

// the build errors, at the call, with the reason
const errors = [
  ["ragged.ts", /the rows have 2, 1 stops: every row needs the same number/],
  ["one-row.ts", /at least 2 rows of 2 stops, not 1 of 2/],
  ["bad-colour.ts", /"banana" is not a colour/],
  ["by.ts", /by and with are not supported yet/],
  ["with.ts", /by and with are not supported yet/],
  ["position.ts", /its position, by and with are not supported yet/],
  ["space.ts", /in oklch is not supported yet \(oklab and srgb\)/],
];
for (const [f, re] of errors) await assert.rejects(code(f), re, f);

await server.close();
for (const [m, targets] of [
  ["old", "chrome 110, safari 17.3, firefox 120"],
  ["current", "chrome 155, safari 26, firefox 151"],
  ["untracked", "op_mini all"],
])
  console.log(
    execFileSync(process.execPath, [import.meta.filename, m], {
      env: { ...process.env, BROWSERSLIST: targets },
      encoding: "utf8",
    }).trim(),
  );
console.log("gradient-2d ok");
process.exit(0);

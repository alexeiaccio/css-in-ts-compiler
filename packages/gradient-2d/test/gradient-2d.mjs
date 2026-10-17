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
const ffUse = await code("ff-use.ts");
const ffOut = flat(sheet("ff-use.ts"));
const runtime = (await client.transformRequest("virtual:cssints/runtime/gradient2d.script")).code;
const ffRuntime = (await client.transformRequest("virtual:cssints/runtime/gradient2d.ffScript"))
  .code;

// the kernel: the fallback, then the native function under @supports
assert.ok(
  out.includes(
    "._gradient2d-core{background-image:var(--gradient2d-fallback);background-repeat:no-repeat;background-size:100% 100%}@supports (background-image:mesh-gradient(red,blue;green,yellow)){._gradient2d-core{background-image:var(--gradient2d-native)}}",
  ),
  out,
);
// freeform's own kernel, marker and properties: a browser with mesh-gradient() and no freeform-gradient() must not take
// the mesh branch, and its first paint is a stack of radial gradients
assert.ok(
  ffOut.includes(
    "._gradient2d-ff{background-image:var(--gradient2d-ff-fallback);background-repeat:no-repeat;background-size:100% 100%}@supports (background-image:freeform-gradient(red top left, blue bottom right)){._gradient2d-ff{background-image:var(--gradient2d-ff-native)}}",
  ),
  ffOut,
);
assert.deepEqual(warnings, []);

if (mode) {
  // the runtime is in the build when a target lacks the key (every tracked browser does), and empty when none is tracked
  if (mode === "untracked") assert.deepEqual([runtime, ffRuntime], ["export {};", "export {};"]);
  else {
    assert.match(runtime, /^import "[^"]*gradient-2d\/src\/runtime\.ts";/);
    assert.match(ffRuntime, /^import "[^"]*gradient-2d\/src\/runtime\.ts";/);
  }
  assert.ok(out.includes("@supports (background-image:mesh-gradient"), out);
  await server.close();
  console.log(`gradient-2d (${mode} targets) ok`);
  process.exit(0);
}

console.log(out);
assert.match(runtime, /^import "[^"]*gradient-2d\/src\/runtime\.ts";/);
assert.match(ffRuntime, /^import "[^"]*gradient-2d\/src\/runtime\.ts";/);
assert.ok(use.includes("virtual:cssints/runtime/gradient2d.script"), use);
assert.ok(ffUse.includes("virtual:cssints/runtime/gradient2d.ffScript"), ffUse);

// the member: its class holds the native function, the average fallback and the data. A rule's body is read quote-aware,
// since the data is a CSS string with braces in it.
const rules = (css) =>
  new Map(
    [...css.matchAll(/\.(_[\w-]+)\{((?:"(?:[^"\\]|\\.)*"|[^"}])*)\}/g)].map((m) => [m[1], m[2]]),
  );
const bodies = rules(out);
const decl = (prop, list, map = bodies) => {
  for (const c of list) {
    const m = new RegExp(`${prop}:("(?:[^"\\\\]|\\\\.)*"|[^}]*)`).exec(map.get(c) ?? "");
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

// a freeform member: the native text as written, the radial stack of the first paint (one layer per point), and the data
const ffBodies = rules(ffOut);
const ffHero = /export const hero = "(_gradient2d-ff [^"]+)";/.exec(ffUse)?.[1];
assert.ok(ffHero, ffUse);
const ffClasses = ffHero.split(" ");
assert.equal(
  decl("--gradient2d-ff-native", ffClasses, ffBodies),
  "freeform-gradient(red top left, gold 4 60% 40%, yellow bottom right)",
);
assert.equal(
  decl("--gradient2d-ff-fallback", ffClasses, ffBodies),
  "radial-gradient(circle at 0% 0%, #ff0000, transparent), radial-gradient(circle at 60% 40%, #ffd700, transparent), radial-gradient(circle at 100% 100%, #ffff00, transparent)",
);
assert.deepEqual(JSON.parse(JSON.parse(decl("--gradient2d-ff-data", ffClasses, ffBodies))), {
  space: "oklab",
  points: [
    [0, 0, 1, [1, 0, 0, 1]],
    [0.6, 0.4, 4, [1, 0.8431, 0, 1]],
    [1, 1, 1, [1, 1, 0, 1]],
  ],
});

// `in srgb`, a position measured from an edge, and a token in the fallback: the browser resolves it there
const srgb = /export const srgb = "(_gradient2d-ff [^"]+)";/.exec(ffUse)?.[1].split(" ");
assert.ok(srgb, ffUse);
assert.equal(
  decl("--gradient2d-ff-native", srgb, ffBodies),
  "freeform-gradient(in srgb, red 20% 30%, blue right 10%)",
);
assert.deepEqual(JSON.parse(JSON.parse(decl("--gradient2d-ff-data", srgb, ffBodies))).points, [
  [0.2, 0.3, 1, [1, 0, 0, 1]],
  [0.9, 0.5, 1, [0, 0, 1, 1]],
]);
const ffToken = /export const token = "(_gradient2d-ff [^"]+)";/.exec(ffUse)?.[1].split(" ");
assert.ok(ffToken, ffUse);
assert.equal(
  decl("--gradient2d-ff-fallback", ffToken, ffBodies),
  "radial-gradient(circle at 10% 10%, var(--accent), transparent), radial-gradient(circle at 100% 100%, #0000ff, transparent)",
);
// one element can hold both: two markers, two kernels, two fallbacks
const both = /export const both = "([^"]+)";/.exec(ffUse)?.[1].split(" ");
assert.ok(both.includes("_gradient2d-ff") && both.includes("_gradient2d-core"), ffUse);

// the build errors, at the call, with the reason
const errors = [
  ["ragged.ts", /the rows have 2, 1 stops: every row needs the same number/],
  ["one-row.ts", /at least 2 rows of 2 stops, not 1 of 2/],
  ["bad-colour.ts", /"banana" is not a colour/],
  ["by.ts", /by and with are not supported yet/],
  ["with.ts", /by and with are not supported yet/],
  ["position.ts", /its position, by and with are not supported yet/],
  ["space.ts", /in oklch is not supported yet \(oklab and srgb\)/],
  ["ff-position.ts", /a point needs a position, `<color> <number>\? <position>`/],
  [
    "ff-repeat.ts",
    /"red 30% 30%" and "blue 30% 30%" are the same position: every point needs its own/,
  ],
  ["ff-one-point.ts", /a gradient needs at least 2 points, not 1/],
  ["ff-bad-colour.ts", /"banana" is not a colour/],
  ["ff-line.ts", /a line \(a point with more than one position\) is not supported yet/],
  ["ff-shape.ts", /"shape\(30%\)": a line or a shape is not supported yet/],
  ["ff-length.ts", /"10px" is a length: a position is a percentage or a keyword/],
  ["ff-space.ts", /freeformGradient\(\): in oklch is not supported yet \(oklab and srgb\)/],
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

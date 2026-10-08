// @cssints/stuck through the engine: the kernel, the classes of sticky() (with its group marker) and stuck(), the
// fallback rules for targets without scroll-state queries (and none for targets that all have them), the runtime
// module (the observer, for targets that lack the queries), the observer's size, and the build errors.
// Run: node test/stuck.mjs (the targets are read once per process: the other target sets run as children)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import cssints from "cssints/vite";
import { build, createLogger, createServer } from "vite";

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
const failure = async (f) => {
  try {
    await code(f);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};

const transformed = await code("use.ts");
const css = flat(sheet("use.ts"));
const runtime = (await client.transformRequest("virtual:cssints/runtime/stuck.observer")).code;
const fallback = /:where\(\._g-stuck\[data-stuck~="top"\]\) \._\w+\{color:red\}/.test(css);

// the kernel, the native rules, no warning (the observer covers the queries), and the runtime module: the observer,
// unless every target has the queries
assert.ok(css.includes("._stuck-core{position:sticky;container-type:scroll-state}"), css);
assert.match(css, /@container scroll-state\(stuck: top\) \{ \._\w+\{color:red\} \}/);
assert.equal(warnings.length, 0, warnings.join("\n"));
if (mode === "native") assert.equal(runtime, "export {};");
else assert.match(runtime, /^import "[^"]*stuck\/src\/observer\.ts";/);

if (mode) {
  // native: every target has scroll-state queries, so stuck() emits no fallback rule; old: a target lacks them
  assert.equal(fallback, mode === "old", css);
  await server.close();
  console.log(`stuck (${mode} targets) ok`);
  process.exit(0);
}

// sticky(): the kernel, the group marker and one class per inset (a lone number is a spacing step)
const [, bar] = /export const bar = "([^"]+)";/.exec(transformed) ?? [];
assert.match(bar, /^_stuck-core _g-stuck _\w+$/);
const rule = (cls) => new RegExp(`\\.${cls}\\{([^}]*)\\}`).exec(css)?.[1];
assert.equal(rule(bar.split(" ")[2]), "top:0");
const [, foot] = /export const foot = "([^"]+)";/.exec(transformed) ?? [];
assert.deepEqual(foot.split(" ").slice(2).map(rule).sort(), [
  "bottom:0.5rem",
  "color:blue",
  "left:10%",
]);

// stuck(): the container rule and, for the default targets (some lack the queries), the rule the observer's attribute
// turns on; a condition inside stuck() is one more
assert.ok(fallback, css);
assert.match(transformed, /export const title = "_\w+ _\w+";/);
assert.match(css, /@container scroll-state\(stuck: bottom\) \{ \._\w+\{color:green\} \}/);
assert.match(css, /:where\(\._g-stuck\[data-stuck~="bottom"\]\) \._\w+\{color:green\}/);
assert.match(
  css,
  /@layer _\.c \{ :where\(\._g-stuck\[data-stuck~="bottom"\]\) \._\w+:hover\{color:black\} @container scroll-state\(stuck: bottom\) \{ \._\w+:hover\{color:black\} \} \}/,
);
// the client imports the runtime module and nothing of the package
assert.ok(transformed.includes("virtual:cssints/runtime/stuck.observer"), transformed);
assert.ok(!transformed.includes("@cssints/stuck"), transformed);

// the build errors
let e = await failure("conflict.ts");
assert.equal(
  e.message,
  "cssints: stuck: kernel core sets position, container-type (this style also sets position)",
);
assert.equal(e.loc?.line, 4);
e = await failure("bad-inset.ts");
assert.equal(e.message, 'sticky.top: unexpected "red" in "red", expected <length-percentage>');
assert.equal(e.loc?.line, 4);
e = await failure("twice.ts");
assert.equal(e.message, "cssints: sticky().top() is used twice");
e = await failure("bad-side.ts");
assert.equal(e.message, 'cssints: stuck: stuck() takes top, right, bottom or left, got "middle"');
await server.close();

// the observer: no imports, tiny
const src = readFileSync(`${import.meta.dirname}/../src/observer.ts`, "utf8");
assert.ok(!/^import /m.test(src), "the observer has no imports");
const out = await build({
  configFile: false,
  logLevel: "silent",
  build: {
    write: false,
    lib: { entry: `${import.meta.dirname}/../src/observer.ts`, formats: ["es"] },
    minify: true,
  },
});
const min = String([out].flat()[0].output[0].code);
assert.ok(min.length < 1500, `${min.length} bytes`);
console.log(`observer: ${min.length} bytes minified`);

for (const [m, targets] of [
  ["native", "chrome 133"],
  ["old", "chrome 133, firefox 140"],
])
  console.log(
    execFileSync(process.execPath, [import.meta.filename, m], {
      env: { ...process.env, BROWSERSLIST: targets },
      encoding: "utf8",
    }).trim(),
  );
console.log("stuck ok");
process.exit(0);

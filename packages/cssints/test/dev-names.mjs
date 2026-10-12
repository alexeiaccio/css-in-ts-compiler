// Dev with `devtools`: a readable class `cs-<owner>[-<label>]` on every cn() and cv() site (cssints-12tp). Only the written
// code has it: with devtools off, in a build and in the ssr environment the output is what it was; the cn() and cv()
// runtimes keep the token; the name is the same after an edit elsewhere. Run: node dev-names.mjs
import assert from "node:assert/strict";

import { Effect } from "effect";
import { build, createServer } from "vite";

import { instrument } from "../src/instrument.ts";
import cssints from "../src/plugin.ts";
import { _cv, _cx } from "../src/runtime.ts";

const dir = "/fixtures/dev-names/";
const oxc = { jsx: { runtime: "classic", pragma: "h" } };
const serve = (options) =>
  createServer({
    root: import.meta.dirname,
    configFile: false,
    logLevel: "warn",
    server: { middlewareMode: true, watch: null, ws: false },
    oxc,
    plugins: cssints(options),
  });
const [on, off] = [await serve({ devtools: true }), await serve({})];
const code = async (server, f, env = "client") =>
  (await server.environments[env].transformRequest(dir + f)).code;
const tokens = (text) => text.match(/cs-[\w-]+/g) ?? [];
// what the written code was without the feature: the readable class taken out
const without = (text) => text.replace(/ ?cs-[\w-]+(?=")/g, "");

// the shapes
const shapes = {
  "landing/page.ts": [
    "cs-page-logo", // module level: the file and the variable
    "cs-page-box", // an object property
    "cs-page-deep", // the nearest property
    "cs-page-row", // a helper that returns a cn() with runtime arguments
    "cs-page-button", // a cv()
    "cs-Landing-hero", // inside a PascalCase function
    "cs-Landing-pick", // a helper inside it, cn() with runtime arguments
    "cs-Landing-helper", // a nested function that returns it
    "cs-Card-body", // an arrow component
    "cs-Panel-head", // a class field
    "cs-Panel-row", // a method
    "cs-Panel-wide", // a getter
  ],
  "landing/anon.ts": ["cs-anon"], // an anonymous default export: the file
  "landing/index.ts": ["cs-landing-root"], // index: the directory
  "landing/Button.tsx": ["cs-Button", "cs-Button", "cs-Button-tone"], // class and className: no label; another attribute: its name
};
for (const [file, expected] of Object.entries(shapes)) {
  const text = await code(on, file);
  assert.deepEqual(tokens(text), expected, `${file}\n${text}`);
  // devtools off: byte-identical to the output without the readable classes; the only difference is the names
  const plain = await code(off, file);
  assert.equal(tokens(plain).length, 0, plain);
  assert.equal(without(text), plain, file);
}
const page = await code(on, "landing/page.ts");
assert.match(page, /export const logo = "_\w+ _\w+ cs-page-logo";/);
assert.match(page, /"base": "_\w+ _\w+ cs-page-button"/);
assert.match(page, /__cx\(\[\[.*\]\], "_\w+ cs-page-row", on && "_\w+", props\.class\)/);
// not a cn() or cv(): no name, the SVG property cx included
assert.match(page, /export const svg = "_\w+";/);
assert.match(page, /export const plain = "_\w+";/);

// the ssr environment (where the plugin evaluates, and the sites stay calls): untouched, with the option or without
assert.equal(await code(on, "landing/page.ts", "ssr"), await code(off, "landing/page.ts", "ssr"));
assert.equal(tokens(await code(on, "landing/page.ts", "ssr")).length, 0);

// the runtimes keep the token, and what a class drops is still dropped
const run = async (server, f) => {
  const out = {};
  // oxlint-disable-next-line typescript/no-implied-eval -- the compiled module is the thing under test
  new Function(
    "__cx",
    "__cv",
    "out",
    (await code(server, f)).replace(/^import .*\n/, "").replaceAll("export const ", "out."),
  )(_cx, _cv, out);
  return out;
};
const [a, b] = [await run(on, "runtime.ts"), await run(off, "runtime.ts")];
const set = (s) => s.split(" ").sort();
for (const args of [
  [true, {}],
  [false, {}],
  [true, { class: "x y" }],
  [false, { class: "x" }],
]) {
  assert.deepEqual(
    set(a.row(...args)),
    set(`${b.row(...args)} cs-runtime-row`),
    JSON.stringify(args),
  );
  assert.equal(a.row(...args).split("cs-runtime-row").length, 2, "once");
}
assert.ok(!set(a.row(true, {})).includes(set(b.row(false, {}))[0]), "p(4) still drops p(2)");
for (const props of [undefined, {}, { size: "lg" }, { size: "sm" }])
  assert.deepEqual(
    set(a.button(props)),
    set(`${b.button(props)} cs-runtime-button`),
    JSON.stringify(props),
  );

// a build, with devtools or without: nothing; the dev server and the build agree on the sheet
const built = async (devtools) => {
  const out = await build({
    root: import.meta.dirname,
    configFile: false,
    logLevel: "silent",
    oxc,
    build: {
      write: false,
      minify: false,
      rollupOptions: { input: `.${dir}landing/page.ts`, preserveEntrySignatures: "strict" },
    },
    plugins: cssints({ devtools }),
  });
  return [out]
    .flat()
    .flatMap((o) => o.output)
    .filter((f) => f.type === "chunk" && f.fileName.includes("page"))
    .map((f) => f.code)
    .join("\n");
};
const [plain, flagged] = [await built(false), await built(true)];
assert.match(plain, /logo/);
assert.equal(flagged, plain, "a build with devtools: true is a build without it");
assert.equal(tokens(plain).length, 0);
assert.equal(tokens(await built("build")).length, 0, "devtools: build adds none either");

await Promise.all([on.close(), off.close()]);

// stable: the name is where the call stands, not what is around it
const sites = (text, id = "/app/src/Mod.ts") =>
  Effect.runSync(
    instrument(
      `import { cn, cv, p } from "cssints" with { type: "cssints" };\n${text}`,
      id,
      true,
      true,
    ),
  )?.sites.map((s) => s.name);
const body = "export function Card() { const a = cn(p(1)); return a; }\nexport const b = cn(p(2));";
const base = sites(body);
assert.deepEqual(base, ["cs-Card-a", "cs-Mod-b"]);
assert.deepEqual(
  sites(
    `// a comment\nexport const z = cn(p(9));\nfunction other() {}\n${body}\nconst c = 1;`,
  ).filter((n) => n !== "cs-Mod-z"),
  base,
);
assert.deepEqual(
  sites(body, "/other/place/Mod.ts?v=1"),
  base,
  "the same file name, another place and a query",
);
assert.deepEqual(sites(body.replace("p(1)", "p(3)")), base, "a changed style is the same name");

// shapes it does not know: a name from what is there, or none at all; never a throw
const odd = {
  "export default [cn(p(1))];": ["cs-Mod"],
  "const { a } = { a: cn(p(1)) };": ["cs-Mod-a"],
  "const k = 'k'; const o = { [k]: cn(p(1)) };": ["cs-Mod"],
  "console.log(cn(p(1)));": ["cs-Mod"],
  "let x; x = cn(p(1)); const y = { z: 0 }; y.z = cn(p(2));": ["cs-Mod-x", "cs-Mod-z"],
  "const π = cn(p(1));": ["cs-Mod"],
  "const UI = () => cn(p(1));": ["cs-Mod-UI"],
  "const v = cond ? cn(p(1)) : (cn(p(2)) as string);": ["cs-Mod-v", "cs-Mod-v"],
  "export const Tab = memo(() => { const t = cn(p(1)); return t; });": ["cs-Tab-t"],
  "const f = (on) => cn(p(1), on && cn(p(2)));": [undefined, "cs-Mod-f"], // the inner call is in the outer one
  "const q = css_unknown(cn(p(1)));": ["cs-Mod-q"],
  [`const ${"a".repeat(80)} = cn(p(1));`]: [`cs-Mod-${"a".repeat(20)}`],
};
for (const [text, expected] of Object.entries(odd)) {
  const got = sites(text.replace("css_unknown", "wrap").replace(" as string", ""));
  assert.deepEqual(got, expected, text);
}
assert.deepEqual(sites("const a = cn(p(1));", "/a/[id].tsx"), ["cs-id-a"]);
assert.deepEqual(sites("const a = cn(p(1));", "/a/.ts"), ["cs-module-a"]);
for (const name of [...Object.values(odd).flat(), ...sites(page)].filter(Boolean))
  assert.match(name, /^cs-[\w-]{1,45}$/);

console.log("dev names: shapes, off/build/ssr identical, runtimes, stable, odd shapes ok");
process.exit(0);

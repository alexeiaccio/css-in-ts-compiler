// scope() end to end: namespacing, aliases, kernels (raw and as styles), embedded scopes and token sets, call members
// with positional arguments and themes, runtimes, conflicts, errors, and the identity of a scope by name and content.
// Run: node scope.mjs
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";

import { createLogger, createServer } from "vite";

process.env.BROWSERSLIST = "chrome 120, firefox 128";
const { default: cssints } = await import("../src/plugin.ts");

const warnings = [];
const plugins = cssints();
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const fx = `${import.meta.dirname}/fixtures`;
const sheet = (...f) => plugins[0].api.sheet(f.map((x) => `${fx}/${x}`));
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
/** @type {Set<string>} */
const tmp = new Set();
const write = (name, body) => {
  tmp.add(name);
  writeFileSync(`${fx}/${name}`, body);
  return name;
};
const head = `import { cn } from "cssints" with { type: "cssints" };\n`;

// the classes: the marker of the first kernel (`_<scope>-<entry>`), then one class per declaration
const use = await code("scope-use.ts");
assert.match(use, /export const a = "_sk-core _sk-extra _\w+ _\w+";/, use);
assert.match(use, /export const e = "_\w+";/, "a call member with arg<T>(): a declaration");
assert.ok(
  use.includes("virtual:cssints/runtime/sk.fallback"),
  "the runtime of an entry the member uses",
);
const css = sheet("scope-use.ts");
// a kernel written as styles: checked declarations, `--_x` is `--sk-x`, printed once
assert.ok(css.includes("._sk-core{outline:var(--sk-w) solid var(--sk-c);outline-offset:2px}"), css);
// a raw kernel: `&` and `&(base.mark)`, the embedded scope's kernel (`sk-base.mark`) is registered by `uses` only
assert.ok(css.includes("._sk-extra { --sk-x: 1 } ._sk-base-mark > ._sk-extra { --sk-y: 2 }"), css);
assert.ok(css.includes("@property --sk-w"), "atProperty of a raw kernel, namespaced");
assert.match(css, /\{--sk-w:thin\}/, "an alias of the table is the grammar of a method");
assert.match(css, /\{--sk-w:0\.5rem\}/, "a lone number is a spacing step");
assert.match(
  css,
  /\{--sk-c:var\(--color-accent\)\}/,
  "a token through a private alias over a token path",
);
assert.match(css, /\{-webkit-font-smoothing:none\}/);
assert.match(
  use,
  /export const d = "color-mix\(in oklab, red, black 10%\)";/,
  "a value member is inlined",
);
assert.match(css, /\{--sk-icon:home\}/);
assert.ok(
  css.includes(":root[data-cssints-poly] ._sk-core { --sk-fb: 1 }"),
  "a runtime's fallback css: & is the first kernel",
);
const runtime = (await client.transformRequest("virtual:cssints/runtime/sk.fallback")).code;
assert.ok(
  runtime.includes(`"marker":"_sk-core","read":"--sk-r","write":"--sk-w2"`),
  "the runtime's parentVars: the marker of the first kernel, namespaced custom properties",
);
// a call member returns themes and uses: the global, the layers, a kernel of the embedded scope
assert.ok(css.includes(".sk-global { --sk-g: 1 }"), "a global entry, namespaced");
assert.ok(css.includes("@layer app, viewer;"), "layers entry");
assert.ok(css.includes("._sk-base-mark { --sk-base-m: 1 }"), css);
assert.match(css, /@layer viewer \{\s*:root\{[^}]*--color-accent: ?blue/, css);
assert.match(
  css,
  /@layer app \{\s*:root\{[^}]*--color-accent: ?green/,
  "the default source of the member",
);
assert.deepEqual(warnings, [], warnings.join("\n"));

// errors name the scope and the call site
const fails = async (f, text, line, plugin = "sk") =>
  assert.rejects(code(f), (e) => {
    assert.equal(e._tag, "MemberError", String(e.message));
    assert.equal(e.pluginName, plugin);
    assert.match(e.message.split("\n")[0], text);
    if (line) assert.equal(e.loc?.line, line, `${f}: the call site`);
    return true;
  });
const kit = `import { ring, look, icon, tint, fail } from "./scope-kit" with { type: "cssints" };\nimport { brand } from "./scope-kit" with { type: "cssints" };\n`;
await fails(
  write("sc-bad-width.ts", `${head}${kit}export const a = ring().width("red");\n`),
  /^ring\.width: unexpected "red"/,
  4,
);
await fails(
  write("sc-twice.ts", `${head}${kit}export const a = ring().width(1).width(2);\n`),
  /^cssints: ring\(\)\.width\(\) is used twice$/,
  4,
);
await fails(
  write("sc-excl.ts", `${head}${kit}export const a = ring().plain().color("red");\n`),
  /^cssints: ring\(\)\.color\(\) cannot go with \.plain\(\)$/,
  4,
);
await fails(
  write("sc-none.ts", `${head}${kit}export const a = ring().height("1px");\n`),
  /^cssints: ring\(\) has no \.height\(\); it chains width, color, plain$/,
  4,
);
await fails(
  write("sc-tone.ts", `${head}${kit}export const a = ring().color("1px");\n`),
  /^ring\.color: unexpected "1px"/,
  4,
);
await fails(
  write(
    "sc-conflict.ts",
    `${head}${kit}import {} from "cssints";\nexport const a = cn(ring().width(1), css.outline("1px"));\n`
      .replace('import {} from "cssints";\n', "")
      .replace("css.outline", "outline")
      .replace("import { cn }", "import { cn, outline }"),
  ),
  /^cssints: sk: ring\(\) sets the outline: use its methods \(this style also sets outline\)$/,
  4,
);
await fails(
  write("sc-pos-color.ts", `${head}${kit}export const a = look("1px", brand, {});\n`),
  /^look\(1\): unexpected "1px"/,
  4,
);
await fails(
  write(
    "sc-pos-opt.ts",
    `${head}${kit}export const a = look("red", brand, {}, { size: "red" });\n`,
  ),
  /^look\(4\)\.size: unexpected "red"/,
  4,
);
await fails(
  write(
    "sc-pos-key.ts",
    `${head}${kit}export const a = look("red", brand, {}, { nope: "1px" });\n`,
  ),
  /^cssints: look\(4\): no argument nope$/,
  4,
);
await fails(
  write("sc-pos-tok.ts", `${head}${kit}export const a = look("red", 3, {});\n`),
  /^cssints: look\(2\) expects a token set/,
  4,
);
await fails(
  write("sc-build.ts", `${head}${kit}export const a = fail("red");\n`),
  /^cssints: sk: no luck$/,
  4,
);
// overrides are checked by the theme path, at the call site
await assert.rejects(
  code(
    write(
      "sc-pos-theme.ts",
      `${head}${kit}export const a = look("red", brand, { color: { accent: "1px" } });\n`,
    ),
  ),
  (e) => {
    assert.match(e.message.split("\n")[0], /accent/);
    assert.equal(e.loc?.line, 4);
    return true;
  },
);

// the definition: names, entries
const defs = (name, table = "{}") =>
  write(
    `sc-def-${name}.ts`,
    `import { scope } from "cssints/plugin";\nexport const s = scope(${JSON.stringify(name)}, ${table}).export();\n`,
  );
const use2 = (f) =>
  write(
    `sc-use-${f}`,
    `import { cn } from "cssints" with { type: "cssints" };\nimport { s } from "./${f}" with { type: "cssints" };\nexport const x = cn(s.a);\n`,
  );
for (const [name, text] of [
  ["cssints", /^cssints: scope "cssints" is reserved by the engine$/],
  ["derived", /^cssints: scope "derived" is reserved by the engine$/],
  ["Bad", /lowercase letters, digits and -/],
  ["a_b", /lowercase letters, digits and -/],
])
  await assert.rejects(
    code(use2(defs(name))),
    (e) => (assert.match(e.message.split("\n")[0], text), true),
  );
await assert.rejects(
  code(use2(defs("sc-prop", `{ "-webkit-line-clamp": "<integer>" }`))),
  (e) => (
    assert.match(e.message.split("\n")[0], /-webkit-line-clamp is a CSS property already/), true
  ),
);

// identity: one name, one content. The same file again is nothing; another file with other content while the first has
// a user is an error; an edit replaces the old one once its users have run again.
const dup = (css) =>
  `import { scope } from "cssints/plugin";\nexport const { m } = scope("sc-dup", { core: { css: "& { --_a: ${css} }" }, m: { uses: ["core"], chain: { w: { args: "<length>", emit: (v) => [["--_w", v]] } } } }).export();\n`;
const useDup = (kitFile, n) =>
  write(
    `sc-dup-use${n}.ts`,
    `import { m } from "./${kitFile}" with { type: "cssints" };\nexport const a = m().w("1px");\n`,
  );
write("sc-dup-a.ts", dup("1"));
write("sc-dup-b.ts", dup("2"));
await code(useDup("sc-dup-a.ts", 1));
await code(useDup("sc-dup-a.ts", 2));
await code(useDup("sc-dup-a.ts", 1));
assert.match(sheet("sc-dup-use1.ts"), /_sc-dup-core \{ --sc-dup-a: 1 \}/);
await assert.rejects(code(useDup("sc-dup-b.ts", 3)), (e) => {
  assert.equal(e._tag, "MemberError");
  assert.match(
    e.message,
    /scope "sc-dup" is defined twice with different content .* still uses the old one/,
  );
  return true;
});
// HMR: the file is edited; what imports it is forgotten by hotUpdate, and the new content replaces the old
write("sc-dup-a.ts", dup("3"));
for (const env of Object.values(server.environments)) env.moduleGraph.invalidateAll();
const file = `${fx}/sc-dup-a.ts`;
plugins[0].hotUpdate.call({ environment: client }, { file, modules: [] });
await code("sc-dup-use1.ts");
await code("sc-dup-use2.ts");
assert.match(sheet("sc-dup-use1.ts", "sc-dup-use2.ts"), /_sc-dup-core \{ --sc-dup-a: 3 \}/);
assert.doesNotMatch(sheet("sc-dup-use1.ts", "sc-dup-use2.ts"), /--sc-dup-a: 1/);

await server.close();
for (const f of tmp) rmSync(`${fx}/${f}`, { force: true });
console.log(
  "scope: names, aliases, kernels, embedding, call members, themes, runtime, conflicts, errors, identity ok",
);
process.exit(0);

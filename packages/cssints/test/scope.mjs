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
// conditions in a kernel written as styles: under its class, in the order of the sheet (fewer conditions first: @supports,
// then the ancestor's state, own state, attribute, then queries by width), a shorthand before its longhand
assert.ok(
  css.includes(
    '._sk-live{padding:2px;color:var(--sk-c)} @supports (display: grid){._sk-live{display:grid}} :where(._g:focus) ._sk-live{padding-top:2px} ._sk-live:hover{color:red} ._sk-live[aria-current="page"]{color:blue} @container (width > 20rem){._sk-live{margin:1px}} @media (width >= 40rem){._sk-live{padding:1rem}}',
  ),
  css,
);
// what is apart from the derived conflicts is fine: colour beside the outline, a border width beside the border colour
assert.match(
  use,
  /export const q = "_sk-core \w+ \w+";/,
  "an explicit conflicts entry: outline-color is allowed",
);
assert.match(use, /export const r = "_sk-core _sk-extra _sk-edge \w+ \w+";/, use);
assert.match(
  use,
  /export const d = "color-mix\(in oklab, red, black 10%\)";/,
  "a value member is inlined",
);
assert.match(
  use,
  /export const f = "color-mix\(in oklab, red, black 20%\)";/,
  "positional and options",
);
assert.match(
  use,
  /export const g = "color-mix\(in oklab, red, white 10%\)";/,
  "the options left out",
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
const kit = `import { ring, loose, alive, edged, look, icon, tint, shade, fail } from "./scope-kit" with { type: "cssints" };\nimport { brand } from "./scope-kit" with { type: "cssints" };\n`;
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
// conflicts derived from a kernel written as styles (ring: outline, outline-offset): the property, a longhand of it, a
// shorthand over it; what is apart from it is fine; a conflicts entry in `uses` replaces them
const conflict = (name, imports, body, text, plugin = "sk") =>
  fails(
    write(
      `sc-conflict-${name}.ts`,
      `${head.replace("{ cn }", `{ cn, ${imports} }`)}${kit}export const a = ${body};\n`,
    ),
    text,
    4,
    plugin,
  );
const only = (kernel, props, also) =>
  new RegExp(`^cssints: sk: kernel ${kernel} sets ${props} \\(this style also sets ${also}\\)$`);
await conflict(
  "same",
  "outline",
  `cn(ring(), outline("1px"))`,
  only("core", "outline, outline-offset", "outline"),
);
await conflict(
  "long",
  "outlineColor",
  `cn(ring(), outlineColor("red"))`,
  only("core", "outline, outline-offset", "outline-color"),
);
await conflict(
  "offset",
  "outlineOffset",
  `cn(ring(), outlineOffset("1px"))`,
  only("core", "outline, outline-offset", "outline-offset"),
);
await conflict(
  "under",
  "outline, hover",
  `cn(ring(), hover(outline("1px")))`,
  only("core", "outline, outline-offset", "outline"),
);
await conflict(
  "cond",
  "paddingLeft",
  `cn(alive(), paddingLeft("1px"))`,
  only("live", "color, padding, margin, display, padding-top", "padding-left"),
);
await conflict(
  "short",
  "border",
  `cn(edged(), border("1px solid"))`,
  only("edge", "border-color", "border"),
);
await conflict(
  "inside",
  "borderTopColor",
  `cn(edged(), borderTopColor("red"))`,
  only("edge", "border-color", "border-top-color"),
);
await conflict(
  "explicit",
  "outline",
  `cn(loose(), outline("1px"))`,
  /^cssints: sk: loose\(\) sets the outline shorthand \(this style also sets outline\)$/,
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
// a value member's tuple is checked as a call member's, under its label
await fails(
  write("sc-val-pos.ts", `${head}${kit}export const a = shade("1px");\n`),
  /^tint\.shade\(1\): unexpected "1px"/,
  4,
);
await fails(
  write("sc-val-opt.ts", `${head}${kit}export const a = shade("red", { by: "red" });\n`),
  /^tint\.shade\(2\)\.by: unexpected "red"/,
  4,
);
await fails(
  write("sc-val-key.ts", `${head}${kit}export const a = shade("red", { nope: 1 });\n`),
  /^cssints: tint\.shade\(2\): no argument nope$/,
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

// a kernel written as styles is checked like a user's styles: conditions are fine, firstThatWorks and overlap are not
const kernelFails = async (name, body, text) => {
  const f = write(
    `sc-k-${name}.ts`,
    `import { scope } from "cssints/plugin";\nexport const { m } = scope("sc-k-${name}", { core: { css: (css) => ${body} }, m: { uses: ["core"], chain: {} } }).export();\n`,
  );
  write(
    `sc-k-${name}-use.ts`,
    `import { m } from "./${f}" with { type: "cssints" };\nexport const a = m();\n`,
  );
  await assert.rejects(
    code(`sc-k-${name}-use.ts`),
    (e) => (assert.match(e.message.split("\n")[0], text), true),
  );
};
await kernelFails(
  "fb",
  `css.color(css.firstThatWorks("red", "blue"))`,
  /^cssints: sc-k-fb\.core takes declarations without firstThatWorks\(\.\.\.\), got color$/,
);
await kernelFails(
  "val",
  `css.hover(css.color("1px"))`,
  /^cssints: sc-k-val\.core: color: unexpected "1px"/,
);
await kernelFails(
  "lap",
  `[css.marginLeft("1px"), css.marginInlineStart("1px")]`,
  /^cssints: margin-left and margin-inline-start overlap without one containing the other/,
);
await kernelFails("nest", `css.nest("& > [x")(css.color("red"))`, /^cssints: nest\(\): /);
await kernelFails(
  "own",
  `css.nest(":hover")(css.color("red"))`,
  /^cssints: nest\(\) takes a selector that starts with & and a combinator/,
);
await kernelFails("var", `css.vars({ gap: "1rem" })`, /^cssints: vars\(\) takes/);

// a kernel written as styles reaches other elements (nest), sets custom properties (vars) and carries a keyframes() name;
// neither a nested rule nor a custom property is a property of the element, so derived conflicts leave them out
write(
  "sc-nest.ts",
  `import { keyframes, opacity } from "cssints" with { type: "cssints" };
import { scope } from "cssints/plugin";
const fade = keyframes({ from: opacity(0) });
export const { m } = scope("sc-nest", {
  core: {
    css: (css) => [
      css.vars({ "--_gap": "1rem", "--_kf": fade }),
      css.display("flex"),
      css.nest("& > * + *")(css.marginTop("var(--_gap)")),
      css.hover(css.nest("& > *")(css.opacity(0.5))),
      css.nest("& > *")(css.hover(css.opacity(1))),
      css.animationName(fade),
    ],
  },
  m: { uses: ["core"], chain: {} },
}).export();
`,
);
write(
  "sc-nest-use.ts",
  `import { cn, margin, opacity } from "cssints" with { type: "cssints" };\nimport { m } from "./sc-nest.ts" with { type: "cssints" };\nexport const a = cn(m(), margin(0), opacity(1));\n`,
);
assert.match(await code("sc-nest-use.ts"), /export const a = "_sc-nest-core _\w+ _\w+";/);
const nested = sheet("sc-nest-use.ts");
const kf = nested.match(/@keyframes (kf-\w+)\{from\{opacity:0\}\}/)?.[1];
assert.ok(kf, `the kernel carries the rule of its keyframes() name\n${nested}`);
assert.ok(
  nested.includes(
    `._sc-nest-core{--sc-nest-gap:1rem;--sc-nest-kf:${kf};display:flex;animation-name:${kf}} ._sc-nest-core > * + *{margin-top:var(--sc-nest-gap)} ._sc-nest-core:hover > *{opacity:0.5} ._sc-nest-core > *:hover{opacity:1}`,
  ),
  nested,
);
await fails(
  write(
    "sc-nest-conflict.ts",
    `import { cn, display } from "cssints" with { type: "cssints" };\nimport { m } from "./sc-nest.ts" with { type: "cssints" };\nexport const a = cn(m(), display("block"));\n`,
  ),
  /^cssints: sc-nest: kernel core sets display, animation-name \(this style also sets display\)$/,
  3,
  "sc-nest",
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
// `uses` names a private key without its `#`: `#trim` beside a member `trim` is one name for two keys
await assert.rejects(
  code(use2(defs("sc-clash", `{ "#trim": { css: "&{}" }, trim: { chain: {}, uses: ["trim"] } }`))),
  (e) => (
    assert.equal(
      e.message.split("\n")[0],
      "cssints: sc-clash: #trim and trim share a name: rename one",
    ),
    true
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

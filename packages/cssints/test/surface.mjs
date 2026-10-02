// cssints/surface at build time: its class strings and CSS, a token and a relative colour as the base, the errors of a bad
// value and of a chain that mixes the steps, and a style that mixes surface() with a background. The browsers are
// frame-browsers.mjs. Run: node surface.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

import { createLogger, createServer } from "vite";

process.env.BROWSERSLIST = "chrome 122, firefox 128";
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
const sheet = (f) => plugins[0].api.sheet([`${fx}/${f}`]);
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
const head = `import * as css from "cssints" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };
`;
/** @type {Set<string>} */
const tmp = new Set();
const write = (name, body) => {
  tmp.add(name);
  writeFileSync(`${fx}/${name}`, head + body);
  return name;
};

// the classes: the marker first, then one class per method; cn() prints the marker once
const use = await code("surface-use.ts");
assert.match(use, /export const a = "_s _\w+ _\w+ _\w+";/, use);
assert.match(use, /export const b = "_s _\w+";/);
assert.match(
  use,
  /export const d = "_s _\w+ _\w+";/,
  "cn(): one marker, the hover step is a class",
);
assert.ok(
  use.includes("virtual:cssints/runtime/surface"),
  "a client module that uses surface() imports its runtime",
);
const css = sheet("surface-use.ts");
for (const d of [
  "--sf-k:#2b3a67",
  "--sf-d:0.06",
  "--sf-d:calc(0.1 * -1)",
  "--sf-d:calc(0.15 * clamp(-1, (0.5636 - l) * 1e6, 1))",
  "--sf-k:oklch(from #123 l c h)",
  "color:oklch(from var(--sf-s) clamp(0, (0.5636 - l) * 1e6, 1) 0 0)",
])
  assert.ok(css.includes(`{${d}}`), `${d}\n${css}`);
assert.match(css, /:hover\{--sf-d:0\.06\}/);
assert.match(css, /@media \(width >= 40rem\) \{\s*\._\w+\{--sf-d:calc\(0\.05 \* -1\)\}/);
assert.equal(css.match(/@container/g)?.length, 2, "the kernel is printed once");
assert.ok(
  css.indexOf("@property --sf-e") < css.indexOf("@layer _.k {"),
  "the registrations are at the top",
);
assert.match(
  css,
  /@layer _\.k \{[\s\S]*\._s \{[\s\S]*@container[\s\S]*:root\[data-cssints-poly\] \._s \{/,
  "kernel, then the fallback: layer _.k",
);
assert.ok(css.indexOf("@layer _.k {") < css.indexOf("@layer _.a {"));
// Chrome 122 and Firefox 128 have @property and relative colour: the support warnings of the kernel stay quiet
assert.deepEqual(warnings, [], warnings.join("\n"));

// below them the kernel has nothing to stand on: one support warning per feature, no error
const old = spawnSync("node", ["run.mjs", "fixtures/surface-use.ts"], {
  cwd: import.meta.dirname,
  encoding: "utf8",
  env: { ...process.env, BROWSERSLIST: "firefox 127, safari 15" },
});
assert.match(
  old.stdout + old.stderr,
  /kernel surface@1 needs css\.at-rules\.property, not supported by firefox 127, safari 15/,
);
assert.match(
  old.stdout + old.stderr,
  /kernel surface@1 needs css\.types\.color\.oklch\.relative_syntax, not supported by firefox 127, safari 15/,
);

// a token (a registered custom property) is the base; the kernel sees its computed colour
write(
  "surface-token.ts",
  `export const base = css.token.color("#2b3a67", { var: "base", inherit: true });
export const a = surface().color(base).darken(0.1).ink();\n`,
);
await code("surface-token.ts");
const tok = sheet("surface-token.ts");
assert.match(tok, /\{--sf-k:var\(--base\)\}/, tok);
assert.match(tok, /@property --base/);

// errors: the plugin, the grammar, the call site
const fails = async (f, text, line) =>
  assert.rejects(code(f), (e) => {
    assert.equal(e._tag, "MemberError", String(e.message));
    assert.equal(e.pluginName, "surface");
    assert.match(e.message.split("\n")[0], text);
    assert.equal(e.loc?.line, line, `${f}: the call site`);
    return true;
  });
await fails(
  write("surface-bad-color.ts", `export const a = surface().color("wide");\n`),
  /^surface\.color: unexpected "wide" in "wide", expected <color>/,
  3,
);
await fails(
  write("surface-bad-step.ts", `export const a = surface().lighten(2);\n`),
  /^surface\.lighten: unexpected "2" in "2", expected <number \[0,1\]>/,
  3,
);
await fails(
  write("surface-bad-negative.ts", `export const a = surface().contrast(-0.1);\n`),
  /^surface\.contrast: unexpected "-0\.1"/,
  3,
);
await fails(
  write("surface-bad-length.ts", `export const a = surface().darken("1px");\n`),
  /^surface\.darken: unexpected "1px"/,
  3,
);
await fails(
  write("surface-bad-twice.ts", `export const a = surface().lighten(0.1).lighten(0.2);\n`),
  /^cssints: surface\(\)\.lighten\(\) is used twice$/,
  3,
);
await fails(
  write("surface-bad-both.ts", `export const a = surface().lighten(0.1).darken(0.1);\n`),
  /^cssints: surface\(\)\.darken\(\) cannot go with \.lighten\(\)$/,
  3,
);
await fails(
  write("surface-bad-contrast.ts", `export const a = surface().darken(0.1).ink().contrast(0.1);\n`),
  /^cssints: surface\(\)\.contrast\(\) cannot go with \.darken\(\)$/,
  3,
);
await fails(
  write("surface-bad-ink.ts", `export const a = surface().ink(1);\n`),
  /^cssints: surface\(\)\.ink\(\) takes no value$/,
  3,
);
await fails(
  write("surface-bad-method.ts", `export const a = surface().radius("1px");\n`),
  /^cssints: surface\(\) has no \.radius\(\); it chains color, lighten, darken, contrast, ink$/,
  3,
);
assert.ok(
  await code(
    write("surface-edge.ts", `export const a = surface().lighten(0), b = surface().darken(1);\n`),
  ),
  "the ends of the range are steps",
);

// surface() together with a background, in one cn(): a build error naming the property; the rest of the background is fine
const conflict = async (name, call, prop) =>
  fails(
    write(name, `export const a = css.cn(surface().lighten(0.1), ${call});\n`),
    new RegExp(
      `^cssints: surface: surface\\(\\) sets the background colour: use its methods \\(this style also sets ${prop}\\)$`,
    ),
    3,
  );
await conflict("surface-c-bg.ts", `css.bg("white")`, "background-color");
await conflict("surface-c-bgcolor.ts", `css.backgroundColor("white")`, "background-color");
await conflict("surface-c-background.ts", `css.background("red")`, "background");
await conflict("surface-c-hover.ts", `css.hover(css.bg("white"))`, "background-color");
for (const [name, call] of [
  [
    "surface-ok-image.ts",
    `css.backgroundImage("linear-gradient(red, blue)"), css.backgroundSize("cover")`,
  ],
  ["surface-ok-other.ts", `css.color("red"), css.borderColor("blue"), css.gap(2)`],
]) {
  await code(write(name, `export const a = css.cn(surface().lighten(0.1), ${call});\n`));
}
await server.close();
for (const f of tmp) rmSync(`${fx}/${f}`);
console.log("surface: classes, css, token, errors ok");
process.exit(0);

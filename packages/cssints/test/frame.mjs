// cssints/frame at build time: its class strings and CSS, a token as a value, the errors of a bad value and of a style that
// mixes frame() with what it sets, and the support warning of its kernel. The browsers are browsers.mjs.
// Run: node frame.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
const sheet = (f) => plugins[0].api.sheet([`${fx}/${f}`]);
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
const head = `import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
`;
/** @type {Set<string>} */
const tmp = new Set();
const write = (name, body) => {
  tmp.add(name);
  writeFileSync(`${fx}/${name}`, head + body);
  return name;
};

// the classes: the marker first, then one custom-property class per method; a lone number is a step of the spacing scale
const use = await code("frame-use.ts");
assert.match(use, /export const a = "_frame-core _\w+ _\w+ _\w+ _\w+";/, use);
assert.match(
  use,
  /export const b = "_frame-core _\w+ _\w+";/,
  "cn(): one marker, the padding of the media query is a class",
);
assert.ok(
  use.includes("virtual:cssints/runtime/frame.fallback"),
  "a client module that uses frame() imports its runtime",
);
const css = sheet("frame-use.ts");
for (const d of [
  "--frame-r:24px",
  "--frame-p:0.5rem",
  "--frame-b:2px",
  "--frame-m:0.25rem",
  "--frame-p:1em",
  "--frame-r:8px",
])
  assert.ok(css.includes(`{${d}}`), `${d}\n${css}`);
assert.match(
  css,
  /@media \(width >= 40rem\) \{\s*\._\w+\{--frame-p:1\.5rem\}/,
  "a condition just sets the custom property",
);
assert.match(css, /:hover\{--frame-r:2px\}/);
assert.equal(css.match(/@container/g)?.length, 2, "the kernel is printed once");
assert.ok(
  css.indexOf("@property --frame-r") < css.indexOf("@layer _.k {"),
  "the registrations are at the top",
);
assert.match(
  css,
  /@layer _\.k \{[\s\S]*\._frame-core \{[\s\S]*@container[\s\S]*:root\[data-cssints-poly\] \._frame-core \{/,
  "kernel, then the fallback: layer _.k",
);
assert.ok(
  css.indexOf("@layer _.k {") < css.indexOf("@layer _.a {"),
  "the kernel is below the site classes",
);
// the targets include Firefox 128 (@property, no style queries), so the support warnings of the kernel stay quiet
assert.deepEqual(warnings, [], warnings.join("\n"));

// below @property (Firefox 127, Safari 15) the kernel has nothing to stand on: one support warning, no error
const old = spawnSync("node", ["run.mjs", "fixtures/frame-use.ts"], {
  cwd: import.meta.dirname,
  encoding: "utf8",
  env: { ...process.env, BROWSERSLIST: "firefox 127, safari 15" },
});
assert.match(
  old.stdout + old.stderr,
  /kernel frame.core needs css\.at-rules\.property, not supported by firefox 127, safari 15/,
);

// a token (a registered custom property) is a value; the kernel sees its computed length
write(
  "frame-token.ts",
  `export const radius = css.token.length("12px", { var: "radius-lg", inherit: false });
export const a = frame().radius(radius).padding(2).border(radius);\n`,
);
await code("frame-token.ts");
const tok = sheet("frame-token.ts");
assert.match(tok, /\{--frame-r:var\(--radius-lg\)\}/, tok);
assert.match(tok, /\{--frame-b:var\(--radius-lg\)\}/);
assert.match(tok, /@property --radius-lg/);

// errors: the plugin, the grammar, the call site
const fails = async (f, text, line) =>
  assert.rejects(code(f), (e) => {
    assert.equal(e._tag, "MemberError", String(e.message));
    assert.equal(e.pluginName, "frame");
    assert.match(e.message.split("\n")[0], text);
    assert.equal(e.loc?.line, line, `${f}: the call site`);
    return true;
  });
await fails(
  write("frame-bad-radius.ts", `export const a = frame().radius("red");\n`),
  /^frame\.radius: unexpected "red" in "red", expected </,
  3,
);
await fails(
  write("frame-bad-negative.ts", `export const a = frame().padding(-1);\n`),
  /^frame\.padding: unexpected "-0\.25rem" in "-0\.25rem", expected <length \[0,∞\]>/,
  3,
);
await fails(
  write("frame-bad-percent.ts", `export const a = frame().border("5%");\n`),
  /^frame\.border: unexpected "5%"/,
  3,
);
await fails(
  write("frame-bad-twice.ts", `export const a = frame().margin(1).margin(2);\n`),
  /^cssints: frame\(\)\.margin\(\) is used twice$/,
  3,
);
await fails(
  write("frame-bad-method.ts", `export const a = frame().color("red");\n`),
  /^cssints: frame\(\) has no \.color\(\); it chains radius, padding, border, margin$/,
  3,
);
assert.ok(
  await code(write("frame-margin-negative.ts", `export const a = frame().margin("-4px");\n`)),
  "a negative margin is a length",
);

// frame() together with what it sets, in one cn(): a build error naming the property; colours and unrelated properties are fine
const conflict = async (name, call, prop) =>
  fails(
    write(name, `export const a = css.cn(frame().radius("4px"), ${call});\n`),
    new RegExp(
      `^cssints: frame: frame\\(\\) sets padding, margin, border-radius and the border: use its methods \\(this style also sets ${prop}\\)$`,
    ),
    3,
  );
await conflict("frame-c-padding.ts", `css.padding("1rem")`, "padding");
await conflict("frame-c-p.ts", `css.p(2)`, "padding");
await conflict("frame-c-padding-top.ts", `css.paddingTop("1px")`, "padding-top");
await conflict("frame-c-margin.ts", `css.margin("1rem")`, "margin");
await conflict("frame-c-margin-inline.ts", `css.marginInline("1rem")`, "margin-inline");
await conflict("frame-c-radius.ts", `css.borderRadius("4px")`, "border-radius");
await conflict("frame-c-corner.ts", `css.borderTopLeftRadius("4px")`, "border-top-left-radius");
await conflict("frame-c-border.ts", `css.border("1px solid red")`, "border");
await conflict("frame-c-width.ts", `css.borderWidth("1px")`, "border-width");
await conflict("frame-c-side.ts", `css.borderTop("1px solid")`, "border-top");
await conflict("frame-c-style.ts", `css.borderStyle("dashed")`, "border-style");
await conflict("frame-c-hover.ts", `css.hover(css.padding("1rem"))`, "padding");
for (const [name, call] of [
  ["frame-ok-color.ts", `css.borderColor("red"), css.borderTopColor("blue")`],
  ["frame-ok-other.ts", `css.color("red"), css.bg("white"), css.gap(2), css.outline("1px solid")`],
]) {
  await code(write(name, `export const a = css.cn(frame().radius("4px"), ${call});\n`));
}
await server.close();
for (const f of tmp) rmSync(`${fx}/${f}`);
console.log("frame: classes, css, token, errors, conflicts ok");
process.exit(0);

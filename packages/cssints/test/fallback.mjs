// firstThatWorks: one class with the declarations in CSS order, grammar errors, and the support warnings that its
// fallbacks silence or narrow (fixtures/fallback*.ts). Run: node fallback.mjs
import assert from "node:assert/strict";
import { stripVTControlCharacters } from "node:util";

// The targets are read when the grammar package loads: set them first, so the imports come after.
process.env.BROWSERSLIST = "chrome 100, safari 15.2, firefox 120";
const { createLogger, createServer } = await import("vite");
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
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${import.meta.dirname}/fixtures/${f}`]);

const out = await code("fallback.ts");
const cls = Object.fromEntries(
  [...out.matchAll(/export const (\w) = "([^"]+)"/g)].map((m) => [m[1], m[2]]),
);
assert.equal(cls.a, cls.g, "the same fallback is the same class");
assert.equal(cls.f.split(" ").length, 2, "cn(): one class per declaration, fallbacks included");
assert.equal(new Set(Object.values(cls)).size, Object.keys(cls).length - 1, out);

// One rule per class, the wanted value last: CSS order is the reverse of the source order.
const css = sheet("fallback.ts");
const rule = (c, text) => assert.ok(css.includes(`.${c}${text}`), `${c}${text}\n${css}`);
rule(cls.a, "{min-height:100vh;min-height:100dvh}");
rule(cls.b, "{min-height:100vh;min-height:100dvh;min-height:100svh}");
rule(cls.c, "{color:var(--brand);color:oklch(55% 0.18 250)}");
rule(cls.d, "{color:red;color:var(--x)}");
rule(cls.e, "{border:1px dashed red;border:1px solid red}");
rule(cls.f.split(" ")[1], ":hover{padding:2vh;padding:2dvh}");
rule(cls.h, "{color:#0057b8;color:oklch(55% 0.18 250)}");
assert.equal(css.match(new RegExp(`\\.${cls.a}\\{`, "g")).length, 1, "once in the sheet");
assert.ok(css.includes("@property --brand"), "the token of a fallback is in the sheet");

// Warnings: h is silenced (every target that lacks oklch() has #0057b8), i names the target that still lacks it, and
// the plain j keeps all of its targets.
const lines = warnings.map((w) =>
  stripVTControlCharacters(w.split("\n")[0]).replace(/^.*warning: /, ""),
);
assert.deepEqual(lines, [
  'color: "oklch()" in "oklch(55% 0.18 250)" is not supported by chrome 100 (css.types.color.oklch), and no fallback of its firstThatWorks covers them',
  'color: "oklch()" in "oklch(55% 0.18 250)" is not supported by chrome 100, safari 15.2 (css.types.color.oklch)',
]);

// Build errors, at the call site.
for (const [f, text] of [
  ["bad-value", /^min-height: unexpected "red" in "red", expected auto \| /],
  ["one", /^cssints: firstThatWorks\(\) takes at least two values/],
  ["two", /^cssints: padding\(\) takes one firstThatWorks\(\.\.\.\) per declaration$/],
  ["style", /^cssints: style\(\) takes one value per property/],
]) {
  await assert.rejects(code(`fallback-${f}.ts`), (e) => {
    assert.match(e.message.split("\n")[0], text);
    assert.equal(e.loc?.line, 3, `${f}: the call site`);
    return true;
  });
}

await server.close();
console.log("fallback: ok");

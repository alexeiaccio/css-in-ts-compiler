// The cascade of one class string: the sheet puts a shorthand before every longhand it contains (counts from Chrome's
// expansion, css-grammar longhands.ts), and cn() keeps the later of the same property, keeps both under different
// conditions, and refuses two properties that overlap without one containing the other. Run: node cascade.mjs
import assert from "node:assert/strict";

const { createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");
const { relation } = await import("../src/leaves.ts");

// containment, logical against physical, aliases
for (const [a, b, want] of [
  ["border", "border-inline", "contains"],
  ["border-color", "border-inline", "overlap"],
  ["margin", "margin-inline-start", "contains"],
  ["margin-left", "margin-inline", "overlap"],
  ["margin-left", "margin-right", "apart"],
  ["border-top", "border-color", "overlap"],
  ["width", "inline-size", "overlap"],
  ["word-wrap", "overflow-wrap", "same"],
  ["all", "padding", "contains"],
  ["font-variant", "font-variant-caps", "contains"],
])
  assert.equal(relation(a, b), want, `${a} / ${b}`);

const plugins = cssints();
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "silent",
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${import.meta.dirname}/fixtures/${f}`]);
const classes = (out, n) => new RegExp(`export const ${n} = "([^"]+)"`).exec(out)?.[1].split(" ");

// the shorthand's rule comes first, so the longhand wins whatever the order of the arguments
const contain = await code("cn-contain.ts");
const css = await sheet("cn-contain.ts");
for (let i = 1; i <= 10; i++) {
  const [longhand, shorthand] = classes(contain, `c${i}`);
  assert.ok(
    css.indexOf(`.${shorthand}{`) < css.indexOf(`.${longhand}{`),
    `c${i}: the shorthand comes before its longhand\n${css}`,
  );
}

const merge = await code("cn-merge.ts");
assert.equal(classes(merge, "again").length, 1, "the same property again: the later one stays");
assert.equal(classes(merge, "layered").length, 2, "under another condition both stay");
assert.equal(classes(merge, "nested").length, 2, "nested cn(): p(4) is replaced, pl(1) stays");
assert.equal(classes(merge, "contained").length, 2, "a longhand inside a shorthand stays");
assert.equal(classes(merge, "alias").length, 1, "an alias is the same property");
assert.equal(classes(merge, "hovered").length, 1, "the same under one condition");
assert.match(await sheet("cn-merge.ts"), /padding:0\.5rem/);

await assert.rejects(code("cn-overlap.ts"), (e) => {
  assert.match(e.message, /border-top and border-color overlap without one containing the other/);
  assert.equal(e.loc?.line, 4);
  return true;
});

await server.close();
console.log("cascade ok");

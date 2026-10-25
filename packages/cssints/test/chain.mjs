// chain(): one style from chained properties, with no cn(). The plugin sees the whole chain as one site (fixtures/chain.ts),
// the build merges its declarations as cn() does, and a chain works in cn(), cv() and a condition. Run: node chain.mjs
import assert from "node:assert/strict";

const { createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");

const plugins = cssints();
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${import.meta.dirname}/fixtures/${f}`]);
const cls = (out) =>
  Object.fromEntries([...out.matchAll(/export const (\w+) = "([^"]*)"/g)].map((m) => [m[1], m[2]]));
const rule = (css, name, text) =>
  assert.ok(css.includes(`.${name}${text}`), `${name}${text}\n${css}`);

// One maximal call: the replacement is the class string of every step, and nothing of the chain is left.
const bare = cls(await code("chain.ts"));
assert.equal(Object.keys(bare).length, 2, "two sites, one per chain");
for (const value of Object.values(bare))
  assert.match(value, /^_\w+( _\w+)*$/, "a chain is a class string, not a call");
const bareCss = sheet("chain.ts");
const [flex, bg] = bare.a.split(" ");
rule(bareCss, flex, "{display:flex}");
rule(bareCss, bg, "{background-color:red}");
assert.equal(bare.b.split(" ").length, 3, "p(), bg() and fontSize(): one class each");
assert.ok(!bareCss.includes("display:flex;display"), "flex() with no part sets only display");

// A chain in cn(), in a condition, in cv() and in a function; a keyframes() name carries its kernel.
const out = await code("chain-use.ts");
const c = cls(out);
assert.equal(c.base.split(" ").length, 2);
assert.equal(c.merged.split(" ").length, 3, "cn(chain(), chain()): every declaration of both");
assert.equal(c.button, undefined, "cv() keeps its config; only the classes are strings");
assert.match(out, /"base": "_\w+",/, out);
assert.match(out, /"variants": \{ "size": \{ "lg": "_\w+ _\w+" \} \}/, out);
assert.match(
  out,
  /"drops": \{ "size": \{ "lg": "_\w+" \} \}/,
  "cv() still drops what the variant replaces",
);
assert.match(out, /__cx\(\[\["_\w+", "_\w+"\]\], "_\w+", on && "_\w+", "own"\)/, out);
assert.equal(c.row, undefined, "a chain in a function is a site of its own, not a binding");
const used = sheet("chain-use.ts");
const [hover] = c.under.split(" ");
rule(used, hover, ":hover{background-color:blue}");
const [narrow] = c.narrow.split(" ");
assert.ok(used.includes(`@media (width >= 40rem) {`), used);
assert.ok(used.includes(`.${narrow}{padding:1rem}`), used);
assert.ok(used.includes("@keyframes kf-"), "the kernel of a keyframes() name is in the sheet");
rule(used, c.animated.split(" ")[0], "{animation-name:kf-");

// The build merges like cn(): the later value of a property wins, and two that overlap without containment are an error.
const dupe = cls(await code("chain-dupe.ts"));
assert.equal(dupe.a.split(" ").length, 2, "p() twice: one padding class");
assert.ok(sheet("chain-dupe.ts").includes(`.${dupe.a.split(" ")[0]}{padding:0.5rem}`));

for (const [f, text, line] of [
  [
    "chain-overlap",
    /^cssints: border-top and border-color overlap without one containing the other/,
    4,
  ],
  ["chain-unknown", /^cssints: chain\(\) has no \.hover\(\)/, 4],
]) {
  await assert.rejects(code(`${f}.ts`), (e) => {
    assert.match(e.message.split("\n")[0], text);
    assert.equal(e.loc?.line, line, `${f}: the call site`);
    return true;
  });
}

await server.close();
console.log("chain: ok");

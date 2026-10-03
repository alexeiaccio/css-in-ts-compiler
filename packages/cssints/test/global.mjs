// css.global(), attr(), within() and group(): the rules in the sheet, the order of a global rule, and the errors at the
// call. Run: node global.mjs
import assert from "node:assert/strict";

import { createServer } from "vite";

import cssints from "../src/plugin.ts";

const root = import.meta.dirname;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const sheet = async (f) => {
  await client.transformRequest(`/${f}`);
  return plugins[0].api.sheet([`${root}/${f}`]);
};
const failure = async (f) => {
  try {
    await client.transformRequest(`/${f}`);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};

// Global rules: layer _.k after the kernels, in source order, the later property wins, a media block is its own rule,
// a fallback prints the wanted value last, the token the rule reads has its @property rule.
const g = await sheet("fixtures/global.ts");
const at = (s) => {
  const i = g.indexOf(s);
  assert.ok(i >= 0, `${s} missing in\n${g}`);
  return i;
};
assert.ok(at("@property --page-bg") < at("@layer _.k {"));
assert.ok(at("*, *::before, *::after{box-sizing:border-box}") < at("html{"));
assert.ok(at("html{background-color:var(--page-bg);margin:0}") < at(":root{color-scheme:light}"));
assert.ok(at(":root{color-scheme:light}") < at("@media (prefers-color-scheme: dark){:root{color-scheme:dark}}"));
assert.ok(at("a[href^='http'] > b{min-height:100vh;min-height:100dvh}") > 0);
assert.ok(!g.includes("margin:1px"));
assert.ok(!g.includes("@layer _.a"), "a global rule has no class and no class layer");

// attr(), within() and group(): the selectors, and the order of a layer (the ancestor's state, the element's own
// pseudo-classes, then its attributes).
const s = await sheet("fixtures/state.ts");
for (const rule of [
  /:where\(\._g:hover\) \._\w+\{color:red\}/,
  /:where\(\._g-outer:focus-visible\) \._\w+\{color:green\}/,
  /\._\w+\[aria-current="page"\]\{color:blue\}/,
  /\._\w+\[disabled\]\{opacity:0\.5\}/,
  /\._\w+\[data-x="a\\"b\\\\c"\]\{opacity:0\.6\}/,
  /\._\w+\[lang\|="en"\]/,
  /\._\w+\[class~="x"\]/,
  /\._\w+\[href\^="https"\]/,
  /\._\w+\[href\$="\.pdf"\]/,
  /\._\w+\[href\*="ex"\]/,
  /:where\(\._g-card:hover\) \._\w+\{opacity:0\.3\}/,
  /@media \(width >= 40rem\) \{\s*:where\(\._g:hover\) \._\w+\{text-decoration:underline\}/,
])
  assert.match(s, rule);
const place = (re) => s.search(re);
assert.ok(
  place(/:where\(\._g:hover\) \._\w+\{color:red/) < place(/:hover\{color:black/) &&
    place(/:hover\{color:black/) < place(/\[aria-current="page"\]/),
);
assert.match(s, /@layer _\.c \{\s*@media/); // within() inside md is two conditions

const errors = {
  "global-selector": /^cssints: global\(\): selector: unexpected "\{" in "a \{", expected <complex-selector-list>/,
  "global-state": /global\(\) takes media\(\), container\(\) and supports\(\) conditions, not :hover/,
  "global-value": /color: unexpected "blu"/,
  "global-empty": /global\(\) takes css\.\* styles after the selector/,
  "global-kernel": /global\(\) takes plain declarations/,
  "attr-name": /attr\(name, value\?, op\?\) takes an attribute name/,
  "attr-op": /attr\(name, value\?, op\?\) takes an attribute name.*"!="/,
  "attr-presence-op": /attr\(name, value\?, op\?\) takes an attribute name/,
  "within-state": /within\(\) takes a pseudo-class wrapper \(hover\) or attr\(\.\.\.\)/,
  "within-name": /within\(\) takes a name such as "row", got "a b"/,
};
for (const [f, re] of Object.entries(errors)) {
  const e = await failure(`fixtures/${f}.ts`);
  assert.match(e.message, re, f);
  assert.equal(e.loc?.line, 3, `${f} is located at its call`);
}
console.log("global: rules, attr, within, group and errors ok");

await server.close();
process.exit(0);

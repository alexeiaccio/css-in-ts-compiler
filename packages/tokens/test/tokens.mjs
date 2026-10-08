// @cssints/tokens through the engine: each set as createTokens data (only the tokens a module uses reach its sheet), the
// CSS-string sets in properties, Radix's dark theme and its contrast. Run: node test/tokens.mjs
import assert from "node:assert/strict";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

const root = `${import.meta.dirname}/fixtures`;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("warn"),
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const sheet = async (f) => {
  await client.transformRequest(`/${f}`);
  return plugins[0].api.sheet([`${root}/${f}`]);
};
const properties = (css) => [...css.matchAll(/@property (--[\w-]+)/g)].map((m) => m[1]);

// open-props: of the 300 tokens made in open-props-tokens.ts, the two the module uses
let css = await sheet("open-props.ts");
assert.deepEqual(properties(css), ["--blue-7", "--size-3"], css);
assert.ok(
  css.includes('@property --size-3{syntax:"<length>";inherits:true;initial-value:16px}'),
  css,
);
assert.ok(css.includes("{padding:var(--size-3)}"), css);
assert.ok(css.includes("{color:var(--blue-7)}"), css);
assert.ok(
  css.includes(
    "{box-shadow:0 3px 5px -2px hsl(220 3% 15% / 4%), 0 7px 14px -5px hsl(220 3% 15% / 6%)}",
  ),
  css,
);
assert.ok(css.includes("{transition-timing-function:cubic-bezier(0, 0, .3, 1)}"), css);

// easings.net: a CSS string, no token
css = await sheet("easings.ts");
assert.deepEqual(properties(css), [], css);
assert.ok(css.includes("{transition-timing-function:cubic-bezier(0.34, 1.56, 0.64, 1)}"), css);

// Flexoki and Reasonable Colors, nested under a group each
css = await sheet("palettes.ts");
assert.deepEqual(properties(css), ["--flexoki-base-black", "--reasonable-azure-1"], css);
assert.ok(css.includes("initial-value:#100f0f}"), css);

// Radix: a module that uses one token has one; the theme module has the dark values of every scale
css = await sheet("radix.ts");
assert.deepEqual(properties(css), ["--radix-blue-11"], css);
css = await sheet("radix-theme.ts");
assert.ok(css.includes(".dark{--radix-amber-1:#16120c;"), css);
assert.ok(css.includes("--radix-blue-11:#70b8ff;"), css);
assert.ok(css.includes("--radix-blue-a-3:#0077ff3a;"), css);

// check.contrast over light and dark: radix-theme.ts passes; a step-11 pair below 4.5 fails the build
await assert.rejects(client.transformRequest("/radix-contrast-fail.ts"), {
  message:
    "cssints: contrast 4.24 is below 4.5: radix.orange.11 #cc4e00 on radix.orange.2 #fff7ed, in the default values",
});

await server.close();
console.log("tokens: ok");
process.exit(0);

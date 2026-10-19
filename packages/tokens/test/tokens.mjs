// @cssints/tokens through the engine: each set as createTokens data (only the tokens a module uses reach its sheet), the
// rem, em, easing and shadow tokens of Open Props, Radix's dark theme and its contrast. Run: node test/tokens.mjs
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

// open-props: of the tokens made in open-props-tokens.ts, the six the module uses
let css = await sheet("open-props.ts");
assert.deepEqual(
  properties(css),
  ["--blue-7", "--ease-ease-out3", "--shadow-shadow2", "--size-3", "--text-2", "--tracking-1"],
  css,
);
for (const rule of [
  '@property --size-3{syntax:"<length>";inherits:true;initial-value:16px}',
  "{padding:var(--size-3)}",
  "{color:var(--blue-7)}",
  // rem and em: a px initial value, the value itself on :root, or on each element for a token that does not inherit
  '@property --text-2{syntax:"<length>";inherits:true;initial-value:17.6px}',
  ":root{--text-2:1.1rem}",
  '@property --tracking-1{syntax:"<length>";inherits:false;initial-value:0.4px}',
  ":where(*){--tracking-1:.025em}",
  // easings and shadows are tokens, and a theme sets the shadows
  '@property --ease-ease-out3{syntax:"*";inherits:true;initial-value:cubic-bezier(0, 0, .3, 1)}',
  "{transition-timing-function:var(--ease-ease-out3)}",
  '@property --shadow-shadow2{syntax:"*";inherits:true;initial-value:0 3px 5px -2px hsl(220 3% 15% / 4%), 0 7px 14px -5px hsl(220 3% 15% / 6%)}',
  "{box-shadow:var(--shadow-shadow2)}",
  ".dark{--shadow-shadow1:0 1px 2px -1px hsl(220 40% 2% / 34%);",
])
  assert.ok(css.includes(rule), `${rule}\n${css}`);

// Flexoki and Reasonable Colors, nested under a group each
css = await sheet("palettes.ts");
assert.deepEqual(properties(css), ["--flexoki-base-black", "--reasonable-azure-1"], css);
assert.ok(css.includes("initial-value:#100f0f}"), css);

// madoromi: one flavour as the tokens, the others as themes; the module that uses three tokens has three, and the
// themes (madoromi-tokens.ts) passed their contrast checks
css = await sheet("madoromi.ts");
assert.deepEqual(
  properties(css),
  ["--madoromi-ansi-4", "--madoromi-kami", "--madoromi-roles-text"],
  css,
);
for (const rule of [
  '@property --madoromi-kami{syntax:"<color>";inherits:true;initial-value:#f6eff8}',
  "@media (prefers-color-scheme: dark){:root{--madoromi-sakura:#ffc5da;",
  "--madoromi-kami:#241c26;",
  "--madoromi-roles-text:#e1d1e7;",
  "--madoromi-ansi-15:#b7a8bd}",
  '[data-madoromi="akiYoru"]{',
])
  assert.ok(css.includes(rule), `${rule}\n${css}`);

// Radix: a module that uses one token has one; the theme module has the dark values of every scale
css = await sheet("radix.ts");
assert.deepEqual(properties(css), ["--radix-blue-11"], css);
// a module that imports the theme module gets the rules of the tokens it uses, not of the 744 the themes set
css = await sheet("radix-theme-use.ts");
assert.deepEqual(properties(css), ["--radix-blue-11"], css);
assert.ok(css.includes("--radix-amber-1:#16120c;"), css);
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

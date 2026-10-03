// Support warnings of token values: the initial value of a token, a createTokens value, a theme override and a
// token.set() value go through the check a property value does. Run: node token-support.mjs
import assert from "node:assert/strict";
import { stripVTControlCharacters } from "node:util";

// The targets are read when the grammar package loads: set them first, so the imports come after.
process.env.BROWSERSLIST = "chrome 100, safari 15.2";
const { createLogger, createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");

const warnings = [];
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null },
  plugins: cssints(),
});
await server.environments.client.transformRequest("/fixtures/token-support.ts");

const lines = warnings.map((w) =>
  stripVTControlCharacters(w.split("\n")[0]).replace(/^.*warning: /, ""),
);
const lacking = (feature, value, key) =>
  `"${feature}" in "${value}" is not supported by chrome 100, safari 15.2 (${key})`;
const oklch = (value) => lacking("oklch()", value, "css.types.color.oklch");
// An @property initial value (token.color(), createTokens()) and an inline token.set() value are not lowered by
// LightningCSS, so they warn. A theme override is a custom property of the sheet: LightningCSS lowers a literal oklch()
// and light-dark() for these targets, so .brand and .mix give nothing; .rel has a var() inside, which it leaves alone.
assert.equal(lines.length, 6, lines.join("\n"));
assert.equal(
  lines[0],
  `token.color() initial value of --ts-named: ${oklch("oklch(0.62 0.19 259)")}`,
);
assert.equal(
  lines[1].replace(/--_[0-9a-f]{8}/, "--_private"),
  `token.color() initial value of --_private: ${oklch("oklch(0.5 0.1 20)")}`,
);
assert.equal(lines[2], `createTokens(): ts.accent value: ${oklch("oklch(0.62 0.19 259)")}`);
const rel = "oklch(from #2563eb l c h)";
assert.equal(lines[3], `createGlobalTheme(): ts.twice value in .rel: ${oklch(rel)}`);
assert.equal(
  lines[4],
  `createGlobalTheme(): ts.twice value in .rel: ${lacking("from", rel, "css.types.color.oklch.relative_syntax")}`,
);
assert.equal(lines[5], `token.set() value of --ts-named: ${oklch("oklch(0.7 0.1 30)")}`);

console.log(
  "token-support: token and theme values warn like property values, once per feature, unless LightningCSS lowers them",
);
await server.close();

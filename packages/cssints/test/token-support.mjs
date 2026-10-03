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
const oklch = (value) =>
  `"oklch()" in "${value}" is not supported by chrome 100, safari 15.2 (css.types.color.oklch)`;
// LightningCSS lowers a literal oklch() in a custom property of the sheet, and token.ts gives an @property initial value
// the lowered form (token-fallback.mjs), so a token, a createTokens() value and every theme override are handled, a
// reference (.rel) too: its literal is lowered and the live value goes under @supports. Only an inline token.set() value
// never goes through LightningCSS, and warns.
assert.deepEqual(lines, [`token.set() value of --ts-named: ${oklch("oklch(0.7 0.1 30)")}`]);

console.log(
  "token-support: a token.set() value warns like a property value; the sheet's token and theme values are lowered instead",
);
await server.close();

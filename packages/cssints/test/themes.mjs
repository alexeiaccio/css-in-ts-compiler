// Token sets, themes and the contrast check: DTCG input, aliases, theme rules in the sheet, errors located at their call.
// Run: node themes.mjs
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
const failure = async (f) => {
  try {
    await client.transformRequest(`/${f}`);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};
const at = (e) => ({ line: e.loc.line, column: e.loc.column });
const sheet = (...files) => plugins[0].api.sheet(files.map((f) => `${root}/fixtures/${f}`));

// createTokens: the tokens by path, as var() strings on the client; $type inherited through groups.
const code = (await client.transformRequest("/fixtures/themes-tokens.ts")).code;
assert.match(code, /"bg": "var\(--color-bg\)"/);
assert.match(code, /"linkHover": "var\(--color-link-hover\)"/);
assert.match(code, /"strong": "var\(--font-strong\)"/);
assert.ok(!/\bcss\.|createTokens/.test(code), "a module of tokens ships strings only");

// Aliases: @property gets the flattened literal, :root keeps them live (in layer _.k, after @property).
let css = sheet("themes-tokens.ts");
assert.ok(
  css.includes(
    '@property --color-link{syntax:"<color>";inherits:true;initial-value:oklch(0.62 0.19 259)}',
  ),
  css,
);
assert.ok(
  css.includes(
    '@property --color-link-hover{syntax:"<color>";inherits:true;initial-value:oklch(0.62 0.19 259)}',
  ),
  css,
);
assert.ok(
  css.includes(
    "@layer _.k {\n  :root{--color-link:var(--color-accent);--color-link-hover:var(--color-link)}\n}\n@layer _.a {",
  ),
  css,
);
// DTCG values: an oklch object, dimension and duration objects, a font-weight keyword
assert.ok(
  css.includes('--color-accent{syntax:"<color>";inherits:true;initial-value:oklch(0.62 0.19 259)}'),
  css,
);
assert.ok(css.includes('--space-sm{syntax:"<length>";inherits:true;initial-value:8px}'), css);
assert.ok(css.includes('--motion-fast{syntax:"<time>";inherits:true;initial-value:150ms}'), css);
assert.ok(css.includes('--font-strong{syntax:"<number>";inherits:true;initial-value:700}'), css);

// A mapper names the variables
await client.transformRequest("/fixtures/themes-mapper.ts");
assert.ok(sheet("themes-mapper.ts").includes("@property --ds-size-large{"));

// Errors, located at the call of createTokens
let e = await failure("fixtures/themes-cycle.ts");
assert.match(
  e.message,
  /^cssints: createTokens\(\): aliases go round in a circle: color\.a -> color\.b -> color\.c -> color\.a$/,
);
assert.deepEqual(at(e), { line: 3, column: 17 });
e = await failure("fixtures/themes-mismatch.ts");
assert.match(
  e.message,
  /^cssints: createTokens\(\): space\.gap is a dimension, and its alias \{color\.brand\} is a color$/,
);
e = await failure("fixtures/themes-unsupported.ts");
assert.match(
  e.message,
  /^cssints: createTokens\(\): shadow\.card has \$type "shadow", which has no token type/,
);
e = await failure("fixtures/themes-bad-value.ts");
assert.match(e.message, /^cssints: createTokens\(\): color\.badbg value "blu" is not a <color>$/);

await server.close();
console.log("themes: tokens from DTCG data, aliases flattened and live, errors located");

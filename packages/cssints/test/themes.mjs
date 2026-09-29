// Token sets, themes and the contrast check: DTCG input, aliases, theme rules in the sheet, errors located at their call.
// Run: node themes.mjs
import assert from "node:assert/strict";

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

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

console.log("themes: tokens from DTCG data, aliases flattened and live, errors located");

// createGlobalTheme: rules in layer _.k after the :root aliases, in source order, media before selectors; an alias
// of an overridden token is declared again in the theme; nothing of it ships to the client.
const themed = await client.transformRequest("/fixtures/themes-theme.ts");
assert.ok(!/createGlobalTheme|css\./.test(themed.code), themed.code);
css = sheet("themes-theme.ts");
const k = css.slice(css.indexOf("@layer _.k {"), css.indexOf("@layer _.a {"));
assert.equal(
  k,
  `@layer _.k {
  :root{--th-link:var(--th-accent);--th-link-hover:var(--th-link)}
  @media (prefers-color-scheme: dark){:root{--th-bg:#0b0b0f;--th-fg:#f3f4f6}}
  @container card (width < 30rem){:where(*){--gap-md:8px}}
  .light{--th-accent:color(srgb 0.1 0.4 0.9);--th-link:var(--th-accent);--th-link-hover:var(--th-link)}
  [data-tight]{--gap-md:4px}
}
`,
);
assert.ok(css.lastIndexOf("@property") < css.indexOf("@layer _.k {"), css);
// themes are the rules of the module that calls createGlobalTheme
assert.ok(!sheet("themes-mapper.ts").includes("@media"), "a theme belongs to its own module");

// Errors, located at the call: an unknown path, a value of another type, a condition that is not a theme
for (const [f, message, column] of [
  ["bad-path", /^cssints: createGlobalTheme\(\): there is no token at badpath\.nope$/, 0],
  ["bad-override", /^cssints: createGlobalTheme\(\): badval\.bg value "blu" is not a <color>$/, 0],
  ["bad-condition", /^cssints: createGlobalTheme\(\): :hover is not a theme/, 0],
]) {
  e = await failure(`fixtures/themes-${f}.ts`);
  assert.match(e.message, message);
  assert.deepEqual(at(e), { line: 4, column });
}

// Dev: a changed theme value updates the sheet, and a removed theme leaves it.
const tmp = mkdtempSync(join(root, ".tmp-themes-"));
const file = join(tmp, "hmr.ts");
const write = (bg, theme = true) =>
  writeFileSync(
    file,
    `import * as css from "cssints" with { type: "cssints" };
export const t = css.createTokens({ hmrt: { $type: "color", bg: { $value: "#fff" } } });
${theme ? `css.createGlobalTheme(t, css.media("(prefers-color-scheme: dark)"), { hmrt: { bg: "${bg}" } });` : ""}
`,
  );
const SHEET = "\0virtual:cssints.css";
const served = async () =>
  JSON.parse((await client.transformRequest(SHEET)).code.match(/const __vite__css = (".*")/)[1]);
const edit = async (...args) => {
  write(...args);
  server.watcher.emit("change", file);
  await sleep(300);
  await client.transformRequest(`/${tmp.split("/").pop()}/hmr.ts`);
  return served();
};
try {
  css = await edit("#000");
  assert.match(css, /@media \(prefers-color-scheme: dark\)\{:root\{--hmrt-bg:#000\}\}/);
  css = await edit("#111");
  assert.match(css, /--hmrt-bg:#111\}\}/);
  assert.equal(css.match(/--hmrt-bg:#/g).length, 1, css);
  css = await edit("#111", false);
  assert.ok(!css.includes("@media (prefers-color-scheme: dark){:root{--hmrt-bg"), css);
  assert.ok(css.includes("@property --hmrt-bg"), css);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

await server.close();
console.log("themes: theme rules in layer _.k, aliases declared again, edits reach the sheet");

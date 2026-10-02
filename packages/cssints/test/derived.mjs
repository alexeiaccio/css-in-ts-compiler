// Derived tokens (a reference inside a CSS value stays live and follows a theme of its target) and DTCG JSON input
// (createTokens of an imported .json). Run: node derived.mjs
import assert from "node:assert/strict";

import { createServer } from "vite";

import cssints from "../src/plugin.ts";

const root = import.meta.dirname;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  logLevel: "silent",
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${root}/fixtures/${f}`]);

await code("derived-use.ts");
const css = await sheet("derived-use.ts");
// the initial value takes the target's literal (an @property initial value cannot hold var())
assert.match(
  css,
  /@property --color-hover\{[^}]*initial-value:color-mix\(in oklab, #2563eb, black 15%\)/,
  css,
);
assert.match(css, /@property --space-lg\{[^}]*initial-value:calc\(16px \* 2\)/, css);
// the live value keeps var(): a chain of derived tokens resolves through each other
assert.match(css, /--color-hover:color-mix\(in oklab, var\(--color-accent\), black 15%\)/, css);
assert.match(css, /--color-ring:oklch\(from var\(--color-hover\) l c h \/ 50%\)/, css);
// the theme sets accent; hover and ring depend on it, so they are declared again there
const brand = /\.brand\{([^}]*)\}/.exec(css)?.[1] ?? "";
assert.match(brand, /--color-accent:#db2777/, css);
assert.match(brand, /--color-hover:color-mix\(in oklab, var\(--color-accent\), black 15%\)/, css);
assert.match(brand, /--color-ring:oklch\(from var\(--color-hover\)/, css);
assert.ok(!brand.includes("--space-lg"), "space does not depend on accent");

await assert.rejects(code("derived-missing.ts"), (e) => {
  assert.match(
    e.message,
    /color\.hover refers to \{color\.nope\}, and there is no token at color\.nope/,
  );
  return true;
});

// JSON: the tree of the import, the DTCG object forms, a derived value
const json = await code("json-use.ts");
assert.match(json, /"hover": "var\(--brand-hover\)"/);
const jcss = await sheet("json-use.ts");
assert.match(jcss, /@property --brand-accent\{[^}]*initial-value:oklch\(0\.62 0\.19 264\)/, jcss);
assert.match(jcss, /--brand-hover:color-mix\(in oklab, var\(--brand-accent\), black 15%\)/, jcss);
assert.match(jcss, /@property --gap-md\{[^}]*initial-value:16px/, jcss);

await server.close();
console.log("derived: live references, themes, JSON input ok");

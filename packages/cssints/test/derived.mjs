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

// a token that others are made of has its @property rule though no class uses it, or `oklch(0.9 0.05 var(--root-hue-accent))`
// is invalid at computed-value time and the registered initial value wins in every theme
await code("derived-root.ts");
const hueSheet = await sheet("derived-root.ts");
assert.match(
  hueSheet,
  /@property --root-hue-accent\{[^}]*syntax:"<number>"[^}]*initial-value:345\}/,
  hueSheet,
);
assert.match(
  hueSheet,
  /\.dim\{[^}]*--root-color-hover:oklch\(0\.7 0\.18 var\(--root-hue-accent\)\)/,
  hueSheet,
);

await assert.rejects(code("derived-missing.ts"), (e) => {
  assert.match(
    e.message,
    /color\.hover refers to \{color\.nope\}, and there is no token at color\.nope/,
  );
  return true;
});

// theme overrides that refer to tokens: live var(), dependents declared again, the target set in the same theme
await code("theme-refs.ts");
const refs = await sheet("theme-refs.ts");
const rule = (sel) => new RegExp(`${sel.replace(".", "\\.")}\\{([^}]*)\\}`).exec(refs)?.[1] ?? "";
const square = rule(".square");
assert.match(square, /--refs-radius-md:var\(--refs-radius-sm\)/, refs);
assert.match(square, /--refs-radius-lg:calc\(var\(--refs-radius-md\) \* 2\)/, refs); // derived from md
assert.ok(!square.includes("--refs-radius-sm:"), square); // the target is read, not set
const dim = rule(".dim");
assert.match(dim, /--refs-hue-accent:12/, refs);
assert.match(dim, /--refs-color-accent:oklch\(0\.7 0\.1 var\(--refs-hue-accent\)\)/, refs);
assert.match(dim, /--refs-color-soft:var\(--refs-color-accent\)/, refs);
assert.match(dim, /--refs-color-hover:color-mix\(in oklab, var\(--refs-color-accent\)/, refs); // derived from accent

const refError = (f, re) =>
  assert.rejects(code(f), (e) => {
    assert.match(e.message, re);
    return true;
  });
await refError(
  "theme-ref-missing.ts",
  /color\.bg refers to \{color\.nope\}, and there is no token at color\.nope/,
);
await refError(
  "theme-ref-type.ts",
  /color\.bg is a color, and its reference \{radius\.sm\} is a length/,
);
await refError("theme-ref-bad.ts", /color\.bg value "oklch\(0\.5 #000 nope\)" is not a <color>/);
await refError(
  "theme-ref-circle.ts",
  /references go round in a circle: color\.bg -> color\.alias -> color\.bg/,
);

// JSON: the tree of the import, the DTCG object forms, a derived value
const json = await code("json-use.ts");
assert.match(json, /"hover": "var\(--brand-hover\)"/);
const jcss = await sheet("json-use.ts");
assert.match(jcss, /@property --brand-accent\{[^}]*initial-value:oklch\(0\.62 0\.19 264\)/, jcss);
assert.match(jcss, /--brand-hover:color-mix\(in oklab, var\(--brand-accent\), black 15%\)/, jcss);
assert.match(jcss, /@property --gap-md\{[^}]*initial-value:16px/, jcss);

await server.close();
console.log("derived: live references, themes, JSON input ok");

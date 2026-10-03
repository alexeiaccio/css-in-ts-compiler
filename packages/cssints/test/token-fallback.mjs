// A token value that some target cannot parse (cssints-33pa): a target without oklch() would drop the @property rule of
// --tf-named and the token would have no value. The initial value is what LightningCSS lowers the value to, and `:root`
// gets the value itself (LightningCSS lowers that too and adds the wide one under @supports). A derived token or a theme
// value that holds var() has its lowered literal as default, and the live value under @supports of the literal. With
// modern targets none of it is written. Each case is a child process: the targets are read once per process.
// Run: node token-fallback.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { stripVTControlCharacters } from "node:util";

if (process.argv[2] === "child") {
  const { createLogger, createServer } = await import("vite");
  const { default: cssints } = await import("../src/plugin.ts");
  const warnings = [];
  const plugins = cssints();
  const server = await createServer({
    root: import.meta.dirname,
    configFile: false,
    customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
    server: { middlewareMode: true, watch: null },
    plugins,
  });
  const file = `${import.meta.dirname}/fixtures/token-fallback.ts`;
  const { code } = await server.environments.client.transformRequest("/fixtures/token-fallback.ts");
  const sheet = await plugins[0].api.sheet([file]);
  const runtime = await server.environments.client.pluginContainer.load(
    "\0virtual:cssints/runtime/derived",
  );
  await server.close();
  const lines = warnings.map((w) => stripVTControlCharacters(w.split("\n")[0]));
  console.log(
    `SHEET ${JSON.stringify({ sheet, lines, imports: code.includes("runtime/derived"), runtime })}`,
  );
} else {
  const run = (BROWSERSLIST) => {
    const out = execFileSync(process.execPath, [import.meta.filename, "child"], {
      env: { ...process.env, BROWSERSLIST },
      encoding: "utf8",
    });
    return JSON.parse(
      out
        .split("\n")
        .find((l) => l.startsWith("SHEET "))
        .slice(6),
    );
  };

  const old = run("chrome 109");
  const { sheet: css } = old;
  // the mix in a polar space is outside what the runtime computes: it stays at its static default, and the build says so
  assert.equal(old.lines.length, 1, old.lines.join("\n"));
  assert.match(
    old.lines[0],
    /^warning: tf\.color\.mixed: "[^"]+" stays at its static default in chrome 109: the runtime for derived tokens does not evaluate "oklch"/,
  );
  const hex = "#[0-9a-f]{6}";
  const has = (re) => assert.match(css, new RegExp(re), css);
  // 1. the initial value is the lowered one, the value itself goes to :root (the sheet LightningCSS gets)
  has(`@property --tf-named\\{[^}]*initial-value:${hex}\\}`);
  has(String.raw`:root\{--tf-named:oklch\(0\.62 0\.19 259\)\}`);
  has(String.raw`:where\(\*\)\{--tf-flat:oklch\(0\.5 0\.1 20\)\}`); // inherits: false: every element, not the root
  has(`@property --tf-color-brand\\{[^}]*initial-value:${hex}\\}`);
  has(String.raw`:root\{--tf-color-brand:oklch\(0\.7 0\.1 30\)\}`);
  assert.ok(!/@property --tf-hue\{[^}]*initial-value:#/.test(css), "a number needs no fallback");
  // 2. a derived token: the lowered literal is the default, the live value follows under @supports of the literal
  has(`@property --tf-color-accent\\{[^}]*initial-value:${hex}\\}`);
  has(`:root\\{[^}]*--tf-color-accent:${hex}[;}]`);
  has(
    String.raw`@supports \(color:oklch\(0\.6 0\.2 345\)\)\{:root\{--tf-color-accent:oklch\(0\.6 0\.2 var\(--tf-hue\)\)\}\}`,
  );
  has(String.raw`--tf-color-link:var\(--tf-color-accent\)`); // an alias stays live
  // 3. the same in a theme; a literal value is left to LightningCSS
  has(`\\.dim\\{[^}]*--tf-color-accent:${hex}[;}]`);
  has(
    String.raw`@supports \(color:oklch\(0\.7 0\.1 345\)\)\{\.dim\{--tf-color-accent:oklch\(0\.7 0\.1 var\(--tf-hue\)\)\}\}`,
  );
  has(String.raw`\.dim\{[^}]*--tf-color-brand:oklch\(0\.8 0\.1 30\)`);

  // 4. the runtime of derived tokens (derived-poly.mjs, cssints-i9xo): the data in the sheet, the import, the module
  const data = JSON.parse(/--_derived:'(.*)'\}/.exec(css)[1].replace(/\\(.)/g, "$1"));
  assert.ok(data.p.includes("oklch(0.6 0.2 345)"), "a probe literal for the browser");
  assert.deepEqual(
    Object.keys(data.b),
    ["--tf-color-accent", "--tf-color-on-accent"],
    "mixed is not computed",
  );
  assert.equal(data.b["--tf-color-accent"], "oklch(0.6 0.2 var(--tf-hue))");
  assert.match(
    data.b["--tf-color-on-accent"],
    /^lab\(from color\(from var\(--tf-color-accent\) srgb-linear /,
  );
  assert.deepEqual(data.t, [
    [".dim", { "--tf-color-accent": "oklch(0.7 0.1 var(--tf-hue))" }],
    [".hc", { "--tf-color-accent": 0 }], // a literal in this theme: the runtime lets go
  ]);
  assert.ok(old.imports, "the module that uses the tokens imports the runtime");
  assert.equal(old.runtime, 'import derived from "cssints/derived";\nderived();\n');

  // modern targets: the sheet of before, with the literal as initial value and no @supports
  const now = run("chrome 154");
  assert.deepEqual(now.lines, []);
  assert.ok(!now.sheet.includes("--_derived") && !now.imports, "modern targets ship nothing");
  assert.equal(now.runtime, "export {};");
  assert.match(now.sheet, /@property --tf-named\{[^}]*initial-value:oklch\(0\.62 0\.19 259\)\}/);
  assert.match(
    now.sheet,
    /@property --tf-color-accent\{[^}]*initial-value:oklch\(0\.6 0\.2 345\)\}/,
  );
  assert.match(now.sheet, /--tf-color-accent:oklch\(0\.6 0\.2 var\(--tf-hue\)\)/);
  assert.ok(!/@supports|:where\(\*\)|--tf-named:/.test(now.sheet), now.sheet);
  console.log(
    "token-fallback: lowered initial values, guarded live values and the derived-token runtime for old targets, none for modern ones",
  );
}

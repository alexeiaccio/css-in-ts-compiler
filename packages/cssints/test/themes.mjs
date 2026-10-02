// Token sets, themes and the contrast check: DTCG input, aliases, theme rules in the sheet, errors located at their call.
// Run: node themes.mjs
import assert from "node:assert/strict";

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stripVTControlCharacters } from "node:util";
import { setTimeout as sleep } from "node:timers/promises";

import { build, createLogger, createServer } from "vite";

import cssints from "../src/plugin.ts";

const root = import.meta.dirname;
const plugins = cssints();
const warnings = [];
const customLogger = { ...createLogger("warn"), warn: (m) => warnings.push(m) };
const server = await createServer({
  root,
  configFile: false,
  logLevel: "warn",
  customLogger,
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

// a module that only uses tokens has the rules that set them, from the module that made those
await client.transformRequest("/fixtures/themes-use.ts");
css = sheet("themes-use.ts");
assert.ok(css.includes("@media (prefers-color-scheme: dark){:root{--th-bg:#0b0b0f"), css);
assert.ok(css.includes("[data-tight]{--gap-md:4px}"), css);
assert.ok(!css.includes(".light{"), "a theme that sets no token it uses stays out");

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
  // the last site of a module goes: its tokens and theme leave the sheet
  writeFileSync(
    file,
    `import * as css from "cssints" with { type: "cssints" };\nexport const y = 1;\n`,
  );
  server.watcher.emit("change", file);
  await sleep(300);
  await client.transformRequest(`/${tmp.split("/").pop()}/hmr.ts`);
  assert.ok(!(await served()).includes("--hmrt-bg"), "a module without a site leaves the sheet");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("themes: theme rules in layer _.k, aliases declared again, edits reach the sheet");

// css.check.contrast: passes (the theme is declared after the check), and a build error names the theme and both values.
await client.transformRequest("/fixtures/themes-contrast-pass.ts");
assert.deepEqual(warnings, []);
e = await failure("fixtures/themes-contrast-fail.ts");
assert.equal(
  e.message,
  [
    "cssints: contrast 1.11 is below 4.5: cfail.link #111827 on cfail.bg #222222, in theme @media (prefers-color-scheme: dark)",
    "cssints: contrast 1.24 is below 4.5: cfail.link #888888 on cfail.bg #999999, in theme .dim",
  ].join("\n"),
);
assert.deepEqual(at(e), {
  line:
    readFileSync(`${root}/fixtures/themes-contrast-fail.ts`, "utf8")
      .split("\n")
      .findIndex((l) => l.startsWith("css.check.contrast")) + 1,
  column: 0,
});
e = await failure("fixtures/themes-contrast-default.ts");
assert.equal(
  e.message,
  "cssints: contrast 4.47 is below 4.5: cdef.fg #777777 on cdef.bg #ffffff, in the default values",
);

// A derived colour is read per theme: the theme's values go into its template, through a chain of derived tokens too.
e = await failure("fixtures/themes-contrast-derived-fail.ts");
assert.equal(
  e.message,
  [
    "cssints: contrast 1.10 is below 4.5: cdf.fg oklch(0.95 0 0) on cdf.bg #ffffff, in theme .x",
    "cssints: contrast 1.29 is below 4.5: cdf.fg oklch(0.9 0 0) on cdf.bg #ffffff, in theme .y",
  ].join("\n"),
);
warnings.length = 0;
await client.transformRequest("/fixtures/themes-contrast-derived-pass.ts");
assert.deepEqual(warnings, [], "a derived colour that stays readable passes");
e = await failure("fixtures/themes-contrast-derived-chain.ts");
assert.equal(
  e.message,
  "cssints: contrast 1.29 is below 4.5: cdc.fg oklch(0.9 0 0) on cdc.bg #ffffff, in theme .x",
);

// A value the check cannot evaluate is a warning that names the token, once.
await client.transformRequest("/fixtures/themes-contrast-warn.ts");
assert.deepEqual(
  warnings.map(
    (w) =>
      stripVTControlCharacters(w)
        .replace(/^.*?cssints:/, "cssints:")
        .split("\n")[0],
  ),
  [
    'cssints: contrast is not checked for cwarn.mixed in the default values: "color-mix(in oklab, #000, #222 30%)" is not a colour the check can read',
    'cssints: contrast is not checked for cwarn.glass in the default values: "rgb(0 0 0 / 50%)" is translucent, and has no contrast without a backdrop',
    'cssints: contrast is not checked for cwarn.plain in theme .x: "currentColor" is not a colour the check can read',
  ],
);
warnings.length = 0;
await client.transformRequest("/fixtures/themes-contrast-warn.ts");
assert.deepEqual(warnings, [], "a warning is given once per build");

await server.close();

// A derived colour (color-mix over another token) cannot be read: the warning reaches the logger once for each evaluation
// of the module, so an edit in dev shows it again, and a build says it once however many modules import the check.
const derived = `import * as css from "cssints" with { type: "cssints" };
export const t = css.createTokens({
  cder: {
    $type: "color",
    bg: { $value: "#ffffff" },
    base: { $value: "#1d4ed8" },
    mix: { $value: "color-mix(in oklab, {cder.base}, black 15%)" },
  },
});
css.check.contrast(t.cder.mix, t.cder.bg, { min: 4.5 });
css.check.contrast(t.cder.mix, t.cder.base, { min: 1 });
`;
const derivedWarning = [
  'cssints: contrast is not checked for cder.mix in the default values: "color-mix(in oklab, #1d4ed8, black 15%)" is not a colour the check can read',
];
const first = (w) =>
  stripVTControlCharacters(w)
    .replace(/^.*?cssints:/, "cssints:")
    .split("\n")[0];
const tmpd = mkdtempSync(join(root, ".tmp-themes-dev-"));
globalThis.__cssints.checks.clear();
try {
  writeFileSync(join(tmpd, "tokens.ts"), derived);
  warnings.length = 0;
  const dev = await createServer({
    root: tmpd,
    configFile: false,
    logLevel: "warn",
    customLogger,
    server: { middlewareMode: true, hmr: { port: 24999 } },
    plugins: cssints(),
  });
  const devClient = dev.environments.client;
  await devClient.transformRequest("/tokens.ts");
  assert.deepEqual(warnings.map(first), derivedWarning, "dev: a derived colour warns once");
  const edited = Promise.withResolvers();
  dev.watcher.once("change", edited.resolve);
  writeFileSync(join(tmpd, "tokens.ts"), `${derived}// edited\n`);
  await edited.promise;
  await sleep(500);
  warnings.length = 0;
  await devClient.transformRequest("/tokens.ts");
  assert.deepEqual(
    warnings.map(first),
    derivedWarning,
    "dev: the warning shows again after an edit",
  );
  await dev.close();
} finally {
  rmSync(tmpd, { recursive: true, force: true });
}

// A build checks again at its end: a theme of a module that came after the check still counts, and culori stays out of the bundle.
globalThis.__cssints.checks.clear(); // the fixtures above failed on purpose, in this process
const tmpb = mkdtempSync(join(root, ".tmp-themes-build-"));
try {
  const w = (f, text) => writeFileSync(join(tmpb, f), text);
  w(
    "tokens.ts",
    `import * as css from "cssints" with { type: "cssints" };
export const t = css.createTokens({ late: { $type: "color", bg: { $value: "#fff" }, fg: { $value: "#000" } } });
`,
  );
  w(
    "a.ts",
    `import * as css from "cssints" with { type: "cssints" };
import { t } from "./tokens.ts" with { type: "cssints" };
css.check.contrast(t.late.fg, t.late.bg, { min: 4.5 });
`,
  );
  w(
    "b.ts",
    `import * as css from "cssints" with { type: "cssints" };
import { t } from "./tokens.ts" with { type: "cssints" };
css.createGlobalTheme(t, ".low", { late: { fg: "#aaa" } });
`,
  );
  w("main.ts", `import "./a.ts";\nimport "./b.ts";\nexport const x = 1;\n`);
  const run = (input) =>
    build({
      root: tmpb,
      configFile: false,
      logLevel: "silent",
      plugins: cssints(),
      build: { write: false, rollupOptions: { input: join(tmpb, input) } },
    });
  await assert.rejects(
    run("main.ts"),
    /contrast 2\.32 is below 4\.5: late\.fg #aaa on late\.bg #fff, in theme \.low/,
  );
  w("b.ts", `import * as css from "cssints" with { type: "cssints" };\nexport const y = 1;\n`);
  w("main.ts", `import "./a.ts";\nimport "./b.ts";\nexport const x = 1;\n`);
  const ok = await run("main.ts");
  const code = [ok]
    .flat()
    .flatMap((o) => o.output)
    .map((f) => String(f.code ?? f.source))
    .join("\n");
  assert.ok(!/culori|wcag|rebeccapurple/i.test(code), "the colour library is build only");

  // The same derived colour checked in a module that two others import: one warning for the build, not one per pass or module.
  globalThis.__cssints.warned.clear(); // the dev server above warned in this process
  w("tokens.ts", derived);
  w("a.ts", `import "./tokens.ts" with { type: "cssints" };\nexport const a = 1;\n`);
  w("b.ts", `import "./tokens.ts" with { type: "cssints" };\nexport const b = 1;\n`);
  w("main.ts", `import "./a.ts";\nimport "./b.ts";\nexport const x = 1;\n`);
  warnings.length = 0;
  await build({
    root: tmpb,
    configFile: false,
    logLevel: "warn",
    customLogger,
    plugins: cssints(),
    build: { write: false, rollupOptions: { input: join(tmpb, "main.ts") } },
  });
  assert.deepEqual(warnings.map(first), derivedWarning, "build: a derived colour warns once");
} finally {
  rmSync(tmpb, { recursive: true, force: true });
}
console.log("themes: contrast passes, fails with the theme and values, warns, build only");
process.exit(0);

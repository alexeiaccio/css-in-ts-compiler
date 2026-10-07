// A package written on cssints (pkg/ui, built by tsdown) in an app's node_modules: its attributes survive the build,
// the engine evaluates it with the app's sheet, targets and themes, in dev (no optimizer, no externalization) and in a build.
// Run: node packages.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { build, createServer } from "vite";

import cssints from "../src/plugin.ts";

const here = import.meta.dirname;
const tmp = join(here, ".tmp-packages");
const lib = join(tmp, "ui");
const app = join(tmp, "app");
const pkgName = "cssints-fixture-ui";

rmSync(tmp, { recursive: true, force: true });
mkdirSync(join(lib, "node_modules"), { recursive: true });
cpSync(join(here, "pkg/ui"), lib, { recursive: true });
symlinkSync(join(here, ".."), join(lib, "node_modules/cssints"));
execFileSync(
  join(here, "../../../node_modules/.bin/vp"),
  ["pack", "--no-config", "src/index.ts", "--dts", "--platform", "neutral"],
  { cwd: lib, stdio: "pipe" },
);

// What tsdown emitted: the attributes kept, `cssints` external, the declarations next to the code.
const dist = readFileSync(join(lib, "dist/index.js"), "utf8");
assert.match(dist, /from "cssints" with \{ type: "cssints" \}/, dist);
assert.ok(!dist.includes("node_modules"), "cssints is not bundled");
assert.ok(existsSync(join(lib, "dist/index.d.ts")), "the .d.ts is emitted");

// An app that installs it, uses its style, its cv and its token, and themes the token.
const put = (file, text) => {
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, text);
};
const installed = join(app, "node_modules", pkgName);
mkdirSync(installed, { recursive: true });
cpSync(join(lib, "dist"), join(installed, "dist"), { recursive: true });
cpSync(join(lib, "package.json"), join(installed, "package.json"));
symlinkSync(join(here, ".."), join(app, "node_modules/cssints"));
put(
  join(app, "package.json"),
  JSON.stringify({ type: "module", dependencies: { cssints: "*", [pkgName]: "*" } }),
);
put(
  join(app, "index.html"),
  `<!doctype html><body><script type="module" src="/main.ts"></script></body>`,
);
put(
  join(app, "main.ts"),
  `import "virtual:cssints.css";
import { bg, cn, createGlobalTheme } from "cssints" with { type: "cssints" };
import { button, card } from "${pkgName}";
import { t } from "${pkgName}" with { type: "cssints" };

createGlobalTheme(t, ".dark", { color: { brand: "#ef4444" } });
const banner = cn(bg(t.color.brand()));
document.body.innerHTML = \`<div class="\${card} \${banner} \${button()}">x</div>\`;
`,
);

const classesIn = (code) =>
  [...code.matchAll(/"(_[a-z0-9]+(?: _[a-z0-9]+)*)"/g)].flatMap((m) => m[1].split(" "));
const checkSheet = (css, classes) => {
  for (const c of classes) assert.ok(css.includes(`.${c}`), `.${c} is in the sheet\n${css}`);
  assert.equal(css.match(/@property --color-brand/g)?.length, 1, "the token of the package, once");
  assert.match(css, /initial-value:\s*#3b82f6/i);
  assert.match(
    css,
    /\.dark\s*\{\s*--color-brand:\s*#ef4444/,
    "the app's theme of the package's token",
  );
  assert.match(css, /:hover/);
};

// Dev: HTTP, like a browser.
const plugins = cssints();
const server = await createServer({
  root: app,
  configFile: false,
  logLevel: "warn",
  server: { port: 0 },
  plugins,
});
await server.listen();
const base = server.resolvedUrls.local[0];
const get = async (path) => (await fetch(new URL(path, base))).text();
const main = await get("/main.ts");
const ui = await get(`/node_modules/${pkgName}/dist/index.js`);
assert.ok(!/createTokens|\bcv\(|type: "cssints"/.test(ui), `the package is compiled:\n${ui}`);
const classes = [...classesIn(ui), ...classesIn(main)];
assert.ok(classes.length >= 4, ui);
assert.ok(!main.includes("createGlobalTheme(t"), main);
const scan = server.environments.client.depsOptimizer;
await scan?.scanProcessing;
assert.ok(!(pkgName in (scan?.metadata.optimized ?? {})), "the package is not pre-bundled");
checkSheet(plugins[0].api.sheet(), classes);
// the sheet as the browser gets it: a module that updates a style tag
const sheetModule = await get("/@id/__x00__virtual:cssints.css");
checkSheet(JSON.parse(/const __vite__css = ("(?:[^"\\]|\\.)*")/.exec(sheetModule)[1]), classes);
await server.close();

// Build: one sheet.
const out = await build({
  root: app,
  configFile: false,
  logLevel: "warn",
  plugins: cssints(),
  css: { transformer: "lightningcss" },
  build: { write: false, minify: false, cssMinify: "lightningcss", outDir: join(tmp, "out") },
});
const files = [out].flat().flatMap((o) => o.output);
const sheets = files.filter((f) => f.fileName.endsWith(".css"));
const js = files
  .filter((f) => f.fileName.endsWith(".js"))
  .map((f) => f.code)
  .join("\n");
assert.equal(sheets.length, 1, "one sheet");
assert.ok(!/createTokens|createGlobalTheme|type: "cssints"/.test(js), js);
checkSheet(String(sheets[0].source).replace(/\s+/g, " "), classesIn(js));
assert.ok(classesIn(js).length >= 4, js);

rmSync(tmp, { recursive: true, force: true });
console.log(
  `packages: ${pkgName} kept its attributes, dev and build evaluate it (${sheets[0].fileName})`,
);
process.exit(0);

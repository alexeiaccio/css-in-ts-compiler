// The Node side of the playground's parity test (test/playground.mjs): each case of a JSON file (the files of a project, or one
// source) through the real plugin, as a dev server does after an edit of the files (the way packages/mcp compiles), printed as
// JSON: the sheet and the classes of the modules, the located error, the warnings. Run with the working directory test/out/playground: a private token is named after
// its file relative to it, as in the playground ("playground.tsx").
//   node test/playground-reference.mjs <cases.json>
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { createLogger, createServer } from "vite";

import cssints from "../../../packages/cssints/src/plugin.ts";

const root = process.cwd();
const packages = join(import.meta.dirname, "../../../packages");
const cases = JSON.parse(readFileSync(process.argv[2], "utf8"));

const warnings = [];
const logger = createLogger("warn");
// Vite prints a warning as "warning: <message>\n  Plugin: cssints\n  File: <file>"
// (colours when the runner forces them)
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
logger.warn = (m) =>
  warnings.push(
    m
      .replace(ANSI, "")
      .replace(/^warning: /, "")
      .split("\n  Plugin:")[0]
      .trim(),
  );
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  logLevel: "warn",
  customLogger: logger,
  server: { middlewareMode: true, watch: null, ws: false, hmr: false },
  optimizeDeps: { noDiscovery: true },
  // the plugin packages are the playground's modules: their sources, as the worker has them
  resolve: {
    alias: [
      { find: /^@cssints\/([\w-]+)\/(runtime|observer)$/, replacement: `${packages}/$1/src/$2.ts` },
      { find: /^@cssints\/tokens\/([\w-]+)$/, replacement: `${packages}/tokens/src/$1.ts` },
      { find: /^@cssints\/([\w-]+)$/, replacement: `${packages}/$1/src/index.ts` },
    ],
  },
  // the working directory sits under apps/docs, whose tsconfig keeps JSX for Solid; what is compared is what the plugin makes
  oxc: { jsx: { runtime: "classic" } },
  plugins,
});
const client = server.environments.client;
const plugin = plugins[0];
const hotUpdate =
  typeof plugin.hotUpdate === "function" ? plugin.hotUpdate : plugin.hotUpdate.handler;

const names = new Set(/** @type {string[]} */ ([]));
const file = (name) => join(root, name);
const write = (name, text) => {
  mkdirSync(dirname(file(name)), { recursive: true });
  writeFileSync(file(name), text);
};

// An edit as a dev server sees it: the files are read again, what depends on them is forgotten, the warnings are said again.
const edit = (files) => {
  // a case is a project of its own: the tokens of the one before are gone, as in a fresh server
  globalThis.__cssints?.properties.clear();
  globalThis.__cssints?.defs.clear();
  for (const [name, text] of Object.entries(files)) write(name, text);
  for (const env of Object.values(server.environments)) env.moduleGraph.invalidateAll();
  for (const name of Object.keys(files))
    void hotUpdate.call({ environment: client }, { file: file(name), modules: [] });
  warnings.length = 0;
};

const out = [];
for (const c of cases) {
  const files = typeof c === "string" ? { "playground.tsx": c } : c;
  // A module with no import of cssints is left alone by the plugin, and its sheet stays what the module before it made: a
  // module with an import and no site empties it first.
  const before = Object.fromEntries(
    [...names].map((n) => [n, 'import { p } from "cssints" with { type: "cssints" };\n']),
  );
  edit(before);
  for (const n of names) await client.transformRequest(`/${n}`);
  Object.keys(files).forEach((n) => names.add(n));
  edit(files);
  const ids = Object.keys(files).map(file);
  try {
    const classes = new Set();
    for (const name of Object.keys(files)) {
      const r = await client.transformRequest(`/${name}`);
      for (const m of r.code.matchAll(/"(_[\w-]+(?: _[\w-]+)*)"/g))
        m[1].split(" ").forEach((x) => classes.add(x));
    }
    out.push({
      ok: true,
      css: plugin.api.sheet(ids),
      classes: [...classes],
      warnings: [...warnings],
    });
  } catch (e) {
    const cause = e;
    out.push({
      ok: false,
      message: String(cause.message).split("\n")[0].replaceAll(root, ""),
      file: cause.loc?.file && relative(root, cause.loc.file),
      line: cause.loc?.line,
      column: cause.loc ? cause.loc.column + 1 : undefined,
      warnings: [...warnings],
    });
  }
}
// the last case may not parse, and test/out is in the project of tsconfig.json
for (const n of names) write(n, "export {};\n");
await server.close();
process.stdout.write(JSON.stringify(out));
process.exit(0);

// The Node side of the playground's parity test (test/playground.mjs): each source of a JSON file through the real plugin, as a
// dev server does after an edit of one module (the way packages/mcp compiles), printed as JSON: the sheet and the classes of the
// module, the located error, the warnings. Run with the working directory test/out/playground: a private token is named after
// its file relative to it, as in the playground ("playground.tsx").
//   node test/playground-reference.mjs <cases.json>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createLogger, createServer } from "vite";

import cssints from "../../../packages/cssints/src/plugin.ts";

const root = process.cwd();
const file = join(root, "playground.tsx");
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
  // the working directory sits under apps/docs, whose tsconfig keeps JSX for Solid; what is compared is what the plugin makes
  oxc: { jsx: { runtime: "classic" } },
  plugins,
});
const client = server.environments.client;
const plugin = plugins[0];
const hotUpdate =
  typeof plugin.hotUpdate === "function" ? plugin.hotUpdate : plugin.hotUpdate.handler;

// An edit as a dev server sees it: the module is read again, what depends on it is forgotten, the warnings are said again.
const edit = (source) => {
  writeFileSync(file, source);
  for (const env of Object.values(server.environments)) env.moduleGraph.invalidateAll();
  void hotUpdate.call({ environment: client }, { file, modules: [] });
  warnings.length = 0;
};

const out = [];
for (const source of cases) {
  // A module with no import of cssints is left alone by the plugin, and its sheet stays what the module before it made: a
  // module with an import and no site empties it first.
  edit('import { p } from "cssints" with { type: "cssints" };\n');
  await client.transformRequest("/playground.tsx");
  edit(source);
  try {
    const r = await client.transformRequest("/playground.tsx");
    const classes = [
      ...new Set([...r.code.matchAll(/"(_[\w-]+(?: _[\w-]+)*)"/g)].flatMap((m) => m[1].split(" "))),
    ];
    out.push({ ok: true, css: plugin.api.sheet([file]), classes, warnings: [...warnings] });
  } catch (e) {
    const cause = e;
    out.push({
      ok: false,
      message: String(cause.message).split("\n")[0].replaceAll(file, "/playground.tsx"),
      line: cause.loc?.line,
      column: cause.loc ? cause.loc.column + 1 : undefined,
      warnings: [...warnings],
    });
  }
}
// the last case may not parse, and test/out is in the project of tsconfig.json
writeFileSync(file, "export {};\n");
await server.close();
process.stdout.write(JSON.stringify(out));
process.exit(0);

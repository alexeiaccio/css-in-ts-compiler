// A dev server: a file with a named token that is renamed or deleted leaves no @property or token value behind, so the
// name can be declared again elsewhere (cssints-yrxy). An unchanged edit of the file keeps working. Run: node dev-token-rename.mjs
import assert from "node:assert/strict";
import { mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

process.env.BROWSERSLIST = "chrome 130, firefox 130, safari 18";
const { createLogger, createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");

const root = import.meta.dirname;
const server = await createServer({
  root,
  configFile: false,
  customLogger: createLogger("error"),
  server: { middlewareMode: true, watch: null },
  plugins: cssints(),
});
const client = server.environments.client;
const state = globalThis.__cssints;
const tmp = mkdtempSync(join(root, ".tmp-rename-"));
const url = (name) => `/${tmp.split("/").pop()}/${name}`;
const SHEET = "\0virtual:cssints.css";

const token = (value, name = "brand") =>
  `import * as css from "cssints" with { type: "cssints" };\nexport const ${name} = css.token.color("${value}", "${name}");\nexport const a = css.color(${name});\n`;
const sheet = async () => {
  const { code } = await client.transformRequest(SHEET);
  return JSON.parse(code.match(/const __vite__css = (".*")/)[1]);
};
const write = (name, text) => writeFileSync(join(tmp, name), text);
const emit = async (event, name) => {
  server.watcher.emit(event, join(tmp, name));
  await sleep(300);
};
const initials = (css) =>
  [...css.matchAll(/@property --brand\{[^}]*initial-value:([^}]*)\}/g)].map((m) => m[1]);

try {
  // an unchanged edit, and a new value in the same file
  write("a.ts", token("#ff0000"));
  await client.transformRequest(url("a.ts"));
  await emit("change", "a.ts");
  await client.transformRequest(url("a.ts"));
  write("a.ts", token("#00ff00"));
  await emit("change", "a.ts");
  await client.transformRequest(url("a.ts"));
  assert.deepEqual(initials(await sheet()), ["#00ff00"]);

  // a rename with a new value: a.ts is gone, b.ts declares the name
  renameSync(join(tmp, "a.ts"), join(tmp, "b.ts"));
  await emit("unlink", "a.ts");
  write("b.ts", token("#0000ff"));
  await emit("add", "b.ts");
  await client.transformRequest(url("b.ts"));
  assert.deepEqual(
    initials(await sheet()),
    ["#0000ff"],
    "only the new declaration is in the sheet",
  );

  // a deleted file leaves nothing: its name is free for another file
  rmSync(join(tmp, "b.ts"));
  await emit("unlink", "b.ts");
  assert.ok(
    !state.properties.has("--brand") && !state.defs.has("--brand"),
    "the token is forgotten",
  );
  assert.deepEqual(initials(await sheet()), []);
  write("c.ts", token("#123456"));
  await client.transformRequest(url("c.ts"));
  assert.deepEqual(initials(await sheet()), ["#123456"]);

  // two files that declare the name at once are still an error
  write("d.ts", token("#654321"));
  await assert.rejects(client.transformRequest(url("d.ts")), /--brand is already declared/);
} finally {
  rmSync(tmp, { recursive: true, force: true });
  await server.close();
}
console.log("dev token rename: a renamed or deleted token file frees its names ok");
process.exit(0);

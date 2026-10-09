// dependsOn() (cssints-04u8): a plugin function reads a file outside the server's root. In dev, an edit of the file runs the
// module that called it again and its CSS changes, the module untouched; in `vite build`, the file is a watched file.
// Run: node depends-on.mjs
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

import { build, createServer } from "vite";

import cssints from "../src/plugin.ts";

process.chdir(import.meta.dirname);
const root = `${import.meta.dirname}/fixtures/depends`;
const file = `${import.meta.dirname}/out/swatch.txt`;
mkdirSync("out", { recursive: true });
writeFileSync(file, "red\n");

const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  logLevel: "error",
  server: { middlewareMode: true, ws: false },
  plugins,
});
const client = server.environments.client;
const sheet = async () => {
  await client.transformRequest("/use.ts");
  return plugins[0].api.sheet([`${root}/use.ts`]);
};
try {
  assert.match(await sheet(), /\{color:red\}/);
  writeFileSync(file, "blue\n");
  // the watcher reports the edit, hotUpdate invalidates the module that read the file
  const mod = client.moduleGraph.getModuleById(`${root}/use.ts`);
  for (let i = 0; i < 100 && mod?.transformResult; i++) await sleep(50);
  assert.equal(mod?.transformResult, null, "use.ts was not invalidated");
  assert.match(await sheet(), /\{color:blue\}/);
} finally {
  await server.close();
}

// vite build --watch: an edit of the file builds again, with its new content
const sheets = [];
const watcher = await build({
  root,
  configFile: false,
  logLevel: "error",
  build: { write: false, watch: {}, rollupOptions: { input: `${root}/main.ts` } },
  plugins: [
    cssints(),
    {
      name: "probe",
      generateBundle(_, bundle) {
        const css = Object.values(bundle).find((a) => a.fileName.endsWith(".css"));
        sheets.push(String(css?.source));
      },
    },
  ],
});
try {
  for (let i = 0; i < 200 && sheets.length < 1; i++) await sleep(50);
  assert.match(sheets[0] ?? "", /color:\s*(blue|#00f)/);
  await sleep(500);
  writeFileSync(file, "green\n");
  for (let i = 0; i < 200 && sheets.length < 2; i++) await sleep(50);
  assert.match(sheets[1] ?? "no second build", /color:\s*(green|#008000)/);
} finally {
  await watcher.close();
}
console.log("depends-on: ok");
process.exit(0);

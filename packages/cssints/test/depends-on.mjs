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
// The sheet matches `re` within 20 s. A late FSEvents event (of the write before the server started) can invalidate the
// module mid-way, and the watch dependsOn() adds is not live at once, so a write right after the first transform can be
// missed: `rewrite` writes the edit again each second until the module has read it.
const settled = async (re, rewrite) => {
  let css = await sheet();
  for (let i = 1; i <= 400 && !re.test(css); i++) {
    if (rewrite && i % 20 === 0) writeFileSync(file, i % 40 ? `${rewrite}\n\n` : `${rewrite}\n`);
    await sleep(50);
    css = await sheet();
  }
  return css;
};
try {
  assert.match(await settled(/\{color:red\}/), /\{color:red\}/);
  writeFileSync(file, "blue\n");
  // the watcher reports the edit, hotUpdate invalidates the module that read the file, and it reads the new content
  assert.match(
    await settled(/\{color:blue\}/, "blue"),
    /\{color:blue\}/,
    "use.ts did not read the edit",
  );
} finally {
  await server.close();
}

// vite build --watch: an edit of the file builds again, with its new content. Each wait is on the result, with a generous
// timeout: a busy machine is slow, not wrong.
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
// the latest sheet matches `re`, within 30 s
const built = async (re) => {
  for (let i = 0; i < 600 && !re.test(sheets.at(-1) ?? ""); i++) await sleep(50);
  return sheets.at(-1) ?? "no build";
};
try {
  assert.match(await built(/color:\s*(blue|#00f)/), /color:\s*(blue|#00f)/);
  // rollup watches the file once a build has read it; a write before that is not seen, so write again until a build
  // sees it (in place of a fixed sleep before one write)
  const green = /color:\s*(green|#008000)/;
  for (let i = 0; i < 30 && !green.test(sheets.at(-1) ?? ""); i++) {
    writeFileSync(file, i % 2 ? "green\n\n" : "green\n");
    for (let j = 0; j < 20 && !green.test(sheets.at(-1) ?? ""); j++) await sleep(50);
  }
  assert.match(sheets.at(-1) ?? "no second build", green);
} finally {
  await watcher.close();
}
console.log("depends-on: ok");
process.exit(0);

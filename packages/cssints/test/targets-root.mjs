// The support checks read the browserslist config of the Vite root, not of process.cwd(): two servers in one process,
// on two roots with other targets, each warns for its own. Run: node targets-root.mjs
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createLogger, createServer } from "vite";

import cssints from "../src/plugin.ts";

const make = (name, browserslist) => {
  const root = join(import.meta.dirname, `.tmp-root-${name}`);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root);
  // .browserslistrc, not package.json: the directory stays in the cssints package, which resolves "cssints"
  writeFileSync(join(root, ".browserslistrc"), `${browserslist}\n`);
  writeFileSync(
    join(root, "wrap.ts"),
    `import * as css from "cssints" with { type: "cssints" };\nexport const w = css.textWrap("balance");\n`,
  );
  return root;
};

const open = async (root) => {
  const warnings = [];
  const plugins = cssints();
  const server = await createServer({
    root,
    configFile: false,
    customLogger: { ...createLogger("silent"), warn: (m) => warnings.push(m) },
    server: { middlewareMode: true, watch: null, ws: false, hmr: false },
    plugins,
  });
  return {
    server,
    // every warning of the transform (each root's own server has seen it once already)
    warns: async () => {
      plugins[0].api.forgetWarnings();
      server.environments.client.moduleGraph.invalidateAll();
      warnings.length = 0;
      await server.environments.client.transformRequest("/wrap.ts");
      return warnings.map((w) => w.split("\n")[0].replace(/^.*warning: /, ""));
    },
  };
};

const old = make("old", "chrome 100");
const fresh = make("fresh", "chrome 130");
const { BROWSERSLIST: _b, ...env } = process.env;
process.env = env;
try {
  const a = await open(old);
  const b = await open(fresh);
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(await a.warns(), [
      'text-wrap: the property in "balance" is not supported by chrome 100 (css.properties.text-wrap)',
    ]);
    assert.deepEqual(await b.warns(), []);
  }
  await a.server.close();
  await b.server.close();
} finally {
  rmSync(old, { recursive: true, force: true });
  rmSync(fresh, { recursive: true, force: true });
}
console.log("targets: each Vite root's browserslist, in one process");

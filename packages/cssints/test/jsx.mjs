// A JSX framework that leaves JSX to its own plugin (Solid, Babel setups): tsconfig `jsx: "preserve"`, and a plugin that
// compiles JSX and is listed before cssints(). The engine must evaluate the module (top-level JSX included) in the
// Module Runner whatever the framework does with JSX, and must see the source before that plugin does.
// Run: node jsx.mjs
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { build, createServer, transformWithOxc } from "vite";

import cssints from "../src/plugin.ts";

const root = join(import.meta.dirname, ".tmp-jsx");
rmSync(root, { recursive: true, force: true });
mkdirSync(join(root, "src"), { recursive: true });
writeFileSync(
  join(root, "tsconfig.json"),
  JSON.stringify({ compilerOptions: { jsx: "preserve" } }),
);
writeFileSync(
  join(root, "src/main.tsx"),
  `import { p } from "cssints" with { type: "cssints" };
export const el = <div class={p(4)} />;
export const Item = () => <span class={p(2)} />;
`,
);

let seen = "";
const fakeFramework = () => ({
  name: "fake-jsx-framework",
  enforce: "pre",
  transform(code, id) {
    if (!id.endsWith(".tsx") || this.environment.name !== "client") return;
    seen = code;
    return transformWithOxc(code, id, {
      jsx: { runtime: "classic", pragma: "h", pragmaFrag: "h" },
    });
  },
});
const check = (code) => {
  assert.ok(!seen.includes("p(4)"), `cssints ran first, the framework saw class strings:\n${seen}`);
  assert.match(code, /class: ?"_\w+"/, code);
};

// Dev: the sites run in the ssr environment's runner, from source the framework never compiled for it.
const server = await createServer({
  root,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null },
  plugins: [fakeFramework(), ...cssints()],
});
check((await server.environments.client.transformRequest("/src/main.tsx")).code);
await server.close();

// Build: the private evaluation server has no framework plugin at all.
seen = "";
const out = await build({
  root,
  configFile: false,
  logLevel: "warn",
  build: {
    write: false,
    minify: false,
    rollupOptions: { input: join(root, "src/main.tsx"), preserveEntrySignatures: "strict" },
  },
  plugins: [fakeFramework(), ...cssints()],
});
const js = [out]
  .flat()
  .flatMap((o) => o.output)
  .find((f) => f.fileName.endsWith(".js"));
check(js.code);
rmSync(root, { recursive: true, force: true });
console.log("jsx: preserve and a framework before cssints(): dev and build ok");
process.exit(0);

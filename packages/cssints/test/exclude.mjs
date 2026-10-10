// `exclude`: a project bundles a module that mentions "cssints" without being a site (a plugin package's source). Without
// the option the plugin transforms it and fails; with it the module is left alone, in a build and on the dev server, and the
// sites around it still work (a dev edit that drops the import still drops the rules). Run: node exclude.mjs
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

process.env.BROWSERSLIST = "chrome 130, firefox 130, safari 18";
const { build, createLogger, createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");

const root = import.meta.dirname;
const tmp = mkdtempSync(join(root, ".tmp-exclude-"));
mkdirSync(join(tmp, "lib"));
// What a plugin package looks like to the plugin: a runtime member of "cssints" and no attribute.
writeFileSync(
  join(tmp, "lib/pkg.ts"),
  `import { p } from "cssints";\nexport const marker = "plugin-package-source";\nexport const f = () => typeof p;\n`,
);
const site = `import * as css from "cssints" with { type: "cssints" };
import { marker } from "./lib/pkg.ts";
export const a = css.p(2);
export const m = marker;
`;
writeFileSync(join(tmp, "main.ts"), site);
const options = (exclude) => ({
  root: tmp,
  configFile: false,
  logLevel: "silent",
  plugins: cssints({ exclude }),
});

try {
  // build: the module fails as a site, and passes when excluded (a glob, a RegExp, in an array)
  const bundle = (exclude) =>
    build({
      ...options(exclude),
      build: {
        write: false,
        lib: { entry: join(tmp, "main.ts"), formats: ["es"] },
        rollupOptions: { external: ["cssints"] },
      },
    });
  for (const none of [undefined, []]) await assert.rejects(bundle(none), /without the attribute/);
  for (const exclude of ["**/lib/**", /pkg\.ts$/, ["**/lib/*.ts"]]) {
    const out = await bundle(exclude);
    const code = [out]
      .flat()
      .flatMap((o) => o.output)
      .map((f) => f.code ?? "")
      .join("");
    assert.ok(code.includes("plugin-package-source"), "the module is bundled");
    assert.ok(!code.includes("__at"), "no site wrapper left");
  }

  // dev: transformRequest of the file fails, or returns it as written
  const dev = (exclude) =>
    createServer({
      ...options(exclude),
      customLogger: createLogger("error"),
      server: { middlewareMode: true, watch: null },
    });
  let server = await dev();
  await assert.rejects(
    server.environments.client.transformRequest(`/lib/pkg.ts`),
    /without the attribute/,
  );
  await server.close();

  server = await dev("**/lib/**");
  const client = server.environments.client;
  const lib = await client.transformRequest(`/lib/pkg.ts`);
  assert.ok(lib.code.includes("plugin-package-source") && !lib.code.includes("__at"), lib.code);
  const SHEET = "\0virtual:cssints.css";
  const sheet = async () => {
    const r = await client.transformRequest(SHEET);
    return JSON.parse(r.code.match(/const __vite__css = (".*")/)[1]);
  };
  await client.transformRequest(`/main.ts`);
  assert.ok((await sheet()).includes("padding"), "the site beside it has its rules");
  // the dev drop path: the site loses its import, its rules leave the sheet
  writeFileSync(join(tmp, "main.ts"), `export const a = "plain";\n`);
  server.watcher.emit("change", join(tmp, "main.ts"));
  await sleep(300);
  await client.transformRequest(`/main.ts`);
  assert.ok(!(await sheet()).includes("padding"), "the dropped module's rules are gone");
  await server.close();
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(
  "exclude: a module that mentions cssints is bundled as it is, in a build and in dev ok",
);
process.exit(0);

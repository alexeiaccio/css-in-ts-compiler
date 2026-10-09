// A production build adds nothing of the devtools: apps/demo turns them on (cssints({ devtools: true })), and its build
// output must not hold the overlay, its entry, its events or a script tag for it. Then cssints({ devtools: "build" }) on
// fixtures/app: the table is a JSON asset with the sites (file:line, the call's text, no path of this machine), the overlay
// is a chunk the page does not load, and the entry grows by the loader only.
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import cssints from "cssints/vite";
import { build } from "vite";

const demo = join(import.meta.dirname, "../../../apps/demo");
assert.match(readFileSync(join(demo, "vite.config.ts"), "utf8"), /cssints\(\{ devtools: true \}\)/);
const outDir = mkdtempSync(join(tmpdir(), "devtools-build-"));
process.chdir(demo); // the demo reads @iconify-json/mdi from the working directory
await build({
  root: demo,
  configFile: join(demo, "vite.config.ts"),
  logLevel: "silent",
  build: { outDir, emptyOutDir: true },
});
const files = readdirSync(outDir, { recursive: true, encoding: "utf8" }).filter((f) =>
  /\.(js|css|html)$/.test(f),
);
assert.ok(files.some((f) => f.endsWith(".js")) && files.includes("index.html"), files.join());
for (const f of files) {
  const text = readFileSync(join(outDir, f), "utf8");
  for (const needle of [
    "cssints:devtools",
    "cssints/devtools",
    "cssints-devtools",
    "__open-in-editor",
    "data-cssints-probe",
  ])
    assert.ok(!text.includes(needle), `${f} holds ${needle}`);
}
rmSync(outDir, { recursive: true });
console.log(`devtools build ok: ${files.length} files, none of it`);

const app = join(import.meta.dirname, "fixtures/app");
const output = async (devtools) => {
  const out = await build({
    root: app,
    configFile: false,
    logLevel: "silent",
    plugins: [cssints(devtools ? { devtools } : {})],
    build: { write: false },
  });
  return [out].flat().flatMap((o) => o.output);
};
const plain = await output(undefined);
const withTools = await output("build");
const entryOf = (files) => files.find((f) => f.type === "chunk" && f.isEntry);
assert.ok(
  !plain.some((f) => f.fileName.includes("cssints-devtools")),
  "no asset without the option",
);
const entry = entryOf(withTools);
const overlay = withTools.find((f) => f.type === "chunk" && f.isDynamicEntry);
const asset = withTools.find((f) => /^assets\/cssints-devtools-.*\.json$/.test(f.fileName));
assert.ok(overlay && asset, withTools.map((f) => f.fileName).join());
assert.ok(overlay.code.includes("data-cssints-probe"), "the overlay is the dynamic chunk");
assert.ok(!entry.code.includes("data-cssints-probe"), "the entry holds the loader only");
assert.ok(entry.code.includes(asset.fileName), "the loader names the table");
assert.ok(
  !String(withTools.find((f) => f.fileName === "index.html").source).includes(overlay.fileName),
  "the page does not preload the overlay",
);
// Vite adds its preload helper (~1.5 kB) to a bundle with a first dynamic import; the docs site has one already
const grown = entry.code.length - entryOf(plain).code.length;
assert.ok(grown > 0 && grown < 3000, `the loader is ${grown} bytes`);
const table = JSON.parse(String(asset.source));
assert.equal(table.root, "");
assert.ok(!String(asset.source).includes(app), "no path of this machine in the table");
const site = table.sites.find((s) => s.text === 'color("rebeccapurple")');
assert.deepEqual([site?.file, site?.line], ["main.ts", 5], JSON.stringify(table.sites));
assert.ok(
  site.classes.every((c) => table.classes[c].sites.length),
  "every class names its calls",
);
console.log(
  `devtools build mode ok: loader +${grown} bytes, table ${asset.source.length} bytes, overlay ${overlay.code.length} bytes`,
);

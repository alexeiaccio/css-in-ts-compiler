// A production build adds nothing of the devtools: apps/demo turns them on (cssints({ devtools: true })), and its build
// output must not hold the overlay, its entry, its events or a script tag for it.
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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

// The build check: `vp build` makes one file, dist/main.js, with Solid's universal output (no inert JSX of the cssints
// runner, no server build of solid-js) and @opentui/core as its only external; then, under Bun, the file loads and the
// screen tests (screens.mjs) drive it. Without Bun the Bun half is skipped with a message: OpenTUI's core needs Bun.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const root = `${import.meta.dirname}/..`;
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: "inherit" });

run(process.execPath, [`${root}/../../node_modules/vite-plus/bin/vp`, "build"]);
assert.deepEqual(readdirSync(`${root}/dist`), ["main.js"], "one file");
const out = readFileSync(`${root}/dist/main.js`, "utf8");
const externals = new Set([...out.matchAll(/^import .* from "([^"]+)";$/gm)].map((m) => m[1]));
assert.deepEqual([...externals].toSorted(), ["@opentui/core", "@opentui/core/testing"]);
assert.ok(!out.includes("__jsx("), "no JSX left inert by the cssints runner");
assert.ok(
  out.includes("createElement") || out.includes("createComponent"),
  "Solid's universal output",
);
assert.equal(out.match(/^function createSignal\(/gm)?.length, 1, "one copy of solid-js");
assert.ok(!out.includes("solid-js/dist/server"), "solid-js's client build");
console.log("sky-tui build: one file, universal Solid, @opentui/core external ok");

if (spawnSync("bun", ["--version"]).error) {
  console.log("sky-tui: Bun is not installed, the screen tests are skipped (OpenTUI needs Bun)");
  process.exit(0);
}
run("bun", [
  "-e",
  "const m = await import('./dist/main.js'); if (typeof m.App !== 'function') process.exit(1)",
]);
run("bun", ["test/screens.mjs"]);

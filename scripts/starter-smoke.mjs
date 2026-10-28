// The starter kit's own smoke test: copy the template, install it, add a starter from the live
// registry, and run the copied conformance. What it proves is the whole chain a reader meets —
// template, `components.json`, the published JSON, the plugin versions — not the template alone.
//
//   node scripts/starter-smoke.mjs [--keep]
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const template = join(import.meta.dirname, "..", "templates", "solid-vite");
const keep = process.argv.includes("--keep");
const dest = mkdtempSync(join(tmpdir(), "cssints-starter-"));

const run = (params) => {
  process.stdout.write(`\n$ ${params.command} ${params.args.join(" ")}\n`);
  const result = spawnSync(params.command, params.args, {
    cwd: dest,
    encoding: "utf8",
    timeout: 900_000,
    env: { ...process.env, VITEST: "", NODE_OPTIONS: "" },
  });
  process.stdout.write(`${result.stdout ?? ""}${result.stderr ?? ""}`);
  if (result.status !== 0) {
    process.exitCode = 1;
    throw new Error(`${params.command} exited with ${result.status}`);
  }
};

try {
  cpSync(template, dest, { recursive: true });
  // `--legacy-peer-deps`: a peer range somewhere in the toolchain should not decide whether the
  // template works; the test run is the evidence.
  run({ command: "npm", args: ["install", "--no-audit", "--no-fund", "--legacy-peer-deps"] });
  run({
    command: "npx",
    args: ["--yes", "shadcn@latest", "add", "@cssints/switch", "--yes", "--overwrite"],
  });
  run({ command: "npm", args: ["test"] });
  process.stdout.write(`\nstarter smoke: ok\n`);
} finally {
  if (keep) {
    process.stdout.write(`kept ${dest}\n`);
  } else {
    rmSync(dest, { recursive: true, force: true });
  }
}

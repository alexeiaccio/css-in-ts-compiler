// One pass per workspace: `effect-tsrs` compiles with `tsrs` (the Rust port of tsc 7) and runs the Effect diagnostics of
// `tsconfig.effect.json` on the same types. It exits 1 on errors only; a warning or a suggestion is printed but does not
// fail the run, as `tsc` does.
import { spawnSync } from "node:child_process";

const bin = new URL("../node_modules/.bin/effect-tsrs", import.meta.url).pathname;
const run = spawnSync(
  bin,
  ["diagnostics", "--project", "tsconfig.json", ...process.argv.slice(2)],
  {
    stdio: "inherit",
  },
);

if (run.error) {
  process.stderr.write(`${run.error}\n`);
  process.exit(1);
}

process.exit(run.status ?? 1);

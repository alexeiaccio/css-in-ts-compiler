// `tsc-rs` fails the run on a warning; `tsc` and `effect-tsgo` exit 0 there, and the docs app type-checks the engine's
// sources, whose `@effect-diagnostics` directives have no effect under the app's defaults (three warnings). Print every
// diagnostic and fail on errors only, as `tsc` does.
import { spawnSync } from "node:child_process";

const bin = new URL("../node_modules/.bin/tsc-rs", import.meta.url).pathname;
const run = spawnSync(
  bin,
  ["-p", "tsconfig.json", "--noEmit", "--pretty", "false", ...process.argv.slice(2)],
  {
    encoding: "utf8",
  },
);

const out = `${run.stdout ?? ""}${run.stderr ?? ""}`;
process.stdout.write(out);

if (run.error) {
  process.stderr.write(`${run.error}\n`);
  process.exit(1);
}

// An error line is `file(l,c): error TS1234: …` or a program-level `error TS1234: …`; a warning says `warning TS…`.
const failed = /(^|\s)error TS\d+/.test(out) || (run.status !== 0 && out.trim() === "");
process.exit(failed ? 1 : 0);

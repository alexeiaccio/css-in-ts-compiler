// Instantiation budgets for bench/*.ts, per compiler, minus the bench/empty.ts baseline (attest-style).
// node bench/budget.mjs [dir]          check, exit 1 on regression (> budget * 1.1) or unexpected type errors
// node bench/budget.mjs [dir] --update rewrite budget.json
// `dir` holds the bench files, empty.ts and budget.json (default: this directory; cssints has its own).
import { execFile } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";

const dir = resolve(process.argv.slice(2).find((a) => !a.startsWith("--")) ?? import.meta.dirname);
const root = `${import.meta.dirname}/../../../node_modules`;
// tsc is TypeScript 5.9 by path: node_modules/.bin/tsc may be the native TypeScript 7 that effect-tsgo needs
// (@typescript/native, see the root package.json).
const compilers = {
  tsc: [process.execPath, `${root}/typescript/bin/tsc`],
  tsgo: [`${root}/.bin/tsgo`, "--ignoreConfig"],
};
const expectedErrors = { "err.ts": 3, "errors.ts": 12 };
const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));

const run = (c, f) =>
  promisify(execFile)(
    compilers[c][0],
    [
      ...compilers[c].slice(1),
      "--strict",
      "--noEmit",
      "--skipLibCheck",
      "--module",
      "preserve",
      "--allowImportingTsExtensions",
      // the sources, as in the editor and in the packages' own typecheck (exports without it point at the built dist/)
      "--customConditions",
      "development",
      "--extendedDiagnostics",
      f,
    ],
    { cwd: dir },
  )
    .catch((e) => e)
    .then(({ stdout }) => ({
      inst: +stdout.match(/Instantiations:\s+(\d+)/)[1],
      errors: stdout.match(/error TS/g)?.length ?? 0,
    }));

const raw = {};
await Promise.all(
  Object.keys(compilers).flatMap((c) =>
    files.map(async (f) => ((raw[f] ??= {})[c] = await run(c, f))),
  ),
);

const budgetPath = `${dir}/budget.json`;
const budget = process.argv.includes("--update")
  ? {}
  : JSON.parse(readFileSync(budgetPath, "utf8"));
let fail = false;
const rows = files.map((f) => {
  const row = { file: f };
  for (const c of Object.keys(compilers)) {
    const { inst, errors } = raw[f][c];
    const net = f === "empty.ts" ? inst : inst - raw["empty.ts"][c].inst;
    const b = ((budget[f] ??= {})[c] ??= net);
    const status =
      errors !== (expectedErrors[f] ?? 0)
        ? `${errors} errors!`
        : net > b * 1.1
          ? "OVER"
          : net < b * 0.8
            ? "tighten"
            : "ok";
    if (status !== "ok" && status !== "tighten") fail = true;
    row[c] = `${net} / ${b} ${status}`;
  }
  return row;
});
console.table(rows);
if (process.argv.includes("--update") && !fail)
  writeFileSync(budgetPath, JSON.stringify(budget, null, 2) + "\n");
process.exit(fail ? 1 : 0);

// Instantiation budgets for bench/*.ts, per compiler, minus the bench/empty.ts baseline (attest-style).
// node budget.mjs          check, exit 1 on regression (> budget * 1.1) or unexpected type errors
// node budget.mjs --update rewrite budget.json
import { execFile } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { promisify } from "node:util";

const dir = import.meta.dirname;
const bin = `${dir}/../../node_modules/.bin`;
const compilers = { tsc: [], tsgo: ["--ignoreConfig"] };
const expectedErrors = { "err.ts": 3 };
const files = readdirSync(`${dir}/bench`).filter((f) => f.endsWith(".ts"));

const run = (c, f) =>
  promisify(execFile)(`${bin}/${c}`, [...compilers[c], "--strict", "--noEmit", "--skipLibCheck", "--extendedDiagnostics", `bench/${f}`], { cwd: dir })
    .catch((e) => e)
    .then(({ stdout }) => ({ inst: +stdout.match(/Instantiations:\s+(\d+)/)[1], errors: stdout.match(/error TS/g)?.length ?? 0 }));

const raw = {};
await Promise.all(Object.keys(compilers).flatMap((c) => files.map(async (f) => ((raw[f] ??= {})[c] = await run(c, f)))));

const budgetPath = `${dir}/budget.json`;
const budget = process.argv.includes("--update") ? {} : JSON.parse(readFileSync(budgetPath, "utf8"));
let fail = false;
const rows = files.map((f) => {
  const row = { file: f };
  for (const c of Object.keys(compilers)) {
    const { inst, errors } = raw[f][c];
    const net = f === "empty.ts" ? inst : inst - raw["empty.ts"][c].inst;
    const b = (budget[f] ??= {})[c] ??= net;
    const status = errors !== (expectedErrors[f] ?? 0) ? `${errors} errors!` : net > b * 1.1 ? "OVER" : net < b * 0.8 ? "tighten" : "ok";
    if (status !== "ok" && status !== "tighten") fail = true;
    row[c] = `${net} / ${b} ${status}`;
  }
  return row;
});
console.table(rows);
if (process.argv.includes("--update") && !fail) writeFileSync(budgetPath, JSON.stringify(budget, null, 2) + "\n");
process.exit(fail ? 1 : 0);

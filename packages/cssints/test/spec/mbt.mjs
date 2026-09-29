// Model-based test: replays mbtStep traces of runner.qnt (module fixed) against a real dev server with plugin.mjs
// and compares what each client module serves after every step. Run: node spec/mbt.mjs [nTraces] [maxSteps]
// Traces come straight from `quint run --mbt`; @firfi/quint-connect is not used because its itf-trace-parser
// resolves its optional `effect` peer to whatever Effect bun links (the hoisted Effect 4 on a fresh resolve).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CLIENT, start } from "./harness.mjs";

const v = (x) => (x?.["#bigint"] ? Number(x["#bigint"]) : x?.["#map"] ? Object.fromEntries(x["#map"].map(([k, y]) => [v(k), v(y)])) : x?.["#set"] ? x["#set"].map(v) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, y]) => [k, v(y)])) : x);

const spec = (st) => {
  const s = v(Object.entries(st).find(([k]) => k.endsWith("::s"))[1]);
  return Object.fromEntries(CLIENT.map((c) => {
    const o = s.cached[c];
    return [c, o.src < 0 ? null : { src: o.src, self: o.self, tokens: o.tokens }];
  }));
};

const [nTraces = 10, maxSteps = 8] = process.argv.slice(2).map(Number);
const seed = process.env.QUINT_SEED ?? `0x${Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0")}`;
const dir = mkdtempSync(join(tmpdir(), "quint-"));
const args = ["run", `${import.meta.dirname}/runner.qnt`, "--main", "fixed", "--init", "init", "--step", "mbtStep", "--mbt",
  "--backend", "rust", "--seed", seed, "--n-traces", String(nTraces), "--max-steps", String(maxSteps),
  "--max-samples", String(nTraces), // quint run keeps sampling up to maxSamples, default 10000
  "--out-itf", join(dir, "trace_{seq}.itf.json")];
let server;
try {
  const opts = { stdio: ["ignore", "ignore", "inherit"] };
  try {
    execFileSync(process.env.QUINT_BIN ?? "quint", args, opts);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
    execFileSync("npx", ["@informalsystems/quint", ...args], opts);
  }
  const traces = readdirSync(dir).sort();
  if (!traces.length) throw new Error("quint wrote no traces");
  for (const file of traces) {
    const s = (server = await start());
    s.gate("card", "button", "tokens"); // every ssr transform of an app file waits for mbtFetchDone
    const actions = {
      init: () => {},
      mbtEdit: ({ f }) => s.edit(f),
      mbtWatch: ({ f }) => s.watch(f),
      mbtRequest: ({ c }) => s.request(c),
      mbtFetchDone: ({ f }) => s.release(f),
    };
    for (const [i, st] of JSON.parse(readFileSync(join(dir, file), "utf8")).states.entries()) {
      const action = st["mbt::actionTaken"];
      const picks = Object.fromEntries(Object.entries(v(st["mbt::nondetPicks"])).filter(([, p]) => p.tag === "Some").map(([k, p]) => [k, p.value]));
      await actions[action](picks);
      const want = spec(st);
      const got = Object.fromEntries(CLIENT.map((c) => [c, s.served(c)]));
      if (JSON.stringify(got) !== JSON.stringify(want)) {
        throw new Error(`${file} state ${i} ${action} ${JSON.stringify(picks)}: served ${JSON.stringify(got)}, model ${JSON.stringify(want)} (QUINT_SEED=${seed})`);
      }
    }
    await server.close();
    server = undefined;
  }
  console.log(`ok: ${traces.length} traces x ${maxSteps} steps, seed ${seed}`);
} finally {
  await server?.close();
  rmSync(dir, { recursive: true, force: true });
}
process.exit(0);

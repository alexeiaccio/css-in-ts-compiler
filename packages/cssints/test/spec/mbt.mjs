// Model-based test: replays mbtStep traces of runner.qnt (module fixed) against a real dev server with plugin.mjs
// and compares what each client module serves after every step. Run: node spec/mbt.mjs [nTraces] [maxSteps]
// @firfi/quint-connect@effect4 is not used: its itf-trace-parser takes this package's effect 4.0.0-beta.107 as
// its peer while quint-connect runs on its own effect 4.0.0-rc.112, and pick decoding fails. latest (Effect 3,
// nested under it) with Zod works.
import { defineDriver, run, stateCheck } from "@firfi/quint-connect";
import { z } from "zod";

import { CLIENT, start } from "./harness.mjs";

const str = z.string();
let server; // the previous trace's, closed when the next trace starts

const driver = async () => {
  await server?.close();
  const s = (server = await start());
  s.gate("card", "button", "tokens"); // every ssr transform of an app file waits for mbtFetchDone
  return defineDriver({ init: {}, mbtEdit: { f: str }, mbtWatch: { f: str }, mbtRequest: { c: str }, mbtFetchDone: { f: str } }, () => ({
    init: () => {},
    mbtEdit: ({ f }) => s.edit(f),
    mbtWatch: ({ f }) => s.watch(f),
    mbtRequest: ({ c }) => s.request(c),
    mbtFetchDone: ({ f }) => s.release(f),
    getState: () => Object.fromEntries(CLIENT.map((c) => [c, s.served(c)])),
  }))();
};

const spec = (raw) => {
  const st = [...Object.entries(raw)].find(([k]) => k.endsWith("::s"))[1];
  return Object.fromEntries(CLIENT.map((c) => {
    const o = st.cached.get(c);
    return [c, o.src < 0n ? null : { src: Number(o.src), self: Number(o.self), tokens: Number(o.tokens) }];
  }));
};

const [nTraces = 10, maxSteps = 8] = process.argv.slice(2).map(Number);
try {
  const r = await run({
    spec: `${import.meta.dirname}/runner.qnt`,
    main: "fixed",
    init: "init",
    step: "mbtStep",
    nTraces,
    maxSamples: nTraces, // quint run keeps sampling up to maxSamples, default 10000
    maxSteps,
    driver,
    stateCheck: stateCheck(spec, (a, b) => JSON.stringify(a) === JSON.stringify(b)),
  });
  console.log(`ok: ${r.tracesReplayed} traces x ${maxSteps} steps, seed ${r.seed}`);
} finally {
  await server?.close();
}
process.exit(0);

// Edits that land while a transform is in flight (the counterexamples of runner.qnt). After each scenario
// the server is drained and every client module is requested again, as the browser does after HMR:
// what it then serves must match the current sources. Run: node spec/race.mjs
import { CLIENT, start } from "./harness.mjs";

const scenarios = {
  // tokens.ts is saved while card.ts is transformed for the first time (depsOf does not know card yet).
  async firstTransform(s) {
    s.gate("tokens");
    await s.request("card"); // held after reading tokens v0
    s.edit("tokens");
    await s.watch("tokens");
  },
  // tokens.ts is saved twice in a row (git checkout, a formatter on save): the transforms after the second
  // save join a runner fetch of the first version, started by the runner's own HMR re-import.
  async doubleSave(s) {
    await s.request("card");
    await s.request("button");
    s.gate("tokens");
    s.edit("tokens");
    await s.watch("tokens"); // the runner re-imports card, its fetch of tokens v1 is held
    s.edit("tokens");
    await s.watch("tokens");
    await s.request("card");
    await s.request("button");
  },
};

let failed = false;
for (const [name, run] of Object.entries(scenarios)) {
  const s = await start();
  try {
    await run(s);
    s.ungate();
    await s.release("tokens");
    for (const c of CLIENT) if (!s.served(c)) await s.request(c);
    for (const c of CLIENT) {
      const want = { src: s.disk[c], self: s.disk[c], tokens: s.disk.tokens };
      const ok = JSON.stringify(s.served(c)) === JSON.stringify(want);
      failed ||= !ok;
      console.log(
        `${name.padEnd(15)} ${c.padEnd(6)} served ${JSON.stringify(s.served(c))} ${ok ? "fresh" : `STALE, sources ${JSON.stringify(want)}`}`,
      );
    }
    if (s.errors.length) console.log(`${name.padEnd(15)} errors: ${s.errors.join("; ")}`);
  } finally {
    await s.close();
  }
}
process.exit(failed ? 1 : 0);

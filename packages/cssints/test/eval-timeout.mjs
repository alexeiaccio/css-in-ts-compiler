// An evaluation that takes longer than the limit fails, and does not go on in the background: what it would have loaded
// next registers nothing, and the next evaluation runs on a new runner. Run: node eval-timeout.mjs
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";

// read once, when evaluate.ts loads
process.env.CSSINTS_EVAL_TIMEOUT = "1500";
const { createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");

const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  logLevel: "warn",
  server: { middlewareMode: true, watch: null },
  plugins: cssints(),
});
const client = server.environments.client;

await assert.rejects(
  client.transformRequest("/fixtures/eval-timeout.ts"),
  /eval-timeout.ts took more than 1.5 seconds/,
);
await sleep(3000); // the wait is over: without the close, the import goes on to eval-timeout-late.ts
assert.ok(
  !globalThis.__cssints.properties.has("--color-late"),
  "the late module registered a token",
);

const ok = await client.transformRequest("/fixtures/tokens-clash-a.ts");
assert.match(ok.code, /var\(--color-clash\)/, "the next evaluation runs");

console.log(
  "eval-timeout: a timed-out evaluation stops at its next module; the next one runs on a new runner",
);
await server.close();

// Live check of CSSINTS_TRACE=otlp against a real backend (Jaeger all-in-one; docs/API.md "Debugging"). Not part of
// `bun run test`: it needs the backend, and skips (exit 0) when it is not there.
//   docker run -d --rm --name cssints-jaeger -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one:latest
//   node test/trace-live.mjs            JAEGER=http://localhost:16686 CSSINTS_OTLP=http://localhost:4318
// Builds apps/csssky and runs its HMR test (a style edit, a component edit), both traced, then reads the traces back
// through Jaeger's HTTP API and prints the span counts and the slowest spans of each.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const jaeger = process.env.JAEGER ?? "http://localhost:16686";
const otlp = process.env.CSSINTS_OTLP ?? "http://localhost:4318";
const sky = `${import.meta.dirname}/../../../apps/csssky`;

const reachable = await fetch(`${jaeger}/api/services`).then(
  (r) => r.ok,
  () => false,
);
if (!reachable) {
  console.log(`trace-live: no Jaeger at ${jaeger}, skipped`);
  process.exit(0);
}

const run = (cmd, args) =>
  execFileSync(cmd, args, {
    cwd: sky,
    env: { ...process.env, CSSINTS_TRACE: `otlp:${otlp}` },
    stdio: ["ignore", "ignore", "inherit"],
  });

// Every span of the service since `from` (µs), once the backend has stopped receiving more.
const spansSince = async (from) => {
  let last = -1;
  for (let i = 0; i < 20; i++) {
    const { data } = await (
      await fetch(`${jaeger}/api/traces?service=cssints&start=${from}&limit=1500`)
    ).json();
    const spans = (data ?? []).flatMap((t) => t.spans);
    if (spans.length && spans.length === last) return spans;
    last = spans.length;
    await sleep(1000);
  }
  throw new Error("the traces did not settle");
};

const tag = (s, key) => s.tags.find((t) => t.key === key)?.value;
const summary = (label, spans) => {
  const count = (names) => {
    const out = {};
    for (const n of names) out[n] = (out[n] ?? 0) + 1;
    return out;
  };
  console.log(`\n${label}: ${spans.length} spans`, count(spans.map((s) => s.operationName)));
  const events = count(
    spans.flatMap((s) => s.logs.map((l) => l.fields.find((f) => f.key === "event")?.value)),
  );
  console.log("span events:", events);
  // evaluate includes the wait for the evaluation lock; runner.import is the module running in the Module Runner
  for (const { title, keep } of [
    { title: "slowest hooks", keep: (s) => s.operationName.startsWith("vite.") },
    {
      title: "slowest Module Runner evals",
      keep: (s) => s.operationName === "cssints.runner.import",
    },
  ]) {
    console.log(`${title}:`);
    for (const s of spans
      .filter(keep)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 4))
      console.log(
        `  ${(s.duration / 1000).toFixed(1).padStart(8)} ms  ${s.operationName}  ${tag(s, "file")?.replace(/^.*\/(apps|packages)\//, "$1/") ?? ""}`,
      );
  }
};

const t0 = Date.now() * 1000;
run(`${import.meta.dirname}/../../../node_modules/.bin/vp`, ["build"]);
const build = await spansSince(t0);
summary("sky build", build);
for (const name of [
  "vite.transform",
  "cssints.evaluate",
  "cssints.runner.import",
  "vite.renderChunk",
  "cssints.renderSheet",
  "cssints.lightningcss",
  "vite.buildEnd",
])
  assert.ok(
    build.some((s) => s.operationName === name),
    `${name} in the build`,
  );
assert.ok(
  build.some(
    (s) => s.operationName === "vite.transform" && tag(s, "file")?.endsWith("/src/Shell.tsx"),
  ),
  "the file of a module is an attribute",
);

const t1 = Date.now() * 1000;
run("node", ["test/dev.mjs"]);
const dev = (await spansSince(t1)).filter((s) => s.startTime >= t1);
summary("sky dev + HMR edits", dev);
const hot = dev.filter((s) => s.operationName === "vite.hotUpdate");
assert.ok(
  hot.some((s) => tag(s, "file")?.endsWith("/src/Shell.tsx")),
  "a hotUpdate span for the edited file",
);
console.log("\ntrace-live: ok");

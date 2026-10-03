// CSSINTS_TRACE=otlp against an in-process collector (an http server that keeps what the exporter posts), no backend needed:
// the spans of one fixture, the file as attribute, the id of the trace on the error that reaches Vite, and the span event
// of that error (file and offset). With CSSINTS_TRACE unset, test/trace-live.mjs and the docs ("Debugging") do the rest.
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer as httpServer } from "node:http";

const spans = [];
const collector = httpServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    for (const rs of JSON.parse(body).resourceSpans ?? [])
      for (const ss of rs.scopeSpans) spans.push(...ss.spans);
    res.end("{}");
  });
});
await once(collector.listen(0, "127.0.0.1"), "listening");
process.env.CSSINTS_TRACE = `otlp:http://127.0.0.1:${collector.address().port}`;

const { createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");
const { closeTrace } = await import("../src/trace.ts");

const root = import.meta.dirname;
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  logLevel: "silent",
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
await client.transformRequest("/fixtures/risk1.ts");
await client.transformRequest("/fixtures/line-clamp-std.ts"); // a support warning
const error = await client.transformRequest("/fixtures/invalid.ts").then(
  () => undefined,
  (e) => e,
);
const main = plugins[0];
main.hotUpdate.call({ environment: client }, { file: `${root}/fixtures/risk1.ts`, modules: [] });
await server.close(); // closeBundle: the exporter's last flush
await closeTrace();
await once(collector.close(), "close");

const attr = (s, key) => s.attributes?.find((a) => a.key === key)?.value.stringValue;
const named = (name, file) =>
  spans.filter((s) => s.name === name && (!file || attr(s, "file")?.endsWith(file)));

const transform = named("vite.transform", "fixtures/risk1.ts").find(
  (s) => attr(s, "environment") === "client",
);
assert.ok(transform, "a vite.transform span with the file of the fixture");
const inTrace = (s) => s.traceId === transform.traceId;
for (const name of [
  "cssints.transform",
  "cssints.instrument",
  "cssints.clientTransform",
  "cssints.evaluate",
  "cssints.runner.import",
])
  assert.ok(
    spans.some((s) => s.name === name && inTrace(s)),
    `${name} in the trace of the module`,
  );
assert.ok(named("vite.hotUpdate", "fixtures/risk1.ts").length, "a vite.hotUpdate span");

assert.ok(error?.traceId, "the error carries the trace id");
assert.match(error.message, new RegExp(`trace ${error.traceId}`));
const failed = spans.find((s) => s.traceId === error.traceId && s.name === "vite.transform");
const event = failed?.events?.find((e) => e.name === "cssints.error");
assert.ok(event, "the failed hook has an error event");
const kv = Object.fromEntries(event.attributes.map((a) => [a.key, a.value]));
assert.ok(kv.file.stringValue.endsWith("fixtures/invalid.ts"), "the event names the file");
assert.ok(Number(kv.offset.intValue ?? kv.offset.doubleValue) > 0, "and the offset");
const warning = spans.flatMap((s) => s.events ?? []).find((e) => e.name === "cssints.warning");
assert.ok(warning, "a support warning is an event");
assert.ok(attr(warning, "file").endsWith("fixtures/line-clamp-std.ts"), "naming its file");
console.log(`trace: ${spans.length} spans, ${new Set(spans.map((s) => s.name)).size} names`);
